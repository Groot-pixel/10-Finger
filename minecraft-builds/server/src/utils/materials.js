import { blockDisplayName } from './blockNames.js';

export function computeMaterials(blocks) {
  const counts = new Map();
  for (const b of blocks) {
    counts.set(b.block_type, (counts.get(b.block_type) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([blockType, count]) => ({
      blockType,
      count,
      nameJava: blockDisplayName(blockType, 'java'),
      nameBedrock: blockDisplayName(blockType, 'bedrock'),
      stacks: Math.floor(count / 64),
      remainder: count % 64,
    }))
    .sort((a, b) => b.count - a.count);
}

export function materialsToText(materials, buildTitle) {
  const lines = [
    `Materialliste: ${buildTitle}`,
    '='.repeat(40),
    '',
    ...materials.map(
      (m) =>
        `${String(m.count).padStart(4)}x  ${m.nameJava} (Bedrock: ${m.nameBedrock})` +
        (m.stacks > 0 ? `  [${m.stacks} Stack${m.stacks > 1 ? 's' : ''}${m.remainder ? ` + ${m.remainder}` : ''}]` : ''),
    ),
    '',
    `Gesamt: ${materials.reduce((s, m) => s + m.count, 0)} Blöcke`,
  ];
  return lines.join('\n');
}
