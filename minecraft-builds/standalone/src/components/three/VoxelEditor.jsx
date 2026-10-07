import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { blockColor, BLOCK_PALETTE } from '../../utils/blockColors';

const GRID_SIZE = 20;

// Voxel-Baukasten: Blöcke werden Etage für Etage platziert/gelöscht.
// Gibt bei jeder Änderung die vollständige Blockliste über onChange zurück.
export default function VoxelEditor({ initialBlocks = [], onChange, height = 480 }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const meshMapRef = useRef(new Map()); // "x,y,z" -> mesh
  const groundRef = useRef(null);
  const blocksRef = useRef(initialBlocks.map((b) => ({ ...b })));

  const [layer, setLayer] = useState(() => {
    const ys = initialBlocks.map((b) => b.y);
    return ys.length ? Math.max(...ys) : 0;
  });
  const [selectedType, setSelectedType] = useState(BLOCK_PALETTE[0]);
  const [mode, setMode] = useState('place'); // 'place' | 'erase'
  const [blockCount, setBlockCount] = useState(initialBlocks.length);
  const layerRef = useRef(layer);
  const modeRef = useRef(mode);
  const selectedTypeRef = useRef(selectedType);

  useEffect(() => { layerRef.current = layer; }, [layer]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { selectedTypeRef.current = selectedType; }, [selectedType]);

  function emitChange() {
    setBlockCount(blocksRef.current.length);
    onChange?.(blocksRef.current);
  }

  function key(x, y, z) {
    return `${x},${y},${z}`;
  }

  function redrawBlocks() {
    const { scene } = sceneRef.current;
    for (const mesh of meshMapRef.current.values()) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    meshMapRef.current.clear();
    const geometry = new THREE.BoxGeometry(0.98, 0.98, 0.98);
    for (const b of blocksRef.current) {
      if (b.y > layerRef.current) continue;
      const opacity = b.y === layerRef.current ? 1 : 0.55;
      const material = new THREE.MeshStandardMaterial({
        color: blockColor(b.blockType),
        transparent: opacity < 1,
        opacity,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(b.x, b.y, b.z);
      mesh.userData.key = key(b.x, b.y, b.z);
      scene.add(mesh);
      meshMapRef.current.set(mesh.userData.key, mesh);
    }
  }

  // Setup (einmalig)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x11141a);
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / height, 0.1, 1000);
    camera.position.set(14, 14, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(GRID_SIZE / 4, 0, GRID_SIZE / 4);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(8, 15, 10);
    scene.add(dirLight);

    const grid = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, 0x475569, 0x1e293b);
    scene.add(grid);

    const groundGeo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
    const groundMat = new THREE.MeshBasicMaterial({ visible: false });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(GRID_SIZE / 4, 0, GRID_SIZE / 4);
    scene.add(ground);
    groundRef.current = ground;

    sceneRef.current = { scene, camera, renderer, controls };
    redrawBlocks();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function onClick(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      if (modeRef.current === 'erase') {
        const meshes = [...meshMapRef.current.values()];
        const hits = raycaster.intersectObjects(meshes);
        if (hits.length > 0) {
          const hitMesh = hits[0].object;
          blocksRef.current = blocksRef.current.filter(
            (b) => key(b.x, b.y, b.z) !== hitMesh.userData.key,
          );
          redrawBlocks();
          emitChange();
        }
        return;
      }

      // Platzieren: gegen die Bodenebene der aktuellen Etage raycasten
      groundRef.current.position.y = layerRef.current;
      const hits = raycaster.intersectObject(groundRef.current);
      if (hits.length === 0) return;
      const x = Math.round(hits[0].point.x);
      const z = Math.round(hits[0].point.z);
      const y = layerRef.current;
      blocksRef.current = blocksRef.current.filter((b) => key(b.x, b.y, b.z) !== key(x, y, z));
      blocksRef.current.push({ x, y, z, blockType: selectedTypeRef.current });
      redrawBlocks();
      emitChange();
    }
    renderer.domElement.addEventListener('click', onClick);

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = container.clientWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', onClick);
      controls.dispose();
      renderer.dispose();
      container.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  useEffect(() => {
    if (sceneRef.current) redrawBlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer]);

  function clearAll() {
    if (!window.confirm('Alle Blöcke dieses Builds löschen?')) return;
    blocksRef.current = [];
    redrawBlocks();
    emitChange();
  }

  const layerBlockCount = useMemo(
    () => blocksRef.current.filter((b) => b.y === layer).length,
    [layer, blockCount],
  );

  return (
    <div className="space-y-3">
      <div ref={containerRef} style={{ height }} className="w-full rounded-xl overflow-hidden border border-slate-800 cursor-crosshair" />

      <div className="card p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Etage (y):</span>
            <button className="btn-secondary !px-2 !py-1" onClick={() => setLayer((l) => Math.max(0, l - 1))}>−</button>
            <span className="w-8 text-center font-mono">{layer}</span>
            <button className="btn-secondary !px-2 !py-1" onClick={() => setLayer((l) => l + 1)}>+</button>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={mode === 'place' ? 'btn-primary !py-1' : 'btn-secondary !py-1'}
              onClick={() => setMode('place')}
            >
              🧱 Platzieren
            </button>
            <button
              className={mode === 'erase' ? 'btn-danger !py-1' : 'btn-secondary !py-1'}
              onClick={() => setMode('erase')}
            >
              🗑️ Löschen
            </button>
          </div>
          <span className="text-xs text-slate-500 ml-auto">
            {blockCount} Blöcke gesamt · {layerBlockCount} in dieser Etage
          </span>
          <button className="btn-ghost text-xs text-red-400" onClick={clearAll}>Alles löschen</button>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-1.5">Blocktyp</p>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {BLOCK_PALETTE.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                title={type}
                className={`h-8 w-8 rounded border-2 ${selectedType === type ? 'border-emerald-400 scale-110' : 'border-slate-700'} transition-transform`}
                style={{ backgroundColor: blockColor(type) }}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">Ausgewählt: {selectedType}</p>
        </div>
      </div>
    </div>
  );
}
