// Muss zur Blockliste im Backend (server/src/utils/blockNames.js) passen.
export const BLOCK_COLORS = {
  oak_planks: '#b8875a', oak_log: '#6f5335', spruce_planks: '#7a5a35', spruce_log: '#4a3a26',
  stone: '#8a8a8a', cobblestone: '#7d7d7d', stone_bricks: '#8f8f86', cracked_stone_bricks: '#7f7f76',
  glass: '#bfe3f0', glass_pane: '#cdeaf5', white_wool: '#e9e9e9', quartz_block: '#ece6da',
  quartz_pillar: '#e5dfd2', sandstone: '#dcd0a0', smooth_sandstone: '#e0d5a8', sand: '#e3d9a3',
  dirt: '#7a5533', grass_block: '#6ea94c', water: '#3d6fd1', obsidian: '#180d29',
  netherrack: '#733333', brick: '#9a5b4c', dark_oak_planks: '#3e2c17', birch_planks: '#d7c78b',
  terracotta: '#9a5230', iron_block: '#dcdcdc', gold_block: '#fcee4b', lantern: '#f2c05a',
  torch: '#ffb347', oak_stairs: '#b8875a', stone_brick_stairs: '#8f8f86', oak_slab: '#b8875a',
  oak_fence: '#b8875a', oak_door: '#a97b4f', ladder: '#a97b4f', flower_pot: '#8b5a3c',
  oak_leaves: '#4a7a2c',
};

export const BLOCK_PALETTE = Object.keys(BLOCK_COLORS);

export function blockColor(type) {
  return BLOCK_COLORS[type] || '#a0a0a0';
}
