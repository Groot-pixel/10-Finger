// Anzeigename je Edition. Muss mit den Keys in utils/blockColors.js übereinstimmen.
export const BLOCK_CATALOG = [
  { key: 'oak_planks', java: 'Eichenholz-Planken', bedrock: 'Oak Planks' },
  { key: 'oak_log', java: 'Eichenstamm', bedrock: 'Oak Log' },
  { key: 'spruce_planks', java: 'Fichtenholz-Planken', bedrock: 'Spruce Planks' },
  { key: 'spruce_log', java: 'Fichtenstamm', bedrock: 'Spruce Log' },
  { key: 'stone', java: 'Stein', bedrock: 'Stone' },
  { key: 'cobblestone', java: 'Bruchstein', bedrock: 'Cobblestone' },
  { key: 'stone_bricks', java: 'Steinziegel', bedrock: 'Stone Bricks' },
  { key: 'cracked_stone_bricks', java: 'Rissige Steinziegel', bedrock: 'Cracked Stone Bricks' },
  { key: 'glass', java: 'Glas', bedrock: 'Glass' },
  { key: 'glass_pane', java: 'Glasscheibe', bedrock: 'Glass Pane' },
  { key: 'white_wool', java: 'Weiße Wolle', bedrock: 'White Wool' },
  { key: 'quartz_block', java: 'Quarzblock', bedrock: 'Quartz Block' },
  { key: 'quartz_pillar', java: 'Gerillter Quarzblock', bedrock: 'Quartz Pillar' },
  { key: 'sandstone', java: 'Sandstein', bedrock: 'Sandstone' },
  { key: 'smooth_sandstone', java: 'Glatter Sandstein', bedrock: 'Smooth Sandstone' },
  { key: 'sand', java: 'Sand', bedrock: 'Sand' },
  { key: 'dirt', java: 'Erde', bedrock: 'Dirt' },
  { key: 'grass_block', java: 'Grasblock', bedrock: 'Grass Block' },
  { key: 'water', java: 'Wasser', bedrock: 'Water' },
  { key: 'obsidian', java: 'Obsidian', bedrock: 'Obsidian' },
  { key: 'netherrack', java: 'Netherrack', bedrock: 'Netherrack' },
  { key: 'brick', java: 'Ziegel', bedrock: 'Bricks' },
  { key: 'dark_oak_planks', java: 'Schwarzeichenholz-Planken', bedrock: 'Dark Oak Planks' },
  { key: 'birch_planks', java: 'Birkenholz-Planken', bedrock: 'Birch Planks' },
  { key: 'terracotta', java: 'Terrakotta', bedrock: 'Terracotta' },
  { key: 'iron_block', java: 'Eisenblock', bedrock: 'Block of Iron' },
  { key: 'gold_block', java: 'Goldblock', bedrock: 'Block of Gold' },
  { key: 'lantern', java: 'Laterne', bedrock: 'Lantern' },
  { key: 'torch', java: 'Fackel', bedrock: 'Torch' },
  { key: 'oak_stairs', java: 'Eichenholztreppe', bedrock: 'Oak Stairs' },
  { key: 'stone_brick_stairs', java: 'Steinziegeltreppe', bedrock: 'Stone Brick Stairs' },
  { key: 'oak_slab', java: 'Eichenholzstufe', bedrock: 'Oak Slab' },
  { key: 'oak_fence', java: 'Eichenzaun', bedrock: 'Oak Fence' },
  { key: 'oak_door', java: 'Eichentür', bedrock: 'Oak Door' },
  { key: 'ladder', java: 'Leiter', bedrock: 'Ladder' },
  { key: 'flower_pot', java: 'Blumentopf', bedrock: 'Flower Pot' },
  { key: 'oak_leaves', java: 'Eichenlaub', bedrock: 'Oak Leaves' },
];

export const BLOCK_MAP = Object.fromEntries(BLOCK_CATALOG.map((b) => [b.key, b]));

export function blockDisplayName(key, edition = 'java') {
  const entry = BLOCK_MAP[key];
  if (!entry) return key;
  return edition === 'bedrock' || edition === 'pe' ? entry.bedrock : entry.java;
}
