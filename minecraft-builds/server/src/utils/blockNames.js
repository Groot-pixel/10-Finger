// Anzeigename je Edition. Fällt zurück auf den internen Key, falls keine
// abweichende Bedrock-Bezeichnung bekannt ist (die meisten Blöcke heißen gleich).
export const BLOCK_CATALOG = [
  { key: 'oak_planks', java: 'Eichenholz-Planken', bedrock: 'Oak Planks', color: '#b8875a' },
  { key: 'oak_log', java: 'Eichenstamm', bedrock: 'Oak Log', color: '#6f5335' },
  { key: 'spruce_planks', java: 'Fichtenholz-Planken', bedrock: 'Spruce Planks', color: '#7a5a35' },
  { key: 'spruce_log', java: 'Fichtenstamm', bedrock: 'Spruce Log', color: '#4a3a26' },
  { key: 'stone', java: 'Stein', bedrock: 'Stone', color: '#8a8a8a' },
  { key: 'cobblestone', java: 'Bruchstein', bedrock: 'Cobblestone', color: '#7d7d7d' },
  { key: 'stone_bricks', java: 'Steinziegel', bedrock: 'Stone Bricks', color: '#8f8f86' },
  { key: 'cracked_stone_bricks', java: 'Rissige Steinziegel', bedrock: 'Cracked Stone Bricks', color: '#7f7f76' },
  { key: 'glass', java: 'Glas', bedrock: 'Glass', color: '#bfe3f0' },
  { key: 'glass_pane', java: 'Glasscheibe', bedrock: 'Glass Pane', color: '#cdeaf5' },
  { key: 'white_wool', java: 'Weiße Wolle', bedrock: 'White Wool', color: '#e9e9e9' },
  { key: 'quartz_block', java: 'Quarzblock', bedrock: 'Quartz Block', color: '#ece6da' },
  { key: 'quartz_pillar', java: 'Gerillter Quarzblock', bedrock: 'Quartz Pillar', color: '#e5dfd2' },
  { key: 'sandstone', java: 'Sandstein', bedrock: 'Sandstone', color: '#dcd0a0' },
  { key: 'smooth_sandstone', java: 'Glatter Sandstein', bedrock: 'Smooth Sandstone', color: '#e0d5a8' },
  { key: 'sand', java: 'Sand', bedrock: 'Sand', color: '#e3d9a3' },
  { key: 'dirt', java: 'Erde', bedrock: 'Dirt', color: '#7a5533' },
  { key: 'grass_block', java: 'Grasblock', bedrock: 'Grass Block', color: '#6ea94c' },
  { key: 'water', java: 'Wasser', bedrock: 'Water', color: '#3d6fd1' },
  { key: 'obsidian', java: 'Obsidian', bedrock: 'Obsidian', color: '#180d29' },
  { key: 'netherrack', java: 'Netherrack', bedrock: 'Netherrack', color: '#733333' },
  { key: 'brick', java: 'Ziegel', bedrock: 'Bricks', color: '#9a5b4c' },
  { key: 'dark_oak_planks', java: 'Schwarzeichenholz-Planken', bedrock: 'Dark Oak Planks', color: '#3e2c17' },
  { key: 'birch_planks', java: 'Birkenholz-Planken', bedrock: 'Birch Planks', color: '#d7c78b' },
  { key: 'terracotta', java: 'Terrakotta', bedrock: 'Terracotta', color: '#9a5230' },
  { key: 'iron_block', java: 'Eisenblock', bedrock: 'Block of Iron', color: '#dcdcdc' },
  { key: 'gold_block', java: 'Goldblock', bedrock: 'Block of Gold', color: '#fcee4b' },
  { key: 'lantern', java: 'Laterne', bedrock: 'Lantern', color: '#f2c05a' },
  { key: 'torch', java: 'Fackel', bedrock: 'Torch', color: '#ffb347' },
  { key: 'oak_stairs', java: 'Eichenholztreppe', bedrock: 'Oak Stairs', color: '#b8875a' },
  { key: 'stone_brick_stairs', java: 'Steinziegeltreppe', bedrock: 'Stone Brick Stairs', color: '#8f8f86' },
  { key: 'oak_slab', java: 'Eichenholzstufe', bedrock: 'Oak Slab', color: '#b8875a' },
  { key: 'oak_fence', java: 'Eichenzaun', bedrock: 'Oak Fence', color: '#b8875a' },
  { key: 'oak_door', java: 'Eichentür', bedrock: 'Oak Door', color: '#a97b4f' },
  { key: 'ladder', java: 'Leiter', bedrock: 'Ladder', color: '#a97b4f' },
  { key: 'flower_pot', java: 'Blumentopf', bedrock: 'Flower Pot', color: '#8b5a3c' },
  { key: 'oak_leaves', java: 'Eichenlaub', bedrock: 'Oak Leaves', color: '#4a7a2c' },
];

export const BLOCK_MAP = Object.fromEntries(BLOCK_CATALOG.map((b) => [b.key, b]));

export function blockDisplayName(key, edition = 'java') {
  const entry = BLOCK_MAP[key];
  if (!entry) return key;
  return edition === 'bedrock' || edition === 'pe' ? entry.bedrock : entry.java;
}

export function blockColor(key) {
  return BLOCK_MAP[key]?.color || '#a0a0a0';
}
