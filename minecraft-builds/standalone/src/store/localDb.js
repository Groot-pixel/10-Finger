import { slugify, uid } from '../utils/slugify';
import { houseBlocks, towerBlocks, wellBlocks } from '../data/seedShapes';
import { generateStepImagesFromBlocks } from '../utils/stepImages';

const STORAGE_KEY = 'craftguide_solo_data_v1';

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

function emptyState() {
  return { categories: [], tags: [], builds: [] };
}

function buildSeedBuilds(categories) {
  const catId = (name) => categories.find((c) => c.name === name)?.id;
  const now = new Date().toISOString();

  function make({ title, description, category, difficulty, editions, compatNotes, blocks, tagNames, tags }) {
    const images = generateStepImagesFromBlocks(blocks);
    return {
      id: uid(),
      slug: slugify(title),
      title,
      description,
      categoryId: catId(category),
      difficulty,
      editions,
      compatNotes,
      tagIds: (tagNames || []).map((n) => tags.find((t) => t.name === n)?.id).filter(Boolean),
      status: 'published',
      thumbnail: images[images.length - 1]?.dataUrl || null,
      blocks,
      images,
      viewCount: 0,
      favorite: false,
      myRating: 0,
      myNotes: '',
      progress: { lastImageStep: 0, lastLayer: 0 },
      createdAt: now,
      updatedAt: now,
    };
  }

  const tags = STARTER_TAGS.map((name) => ({ id: uid(), name, slug: slugify(name) }));

  const builds = [
    make({
      title: 'Gemütliche Starter-Hütte',
      description: 'Eine kompakte 5x5-Holzhütte für den Start in eine neue Welt. Schnell gebaut, mit Tür, Fenstern und flachem Dach.',
      category: 'Starter',
      difficulty: 'easy',
      editions: ['java', 'bedrock', 'pe'],
      compatNotes: 'Funktioniert mit jedem Shader/Texture-Pack, keine speziellen Blöcke nötig.',
      blocks: houseBlocks(),
      tagNames: ['Anfängerfreundlich', 'Kompakt', 'Survival-tauglich'],
      tags,
    }),
    make({
      title: 'Steinturm-Wachturm',
      description: 'Ein kleiner quadratischer Wachturm aus Steinziegeln mit Zinnen und Laterne – ideal als Ausguck oder Ecktturm für eine Burgmauer.',
      category: 'Türme',
      difficulty: 'medium',
      editions: ['java', 'bedrock'],
      compatNotes: 'Rissige Steinziegel sind optisch, können 1:1 durch normale Steinziegel ersetzt werden.',
      blocks: towerBlocks(),
      tagNames: ['Symmetrisch', 'Beleuchtet'],
      tags,
    }),
    make({
      title: 'Wüstenbrunnen',
      description: 'Ein dekorativer Sandstein-Brunnen mit Wasser-Innenbecken und überdachtem Pfostenrahmen – passt gut in Wüstendörfer.',
      category: 'Brunnen',
      difficulty: 'easy',
      editions: ['java', 'bedrock', 'pe'],
      compatNotes: 'Wasser-Textur kann je nach Shader-Pack abweichen, funktional identisch.',
      blocks: wellBlocks(),
      tagNames: ['Kompakt', 'Kreativ-Modus empfohlen'],
      tags,
    }),
  ];

  return { tags, builds };
}

