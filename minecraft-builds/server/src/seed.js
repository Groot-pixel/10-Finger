import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import db, { uploadsDir } from './db.js';
import { slugify } from './utils/slugify.js';
import { blockColor } from './utils/blockNames.js';

const STARTER_CATEGORIES = [
  ['Häuser', '🏠'], ['Medieval', '🏰'], ['Modern', '🏢'], ['Portale', '🌀'],
  ['Beacons', '💠'], ['Natur', '🌳'], ['Farmen', '🌾'], ['Starter', '⭐'],
  ['Statuen', '🗿'], ['Asiatisch', '⛩️'], ['Wüste', '🏜️'], ['Redstone', '🔴'],
  ['Burgen/Schlösser', '🏯'], ['Türme', '🗼'], ['Brunnen', '⛲'], ['Wege', '🛤️'],
  ['Interieur', '🛋️'], ['Dekoration', '🎄'],
];

const STARTER_TAGS = [
  'Anfängerfreundlich', 'Kompakt', 'Symmetrisch', 'Redstone-frei', 'Beleuchtet',
  'Survival-tauglich', 'Kreativ-Modus empfohlen', 'Mit Garten',
];

function ensureCategories() {
  const stmt = db.prepare('INSERT OR IGNORE INTO categories (name, slug, icon) VALUES (?, ?, ?)');
  for (const [name, icon] of STARTER_CATEGORIES) stmt.run(name, slugify(name), icon);
}

function ensureTags() {
  const stmt = db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)');
  for (const name of STARTER_TAGS) stmt.run(name, slugify(name));
}

function categoryId(name) {
  return db.prepare('SELECT id FROM categories WHERE name = ?').get(name)?.id;
}
function tagId(name) {
  return db.prepare('SELECT id FROM tags WHERE name = ?').get(name)?.id;
}

function ensureUsers() {
  const adminEmail = 'admin@example.com';
  let admin = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);
  if (!admin) {
    const hash = bcrypt.hashSync('admin1234', 10);
    const info = db
      .prepare(
        `INSERT INTO users (email, password_hash, name, minecraft_username, edition_pref, role)
         VALUES (?, ?, 'Admin', 'AdminSteve', 'java', 'admin')`,
      )
      .run(adminEmail, hash);
    admin = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    console.log(`Admin angelegt: ${adminEmail} / admin1234 (bitte nach dem ersten Login ändern)`);
  }

  const friendEmail = 'friend@example.com';
  let friend = db.prepare('SELECT * FROM users WHERE email = ?').get(friendEmail);
  if (!friend) {
    const hash = bcrypt.hashSync('friend1234', 10);
    const info = db
      .prepare(
        `INSERT INTO users (email, password_hash, name, minecraft_username, edition_pref, role)
         VALUES (?, ?, 'Test-Freund', 'CrafterMax', 'bedrock', 'user')`,
      )
      .run(friendEmail, hash);
    friend = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    console.log(`Testnutzer angelegt: ${friendEmail} / friend1234`);
  }
  return { admin, friend };
}

// ---------- Block-Generatoren für Beispiel-Builds ----------

function houseBlocks() {
  const blocks = [];
  const add = (x, y, z, blockType) => blocks.push({ x, y, z, blockType });
  const isCorner = (x, z) => (x === 0 || x === 4) && (z === 0 || z === 4);
  const isPerimeter = (x, z) => x === 0 || x === 4 || z === 0 || z === 4;

  // Fundament
  for (let x = 0; x <= 4; x++) for (let z = 0; z <= 4; z++) add(x, 0, z, 'oak_planks');

  // Wände (y=1..3)
  for (let y = 1; y <= 3; y++) {
    for (let x = 0; x <= 4; x++) {
      for (let z = 0; z <= 4; z++) {
        if (!isPerimeter(x, z)) continue;
        // Tür bei x=2,z=0
        if (x === 2 && z === 0 && (y === 1 || y === 2)) {
          add(x, y, z, 'oak_door');
          continue;
        }
        // Fenster
        if (((x === 0 || x === 4) && z === 2 && y === 2) || (z === 0 && x !== 2 && y === 2)) {
          add(x, y, z, 'glass_pane');
          continue;
        }
        add(x, y, z, isCorner(x, z) ? 'oak_log' : 'oak_planks');
      }
    }
  }

  // Dach (y=4 flach, y=5 First-Dekoration)
  for (let x = 0; x <= 4; x++) for (let z = 0; z <= 4; z++) add(x, 4, z, 'oak_slab');
  add(2, 5, 2, 'lantern');
  for (let x = 1; x <= 3; x += 2) add(x, 4, 0, 'oak_fence');

  return blocks;
}

