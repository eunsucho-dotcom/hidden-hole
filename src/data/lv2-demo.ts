import type { SceneData, TrashItem } from '../primitives/types';

/**
 * Lv2 데이터 — 키친 씬
 */

interface Inst {
  x: number;
  y: number;
  w?: number;
  h?: number;
  r?: number;
  v?: number;
  z?: number;
}

interface CategorySpec {
  category: string;
  label: string;
  emoji: string;
  defaultSize: { w: number; h: number };
  variants?: number;
  instances: Inst[];
  isHidden?: boolean;
}

const CATEGORIES: CategorySpec[] = [
  { category: 'apple', label: '사과', emoji: '🍎', defaultSize: { w: 105, h: 97 },
    instances: [
      { x: 872, y: 1022, w: 105, h: 97, z: 35 },
      { x: 401, y: 554, w: 105, h: 97, z: 42 },
    ] },

  { category: 'chicken', label: '치킨', emoji: '🍗', defaultSize: { w: 126, h: 62 },
    instances: [
      { x: 528, y: 531, w: 126, h: 62, z: 38 },
    ] },

  { category: 'cibdunebt', label: '양념통', emoji: '🧂', defaultSize: { w: 50, h: 90 }, variants: 4,
    instances: [
      { x: 728, y: 383, w: 40, h: 74, z: 54, v: 1 },
      { x: 998, y: 323, w: 38, h: 64, z: 31, v: 2 },
      { x: 968, y: 335, w: 38, h: 64, z: 32, v: 3 },
      { x: 865, y: 351, w: 51, h: 122, z: 21, v: 4 },
      { x: 932, y: 756, w: 51, h: 95, z: 53, v: 1 },
      { x: 480, y: 500, w: 39, h: 67, z: 37, v: 2 },
      { x: 1506, y: 777, w: 47, h: 78, z: 46, r: 0.20, v: 3 },
      { x: 310, y: 201, w: 42, h: 78, z: 50, v: 1 },
      { x: 870, y: 211, w: 40, h: 74, z: 49, v: 1 },
    ] },

  { category: 'cup', label: '컵', emoji: '☕', defaultSize: { w: 95, h: 76 },
    instances: [
      { x: 868, y: 874, w: 95, h: 76, z: 10, r: -0.60 },
      { x: 697, y: 471, w: 70, h: 56, z: 22, r: 0.20 },
      { x: 1398, y: 772, w: 70, h: 56, z: 13, r: 0.20 },
    ] },

  { category: 'cuttingboard', label: '도마', emoji: '🍽️', defaultSize: { w: 214, h: 146 },
    instances: [
      { x: 1131, y: 751, w: 214, h: 146, z: 0 },
    ] },

  { category: 'dishcloth', label: '행주', emoji: '🧻', defaultSize: { w: 84, h: 73 },
    instances: [
      { x: 791, y: 405, w: 84, h: 73, z: 14, r: -0.10 },
      { x: 1166, y: 910, w: 118, h: 102, z: 15, r: -0.70 },
      { x: 630, y: 819, w: 78, h: 68, z: 51, r: 0.60 },
      { x: 1306, y: 408, w: 78, h: 68, z: 16, r: 1.10 },
    ] },

  { category: 'eeg', label: '깨진 계란', emoji: '🥚', defaultSize: { w: 101, h: 97 },
    instances: [
      { x: 1088, y: 650, w: 101, h: 97, z: 26 },
      { x: 1413, y: 895, w: 111, h: 106, z: 28 },
      { x: 740, y: 1033, w: 95, h: 91, z: 29 },
      { x: 834, y: 410, w: 100, h: 96, z: 30 },
    ] },

  { category: 'flour', label: '밀가루', emoji: '🌾', defaultSize: { w: 130, h: 104 },
    instances: [
      { x: 1251, y: 405, w: 130, h: 104, z: 17 },
      { x: 930, y: 1058, w: 165, h: 132, z: 36 },
      { x: 916, y: 706, w: 143, h: 115, z: 6 },
    ] },

  { category: 'fork', label: '포크', emoji: '🍴', defaultSize: { w: 108, h: 99 },
    instances: [
      { x: 844, y: 709, w: 108, h: 99, z: 3 },
    ] },

  { category: 'greenonion', label: '파', emoji: '🌿', defaultSize: { w: 150, h: 80 },
    instances: [
      { x: 400, y: 544, w: 150, h: 80, z: 11 },
      { x: 570, y: 929, w: 192, h: 102, z: 12 },
    ] },

  { category: 'milk', label: '우유', emoji: '🥛', defaultSize: { w: 71, h: 111 },
    instances: [
      { x: 928, y: 366, w: 71, h: 111, z: 33 },
      { x: 1430, y: 183, w: 67, h: 105, z: 34 },
    ] },

  { category: 'mixer', label: '믹서', emoji: '🥤', defaultSize: { w: 144, h: 122 },
    instances: [
      { x: 879, y: 640, w: 144, h: 122, z: 2 },
    ] },

  { category: 'nife', label: '칼', emoji: '🔪', defaultSize: { w: 71, h: 130 },
    instances: [
      { x: 1136, y: 726, w: 71, h: 130, z: 39 },
      { x: 934, y: 183, w: 47, h: 86, z: 41, r: 0.70 },
    ] },

  { category: 'onion', label: '양파', emoji: '🧅', defaultSize: { w: 116, h: 111 },
    instances: [
      { x: 1413, y: 833, w: 116, h: 111, z: 27 },
      { x: 425, y: 490, w: 116, h: 111, z: 9 },
    ] },

  { category: 'scissors', label: '가위', emoji: '✂️', defaultSize: { w: 105, h: 72 },
    instances: [
      { x: 1275, y: 450, w: 105, h: 72, z: 18 },
      { x: 1501, y: 228, w: 105, h: 72, z: 20, r: -0.50 },
      { x: 1148, y: 730, w: 141, h: 97, z: 40, r: -0.50 },
      { x: 661, y: 455, w: 115, h: 79, z: 23, r: -0.70 },
      { x: 599, y: 956, w: 147, h: 101, z: 24, r: -0.40 },
    ] },

  { category: 'scoop', label: '국자', emoji: '🥄', defaultSize: { w: 112, h: 118 },
    instances: [
      { x: 697, y: 456, w: 112, h: 118, z: 43, r: 0.40 },
      { x: 1190, y: 350, w: 74, h: 78, z: 45 },
      { x: 1307, y: 32, w: 91, h: 96, z: 44, r: 1.00 },
    ] },

  { category: 'soup', label: '국', emoji: '🍲', defaultSize: { w: 136, h: 128 },
    instances: [
      { x: 578, y: 791, w: 136, h: 128, z: 52 },
    ] },

  { category: 'source', label: '소스', emoji: '🍶', defaultSize: { w: 137, h: 94 },
    instances: [
      { x: 761, y: 656, w: 137, h: 94, z: 8 },
    ] },

  { category: 'soysauce', label: '간장', emoji: '🍯', defaultSize: { w: 68, h: 183 },
    instances: [
      { x: 1023, y: 750, w: 68, h: 183, z: 25 },
      { x: 821, y: 344, w: 48, h: 128, z: 4 },
      { x: 1473, y: 161, w: 43, h: 116, z: 19 },
      { x: 587, y: 893, w: 55, h: 147, z: 5, r: -1.50 },
    ] },

  { category: 'spoon', label: '숟가락', emoji: '🥄', defaultSize: { w: 120, h: 116 },
    instances: [
      { x: 1225, y: 694, w: 120, h: 116, z: 1, r: -0.40 },
      { x: 1485, y: 809, w: 93, h: 90, z: 47, r: -0.40 },
    ] },

  { category: 'towel', label: '수건', emoji: '🧴', defaultSize: { w: 77, h: 147 },
    instances: [
      { x: 976, y: 701, w: 77, h: 147, z: 7 },
    ] },

  { category: 'trashbeen', label: '쓰레기통', emoji: '🗑️', defaultSize: { w: 167, h: 198 },
    instances: [
      { x: 1578, y: 769, w: 167, h: 198, z: 48 },
    ] },
];

