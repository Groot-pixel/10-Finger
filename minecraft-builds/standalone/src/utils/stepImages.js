import { blockColor } from './blockColors';

// Zerlegt eine Blockliste in Bau-Schritte (max. `chunkSize` neue Blöcke pro Ebene und Schritt) –
// dieselbe Logik wie im Server-Seed der Vollversion, hier rein clientseitig für den Solo-Modus.
export function buildStepsFromBlocks(blocks, chunkSize = 8) {
  if (blocks.length === 0) return [];
  const byLayer = new Map();
  for (const b of blocks) {
    if (!byLayer.has(b.y)) byLayer.set(b.y, []);
    byLayer.get(b.y).push(b);
  }
  const layers = [...byLayer.keys()].sort((a, b) => a - b);
  const minX = Math.min(...blocks.map((b) => b.x));
  const maxX = Math.max(...blocks.map((b) => b.x));
  const minZ = Math.min(...blocks.map((b) => b.z));
  const maxZ = Math.max(...blocks.map((b) => b.z));

  const steps = [];
  const placedSoFarByLayer = new Map();
  for (const y of layers) {
    const blocksAtLayer = byLayer.get(y);
    for (let i = 0; i < blocksAtLayer.length; i += chunkSize) {
      const chunk = blocksAtLayer.slice(i, i + chunkSize);
      const existing = placedSoFarByLayer.get(y) || [];
      steps.push({ layerY: y, fresh: chunk, existing: [...existing], minX, maxX, minZ, maxZ });
      placedSoFarByLayer.set(y, [...existing, ...chunk]);
    }
  }
  return steps;
}

function svgMarkupForStep({ minX, maxX, minZ, maxZ, layerY, existing, fresh, cellSize = 40 }) {
  const w = (maxX - minX + 1) * cellSize;
  const h = (maxZ - minZ + 1) * cellSize;
  const pad = 30;
  let rects = '';
  const key = (x, z) => `${x},${z}`;
  const existingMap = new Map(existing.map((b) => [key(b.x, b.z), b.blockType]));
  const freshMap = new Map(fresh.map((b) => [key(b.x, b.z), b.blockType]));

  for (let x = minX; x <= maxX; x++) {
    for (let z = minZ; z <= maxZ; z++) {
      const px = (x - minX) * cellSize;
      const pz = (z - minZ) * cellSize;
      const isFresh = freshMap.has(key(x, z));
      const isExisting = existingMap.has(key(x, z));
      let fill = '#20242c';
      let stroke = '#3a3f4b';
      let strokeWidth = 1;
      if (isExisting) fill = blockColor(existingMap.get(key(x, z))) + 'aa';
      if (isFresh) {
        fill = blockColor(freshMap.get(key(x, z)));
        stroke = '#ffcc33';
        strokeWidth = 3;
      }
      rects += `<rect x="${px + pad}" y="${pz + pad}" width="${cellSize - 2}" height="${cellSize - 2}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" rx="3"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w + pad * 2}" height="${h + pad * 2 + 30}" viewBox="0 0 ${w + pad * 2} ${h + pad * 2 + 30}">
    <rect width="100%" height="100%" fill="#14161b"/>
    <text x="${pad}" y="20" fill="#e8e8e8" font-family="sans-serif" font-size="16">Draufsicht – Ebene y=${layerY}</text>
    ${rects}
    <text x="${pad}" y="${h + pad * 2 + 18}" fill="#9aa0ab" font-family="sans-serif" font-size="12">Gelb umrandet = in diesem Schritt neu platziert</text>
  </svg>`;
}

export function svgDataUrlForStep(step) {
  const svg = svgMarkupForStep(step);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Erzeugt eine vollständige Bild-Anleitung (Data-URLs) direkt aus Blockdaten –
// nützlich als automatischer Platzhalter, solange keine echten Fotos hochgeladen wurden.
export function generateStepImagesFromBlocks(blocks) {
  return buildStepsFromBlocks(blocks).map((step, i) => ({
    id: `auto-${i}`,
    dataUrl: svgDataUrlForStep(step),
    description: `Platziere ${step.fresh.length} Block(e) in Ebene y=${step.layerY}.`,
    auto: true,
  }));
}