function towerBlocks() {
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
  // Zinnen (Krenelierung)
  for (let x = 0; x <= 2; x++) {
    for (let z = 0; z <= 2; z++) {
      if (!isPerimeter(x, z)) continue;
      if ((x + z) % 2 === 0) add(x, 7, z, 'stone_brick_stairs');
    }
  }
  add(1, 7, 1, 'lantern');
  return blocks;
}

function wellBlocks() {
  const blocks = [];
  const add = (x, y, z, blockType) => blocks.push({ x, y, z, blockType });
  const isRing = (x, z) => (x === 0 || x === 4) || (z === 0 || z === 4);
  const isInner = (x, z) => x >= 1 && x <= 3 && z >= 1 && z <= 3;

  // Grundring aus Sandstein, Wasser im Inneren
  for (let x = 0; x <= 4; x++) {
    for (let z = 0; z <= 4; z++) {
      if (isRing(x, z)) add(x, 0, z, 'smooth_sandstone');
      else if (isInner(x, z)) add(x, 0, z, 'water');
    }
  }
  // Wand des Brunnens (y=1)
  for (let x = 0; x <= 4; x++) {
    for (let z = 0; z <= 4; z++) {
      if (isRing(x, z)) add(x, 1, z, 'sandstone');
    }
  }
  // Vier Pfosten mit Dach
  const posts = [[0, 0], [0, 4], [4, 0], [4, 4]];
  for (const [x, z] of posts) {
    add(x, 2, z, 'oak_fence');
    add(x, 3, z, 'oak_fence');
  }
  for (let x = 0; x <= 4; x++) for (let z = 0; z <= 4; z++) {
    if ((x === 0 || x === 4 || z === 0 || z === 4)) add(x, 4, z, 'oak_slab');
  }
  add(2, 5, 2, 'lantern');
  return blocks;
}

// ---------- Bild-Anleitung: einfache SVG-Draufsichten je Ebene ----------

