import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { blockColor } from '../../utils/blockColors';

// Interaktiver 3D-Viewer: zeigt Blöcke bis zur eingestellten Ebene, drehbar/zoombar,
// mit ein-/ausblendbaren Einzelebenen.
export default function VoxelViewer({ blocks, height = 420 }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const meshesRef = useRef([]);

  const layers = useMemo(() => [...new Set(blocks.map((b) => b.y))].sort((a, b) => a - b), [blocks]);
  const [maxLayer, setMaxLayer] = useState(layers.length ? layers[layers.length - 1] : 0);
  const [hiddenLayers, setHiddenLayers] = useState(() => new Set());

  useEffect(() => {
    setMaxLayer(layers.length ? layers[layers.length - 1] : 0);
  }, [layers.length]);

  // Three.js Setup (einmalig)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x11141a);
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(8, 15, 10);
    scene.add(dirLight);

    const grid = new THREE.GridHelper(30, 30, 0x334155, 0x1e293b);
    scene.add(grid);

    sceneRef.current = { scene, camera, renderer, controls };

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [height]);

  // Kamera auf Modellmitte ausrichten, wenn sich die Blockliste ändert
  useEffect(() => {
    if (!sceneRef.current || blocks.length === 0) return;
    const { camera, controls } = sceneRef.current;
    const xs = blocks.map((b) => b.x);
    const ys = blocks.map((b) => b.y);
    const zs = blocks.map((b) => b.z);
    const center = new THREE.Vector3(
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
      (Math.min(...zs) + Math.max(...zs)) / 2,
    );
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs), 5);
    camera.position.set(center.x + span, center.y + span * 0.9, center.z + span);
    controls.target.copy(center);
    controls.update();
  }, [blocks.length]);

  // Blöcke neu zeichnen bei Änderung von maxLayer / hiddenLayers / blocks
  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene } = sceneRef.current;
    for (const mesh of meshesRef.current) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    meshesRef.current = [];

    const geometry = new THREE.BoxGeometry(0.98, 0.98, 0.98);
    const visible = blocks.filter((b) => b.y <= maxLayer && !hiddenLayers.has(b.y));
    for (const b of visible) {
      const material = new THREE.MeshStandardMaterial({ color: blockColor(b.block_type ?? b.blockType) });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(b.x, b.y, b.z);
      scene.add(mesh);
      meshesRef.current.push(mesh);
    }
  }, [blocks, maxLayer, hiddenLayers]);

  function toggleLayer(y) {
    setHiddenLayers((prev) => {
      const next = new Set(prev);
      next.has(y) ? next.delete(y) : next.add(y);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div ref={containerRef} style={{ height }} className="w-full rounded-xl overflow-hidden border border-slate-800" />
      <div className="card p-3 space-y-3">
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Baufortschritt (Schicht für Schicht)</span>
            <span>Ebene {maxLayer} / {layers.length ? layers[layers.length - 1] : 0}</span>
          </div>
          <input
            type="range"
            min={layers[0] ?? 0}
            max={layers.length ? layers[layers.length - 1] : 0}
            value={maxLayer}
            onChange={(e) => setMaxLayer(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between mt-2">
            <button className="btn-secondary !py-1 !px-3 text-xs" onClick={() => setMaxLayer((l) => Math.max(layers[0] ?? 0, l - 1))}>
              ← Vorherige Ebene
            </button>
            <button
              className="btn-secondary !py-1 !px-3 text-xs"
              onClick={() => setMaxLayer((l) => Math.min(layers[layers.length - 1] ?? 0, l + 1))}
            >
              Nächste Ebene →
            </button>
          </div>
        </div>

        {layers.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Ebenen ein-/ausblenden</p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {layers
                .filter((y) => y <= maxLayer)
                .map((y) => (
                  <button
                    key={y}
                    onClick={() => toggleLayer(y)}
                    className={`px-2 py-1 rounded text-xs border ${
                      hiddenLayers.has(y)
                        ? 'border-slate-700 text-slate-500 line-through'
                        : 'border-emerald-600 text-emerald-400'
                    }`}
                  >
                    y={y}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
