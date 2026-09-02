import { blockDisplayName } from './blockNames';

export function computeMaterials(blocks) {
  const counts = new Map();
  for (const b of blocks) {
    counts.set(b.blockType, (counts.get(b.blockType) || 0) + 1);
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