function svgForStep({ minX, maxX, minZ, maxZ, layerY, existing, fresh, cellSize = 40 }) {
  const w = (maxX - minX + 1) * cellSize;
  const h = (maxZ - minZ + 1) * cellSize;
  const pad = 30;
  let rects = '';
  const cellKey = (x, z) => `${x},${z}`;
  const existingMap = new Map(existing.map((b) => [cellKey(b.x, b.z), b.blockType]));
  const freshMap = new Map(fresh.map((b) => [cellKey(b.x, b.z), b.blockType]));

  for (let x = minX; x <= maxX; x++) {
    for (let z = minZ; z <= maxZ; z++) {
      const px = (x - minX) * cellSize;
      const pz = (z - minZ) * cellSize;
      const isFresh = freshMap.has(cellKey(x, z));
      const isExisting = existingMap.has(cellKey(x, z));
      let fill = '#20242c';
      let stroke = '#3a3f4b';
      let strokeWidth = 1;
      if (isExisting) {
        fill = blockColor(existingMap.get(cellKey(x, z)));
        fill += 'aa';
      }
      if (isFresh) {
        fill = blockColor(freshMap.get(cellKey(x, z)));
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

function buildStepsFromBlocks(blocks, chunkSize = 8) {
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
      steps.push({
        layerY: y,
        fresh: chunk,
        existing: [...existing],
        minX,
        maxX,
        minZ,
        maxZ,
      });
      placedSoFarByLayer.set(y, [...existing, ...chunk]);
    }
  }
  return steps;
}

function createBuildWithSteps({ title, description, category, difficulty, editions, compatNotes, tags, blocks, adminId, stepDescriptions }) {
  let slug = slugify(title);
  const clash = db.prepare('SELECT id FROM builds WHERE slug = ?').get(slug);
  if (clash) return db.prepare('SELECT * FROM builds WHERE slug = ?').get(slug);

  const info = db
    .prepare(
      `INSERT INTO builds (title, slug, description, category_id, difficulty, editions, compat_notes, thumbnail, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'published', ?)`,
    )
    .run(title, slug, description, categoryId(category), difficulty, JSON.stringify(editions), compatNotes, adminId);
  const buildId = info.lastInsertRowid;

  for (const tag of tags) {
    const id = tagId(tag);
    if (id) db.prepare('INSERT OR IGNORE INTO build_tags (build_id, tag_id) VALUES (?, ?)').run(buildId, id);
  }

  const blockStmt = db.prepare('INSERT INTO blocks (build_id, x, y, z, block_type, step_order) VALUES (?, ?, ?, ?, ?, ?)');
  blocks.forEach((b, i) => blockStmt.run(buildId, b.x, b.y, b.z, b.blockType, i));

  const steps = buildStepsFromBlocks(blocks);
  const imgStmt = db.prepare('INSERT INTO build_images (build_id, step_number, image_path, description) VALUES (?, ?, ?, ?)');
  steps.forEach((step, idx) => {
    const svg = svgForStep(step);
    const filename = `seed-${slug}-step-${idx + 1}.svg`;
    fs.writeFileSync(path.join(uploadsDir, filename), svg, 'utf-8');
    const desc = stepDescriptions?.[idx] || `Platziere ${step.fresh.length} Block(e) in Ebene y=${step.layerY}.`;
    imgStmt.run(buildId, idx + 1, `/uploads/${filename}`, desc);
  });

  const thumbSvg = svgForStep({ ...steps[steps.length - 1], fresh: [], existing: [
    ...steps[steps.length - 1].existing, ...steps[steps.length - 1].fresh,
  ] });
  const thumbFile = `seed-${slug}-thumb.svg`;
  fs.writeFileSync(path.join(uploadsDir, thumbFile), thumbSvg, 'utf-8');
  db.prepare('UPDATE builds SET thumbnail = ? WHERE id = ?').run(`/uploads/${thumbFile}`, buildId);

  return db.prepare('SELECT * FROM builds WHERE id = ?').get(buildId);
}

function seed() {
  ensureCategories();
  ensureTags();
  const { admin, friend } = ensureUsers();

  const house = createBuildWithSteps({
    title: 'Gemütliche Starter-Hütte',
    description:
      'Eine kompakte 5x5-Holzhütte für den Start in eine neue Welt. Schnell gebaut, mit Tür, Fenstern und flachem Dach.',
    category: 'Starter',
    difficulty: 'easy',
    editions: ['java', 'bedrock', 'pe'],
    compatNotes: 'Funktioniert mit jedem Shader/Texture-Pack, keine speziellen Blöcke nötig.',
    tags: ['Anfängerfreundlich', 'Kompakt', 'Survival-tauglich'],
    blocks: houseBlocks(),
    adminId: admin.id,
  });

  const tower = createBuildWithSteps({
    title: 'Steinturm-Wachturm',
    description:
      'Ein kleiner quadratischer Wachturm aus Steinziegeln mit Zinnen und Laterne – ideal als Ausguck oder Ecktturm für eine Burgmauer.',
    category: 'Türme',
    difficulty: 'medium',
    editions: ['java', 'bedrock'],
    compatNotes: 'Rissige Steinziegel sind optisch, können 1:1 durch normale Steinziegel ersetzt werden.',
    tags: ['Symmetrisch', 'Beleuchtet'],
    blocks: towerBlocks(),
    adminId: admin.id,
  });

  const well = createBuildWithSteps({
    title: 'Wüstenbrunnen',
    description:
      'Ein dekorativer Sandstein-Brunnen mit Wasser-Innenbecken und überdachtem Pfostenrahmen – passt gut in Wüstendörfer.',
    category: 'Brunnen',
    difficulty: 'easy',
    editions: ['java', 'bedrock', 'pe'],
    compatNotes: 'Wasser-Textur kann je nach Shader-Pack abweichen, funktional identisch.',
    tags: ['Kompakt', 'Kreativ-Modus empfohlen'],
    blocks: wellBlocks(),
    adminId: admin.id,
  });

  // Beispiel-Bewertungen & Kommentare
  const rateAndComment = (buildId, stars, text) => {
    db.prepare(
      `INSERT INTO ratings (user_id, build_id, stars) VALUES (?, ?, ?)
       ON CONFLICT(user_id, build_id) DO UPDATE SET stars = excluded.stars`,
    ).run(friend.id, buildId, stars);
    db.prepare('INSERT INTO comments (build_id, user_id, text) VALUES (?, ?, ?)').run(buildId, friend.id, text);
  };
  rateAndComment(house.id, 5, 'Super einfach nachzubauen, in 10 Minuten fertig!');
  rateAndComment(tower.id, 4, 'Sieht gut aus, die Zinnen könnten etwas höher sein.');
  rateAndComment(well.id, 5, 'Perfekt für mein Wüstendorf-Projekt.');

  console.log('Seed abgeschlossen: 3 Beispiel-Builds, Kategorien, Tags und Testnutzer angelegt.');
}

seed();
