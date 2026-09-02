// Prozedural erzeugte Blockdaten für die 3 Beispiel-Builds (identisch zur Server-Version).

export function houseBlocks() {
  const blocks = [];
  const add = (x, y, z, blockType) => blocks.push({ x, y, z, blockType });
  const isCorner = (x, z) => (x === 0 || x === 4) && (z === 0 || z === 4);
  const isPerimeter = (x, z) => x === 0 || x === 4 || z === 0 || z === 4;

  for (let x = 0; x <= 4; x++) for (let z = 0; z <= 4; z++) add(x, 0, z, 'oak_planks');

  for (let y = 1; y <= 3; y++) {
    for (let x = 0; x <= 4; x++) {
      for (let z = 0; z <= 4; z++) {
        if (!isPerimeter(x, z)) continue;
        if (x === 2 && z === 0 && (y === 1 || y === 2)) {
          add(x, y, z, 'oak_door');
          continue;
        }
        if (((x === 0 || x === 4) && z === 2 && y === 2) || (z === 0 && x !== 2 && y === 2)) {
          add(x, y, z, 'glass_pane');
          continue;
        }
        add(x, y, z, isCorner(x, z) ? 'oak_log' : 'oak_planks');
      }
    }
  }

  for (let x = 0; x <= 4; x++) for (let z = 0; z <= 4; z++) add(x, 4, z, 'oak_slab');
  add(2, 5, 2, 'lantern');
  for (let x = 1; x <= 3; x += 2) add(x, 4, 0, 'oak_fence');

  return blocks;
}

export function towerBlocks() {
  const blocks = [];
  const add = (x, y, z, blockType) => blocks.push({ x, y, z, blockType });
  const isPerimeter = (x, z) => x === 0 || x === 2 || z === 0 || z === 2;

  for (let x = 0; x <= 2; x++) for (let z = 0; z <= 2; z++) add(x, 0, z, 'stone_bricks');
  for (let y = 1; y <= 6; y++) {
    for (let x = 0; x <= 2; x++) {
      for (let z = 0; z <= 2; z++) {
        if (!isPerimeter(x, z)) continue;
        const type = y % 3 === 0 && x === 1 ? 'cracked_stone_bricks' : 'stone_bricks';
        add(x, y, z, type);
      }
    }
  }
  for (let x = 0; x <= 2; x++) {
    for (let z = 0; z <= 2; z++) {
      if (!isPerimeter(x, z)) continue;
      if ((x + z) % 2 === 0) add(x, 7, z, 'stone_brick_stairs');
    }
  }
  add(1, 7, 1, 'lantern');
  return blocks;
}

export function wellBlocks() {
  const blocks = [];
  const add = (x, y, z, blockType) => blocks.push({ x, y, z, blockType });
  const isRing = (x, z) => x === 0 || x === 4 || z === 0 || z === 4;
  const isInner = (x, z) => x >= 1 && x <= 3 && z >= 1 && z <= 3;

  for (let x = 0; x <= 4; x++) {
    for (let z = 0; z <= 4; z++) {
      if (isRing(x, z)) add(x, 0, z, 'smooth_sandstone');
      else if (isInner(x, z)) add(x, 0, z, 'water');
    }
  }
  for (let x = 0; x <= 4; x++) for (let z = 0; z <= 4; z++) if (isRing(x, z)) add(x, 1, z, 'sandstone');

  const posts = [[0, 0], [0, 4], [4, 0], [4, 4]];
  for (const [x, z] of posts) {
    add(x, 2, z, 'oak_fence');
    add(x, 3, z, 'oak_fence');
  }
  for (let x = 0; x <= 4; x++) for (let z = 0; z <= 4; z++) if (x === 0 || x === 4 || z === 0 || z === 4) add(x, 4, z, 'oak_slab');
  add(2, 5, 2, 'lantern');
  return blocks;
}