function generateTrash(): TrashItem[] {
  const items: TrashItem[] = [];
  for (const spec of CATEGORIES) {
    spec.instances.forEach((inst, i) => {
      const variantNum = inst.v ?? (spec.variants ? (i % spec.variants) + 1 : null);
      const texturePath = variantNum !== null
        ? `/images/trash_lv2_${spec.category}_${variantNum}.png`
        : `/images/trash_lv2_${spec.category}.png`;

      items.push({
        id: `${spec.category}_${i + 1}`,
        category: spec.category,
        categoryLabel: spec.label,
        categoryEmoji: spec.emoji,
        position: { x: inst.x, y: inst.y },
        size: {
          width: inst.w ?? spec.defaultSize.w,
          height: inst.h ?? spec.defaultSize.h,
        },
        rotation: inst.r,
        z: inst.z,
        texture: texturePath,
        isActivated: false,
        isHidden: spec.isHidden ?? false,
      });
    });
  }
  return items;
}

export const LV2_DEMO: SceneData = {
  id: 'lv2',
  title: { ko: '키친', en: 'Kitchen' },
  story: {
    ko: '요리 폭격 다음 날',
    en: 'After Cooking Chaos',
  },
  backgroundClean: '/images/bg_lv2_clean.png',
  backgroundMessy: '/images/bg_lv2_clean.png',
  trashItems: generateTrash(),
  interactiveObjects: [],
  timeLimit: 120,
  pig: {
    position: { x: 425, y: 791 },
    size: 200,
  },
};