function seedInitialState() {
  const categories = STARTER_CATEGORIES.map(([name, icon]) => ({ id: uid(), name, slug: slugify(name), icon }));
  const { tags, builds } = buildSeedBuilds(categories);
  return { categories, tags, builds };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedInitialState();
      save(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw);
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = load();
const listeners = new Set();

function notify() {
  for (const l of listeners) l(state);
}

function mutate(fn) {
  fn(state);
  save(state);
  notify();
}

export const db = {
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getState() {
    return state;
  },

  // Kategorien
  listCategories() {
    return state.categories.map((c) => ({
      ...c,
      buildCount: state.builds.filter((b) => b.categoryId === c.id && b.status === 'published').length,
    }));
  },
  addCategory(name, icon) {
    const cat = { id: uid(), name, slug: slugify(name), icon: icon || '📦' };
    mutate((s) => s.categories.push(cat));
    return cat;
  },
  updateCategory(id, patch) {
    mutate((s) => {
      const cat = s.categories.find((c) => c.id === id);
      if (cat) Object.assign(cat, patch, patch.name ? { slug: slugify(patch.name) } : {});
    });
  },
  deleteCategory(id) {
    mutate((s) => {
      s.categories = s.categories.filter((c) => c.id !== id);
      s.builds.forEach((b) => { if (b.categoryId === id) b.categoryId = null; });
    });
  },

  // Tags
  listTags() {
    return state.tags;
  },
  addTag(name) {
    const tag = { id: uid(), name, slug: slugify(name) };
    mutate((s) => s.tags.push(tag));
    return tag;
  },
  deleteTag(id) {
    mutate((s) => {
      s.tags = s.tags.filter((t) => t.id !== id);
      s.builds.forEach((b) => { b.tagIds = b.tagIds.filter((t) => t !== id); });
    });
  },

  // Builds
  listBuilds({ q, category, difficulty, tag, edition, sort = 'newest', includeDrafts = false } = {}) {
    let list = state.builds.filter((b) => includeDrafts || b.status === 'published');
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter((b) => b.title.toLowerCase().includes(needle) || b.description.toLowerCase().includes(needle));
    }
    if (category) {
      const cat = state.categories.find((c) => c.slug === category);
      list = list.filter((b) => b.categoryId === cat?.id);
    }
    if (difficulty) list = list.filter((b) => b.difficulty === difficulty);
    if (tag) {
      const t = state.tags.find((t) => t.slug === tag);
      list = list.filter((b) => b.tagIds.includes(t?.id));
    }
    if (edition) list = list.filter((b) => b.editions.includes(edition));

    const diffRank = { easy: 1, medium: 2, hard: 3 };
    const sorters = {
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      popular: (a, b) => b.viewCount - a.viewCount,
      hardest: (a, b) => diffRank[b.difficulty] - diffRank[a.difficulty],
      easiest: (a, b) => diffRank[a.difficulty] - diffRank[b.difficulty],
    };
    return [...list].sort(sorters[sort] || sorters.newest).map(this.hydrateBuild);
  },
  hydrateBuild(b) {
    return {
      ...b,
      category: state.categories.find((c) => c.id === b.categoryId) || null,
      tags: b.tagIds.map((id) => state.tags.find((t) => t.id === id)).filter(Boolean),
    };
  },
  getBuild(idOrSlug) {
    const b = state.builds.find((b) => b.id === idOrSlug || b.slug === idOrSlug);
    return b ? this.hydrateBuild(b) : null;
  },
  incrementView(id) {
    mutate((s) => {
      const b = s.builds.find((b) => b.id === id);
      if (b) b.viewCount += 1;
    });
  },
  createBuild(payload) {
    let slug = slugify(payload.title);
    if (state.builds.some((b) => b.slug === slug)) slug = `${slug}-${Date.now().toString(36)}`;
    const build = {
      id: uid(),
      slug,
      title: payload.title,
      description: payload.description || '',
      categoryId: payload.categoryId || null,
      difficulty: payload.difficulty || 'easy',
      editions: payload.editions || ['java'],
      compatNotes: payload.compatNotes || '',
      tagIds: payload.tagIds || [],
      status: payload.status || 'draft',
      thumbnail: null,
      blocks: [],
      images: [],
      viewCount: 0,
      favorite: false,
      myRating: 0,
      myNotes: '',
      progress: { lastImageStep: 0, lastLayer: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mutate((s) => s.builds.push(build));
    return build;
  },
  updateBuild(id, patch) {
    mutate((s) => {
      const b = s.builds.find((b) => b.id === id);
      if (!b) return;
      if (patch.title && patch.title !== b.title) {
        let slug = slugify(patch.title);
        if (s.builds.some((x) => x.slug === slug && x.id !== id)) slug = `${slug}-${Date.now().toString(36)}`;
        b.slug = slug;
      }
      Object.assign(b, patch, { updatedAt: new Date().toISOString() });
    });
    return this.getBuild(id);
  },
  deleteBuild(id) {
    mutate((s) => { s.builds = s.builds.filter((b) => b.id !== id); });
  },
  setBlocks(buildId, blocks) {
    mutate((s) => {
      const b = s.builds.find((b) => b.id === buildId);
      if (!b) return;
      b.blocks = blocks;
      b.updatedAt = new Date().toISOString();
      if (!b.thumbnail) {
        const autoImages = generateStepImagesFromBlocks(blocks);
        b.thumbnail = autoImages[autoImages.length - 1]?.dataUrl || null;
      }
    });
  },
  addImages(buildId, images) {
    mutate((s) => {
      const b = s.builds.find((b) => b.id === buildId);
      if (!b) return;
      const withIds = images.map((img) => ({ id: uid(), dataUrl: img.dataUrl, description: img.description || '' }));
      b.images.push(...withIds);
      if (!b.thumbnail && withIds[0]) b.thumbnail = withIds[0].dataUrl;
    });
  },
  updateImage(buildId, imageId, patch) {
    mutate((s) => {
      const b = s.builds.find((b) => b.id === buildId);
      const img = b?.images.find((i) => i.id === imageId);
      if (img) Object.assign(img, patch);
    });
  },
  reorderImages(buildId, orderedIds) {
    mutate((s) => {
      const b = s.builds.find((b) => b.id === buildId);
      if (!b) return;
      const byId = new Map(b.images.map((i) => [i.id, i]));
      b.images = orderedIds.map((id) => byId.get(id)).filter(Boolean);
    });
  },
  deleteImage(buildId, imageId) {
    mutate((s) => {
      const b = s.builds.find((b) => b.id === buildId);
      if (b) b.images = b.images.filter((i) => i.id !== imageId);
    });
  },
  toggleFavorite(id) {
    mutate((s) => {
      const b = s.builds.find((b) => b.id === id);
      if (b) b.favorite = !b.favorite;
    });
  },
  listFavorites() {
    return state.builds.filter((b) => b.favorite).map(this.hydrateBuild);
  },
  setProgress(id, patch) {
    mutate((s) => {
      const b = s.builds.find((b) => b.id === id);
      if (b) Object.assign(b.progress, patch);
    });
  },
  setRating(id, stars) {
    mutate((s) => {
      const b = s.builds.find((b) => b.id === id);
      if (b) b.myRating = stars;
    });
  },
  setNotes(id, text) {
    mutate((s) => {
      const b = s.builds.find((b) => b.id === id);
      if (b) b.myNotes = text;
    });
  },

  // Export / Import (Teilen mit Freunden ohne Server)
  exportJson() {
    return JSON.stringify(state, null, 2);
  },
  importJson(json, { merge = true } = {}) {
    const incoming = JSON.parse(json);
    mutate((s) => {
      if (!merge) {
        s.categories = incoming.categories || [];
        s.tags = incoming.tags || [];
        s.builds = incoming.builds || [];
        return;
      }
      const catByName = new Map(s.categories.map((c) => [c.name, c]));
      const catIdMap = new Map();
      for (const c of incoming.categories || []) {
        const existing = catByName.get(c.name);
        if (existing) catIdMap.set(c.id, existing.id);
        else {
          const fresh = { ...c, id: uid() };
          s.categories.push(fresh);
          catIdMap.set(c.id, fresh.id);
        }
      }
      const tagByName = new Map(s.tags.map((t) => [t.name, t]));
      const tagIdMap = new Map();
      for (const t of incoming.tags || []) {
        const existing = tagByName.get(t.name);
        if (existing) tagIdMap.set(t.id, existing.id);
        else {
          const fresh = { ...t, id: uid() };
          s.tags.push(fresh);
          tagIdMap.set(t.id, fresh.id);
        }
      }
      const existingSlugs = new Set(s.builds.map((b) => b.slug));
      for (const b of incoming.builds || []) {
        let slug = b.slug;
        if (existingSlugs.has(slug)) slug = `${slug}-import-${Date.now().toString(36)}`;
        existingSlugs.add(slug);
        s.builds.push({
          ...b,
          id: uid(),
          slug,
          categoryId: b.categoryId ? catIdMap.get(b.categoryId) ?? null : null,
          tagIds: (b.tagIds || []).map((id) => tagIdMap.get(id)).filter(Boolean),
        });
      }
    });
  },
  resetAll() {
    const seeded = seedInitialState();
    state = seeded;
    save(state);
    notify();
  },
};
