import type { SceneData, TrashItem } from '../primitives/types';

/**
 * Lv3 데이터 — 어린이방 (장난감 흩어진 씬)
 * 위치는 EDIT 모드로 편집 후 S 키로 export 한 값
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
  { category: 'ball', label: 'ball', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 856, y: 1025, w: 153, h: 150, z: 55 },
      { x: 763, y: 507, w: 106, h: 104, z: 17, r: 0.30 },
    ] },

  { category: 'barbie doll', label: 'barbie doll', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 630, y: 280, w: 110, h: 120, z: 0 },
    ] },

  { category: 'bear', label: 'bear', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 1267, y: 536, w: 119, h: 139, z: 14 },
      { x: 443, y: 325, w: 76, h: 88, z: 68, r: 0.00 },
    ] },

  { category: 'block frame', label: 'block frame', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 1024, y: 683, w: 105, h: 120, z: 56 },
      { x: 405, y: 879, w: 103, h: 119, z: 60 },
    ] },

  { category: 'book', label: 'book', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 336, y: 853, w: 92, h: 92, z: 59, r: 0.50 },
      { x: 1014, y: 1007, w: 112, h: 112, z: 58, r: 0.50 },
    ] },

  { category: 'crayon', label: 'crayon', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 505, y: 772, w: 55, h: 65, z: 8 },
      { x: 1069, y: 936, w: 64, h: 75, z: 12 },
      { x: 1004, y: 554, w: 45, h: 52, z: 2, r: -1.40 },
      { x: 136, y: 724, w: 33, h: 38, z: 9, r: -1.40 },
    ] },

  { category: 'cube', label: 'cube', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 289, y: 437, w: 50, h: 46, z: 66 },
      { x: 574, y: 566, w: 50, h: 46, z: 64 },
      { x: 1124, y: 584, w: 50, h: 46, z: 67 },
    ] },

  { category: 'dinosaur', label: 'dinosaur', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 875, y: 475, w: 139, h: 137, z: 3 },
      { x: 193, y: 727, w: 102, h: 101, z: 22, r: 1.00 },
    ] },

  { category: 'doy ring', label: 'doy ring', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 987, y: 597, w: 80, h: 120, z: 15 },
      { x: 600, y: 604, w: 65, h: 98, z: 65 },
      { x: 308, y: 356, w: 53, h: 80, z: 16 },
    ] },

  { category: 'drum', label: 'drum', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 1313, y: 605, w: 116, h: 120, z: 57 },
      { x: 637, y: 999, w: 128, h: 132, z: 38 },
      { x: 834, y: 549, w: 103, h: 107, z: 47 },
    ] },

  { category: 'duck', label: 'duck', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 350, y: 560, w: 112, h: 120, z: 1 },
    ] },

  { category: 'excavator', label: 'excavator', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 628, y: 701, w: 169, h: 158, z: 18, r: -0.10 },
    ] },

  { category: 'green candy', label: 'green candy', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 892, y: 552, w: 48, h: 19, z: 34 },
      { x: 869, y: 222, w: 48, h: 19, z: 13 },
      { x: 1523, y: 657, w: 48, h: 19, z: 62 },
      { x: 763, y: 595, w: 48, h: 19, z: 48 },
      { x: 1041, y: 826, w: 48, h: 19, z: 36 },
      { x: 1323, y: 335, w: 44, h: 17, z: 37 },
      { x: 781, y: 813, w: 48, h: 19, z: 49 },
      { x: 397, y: 427, w: 48, h: 19, z: 63 },
    ] },

  { category: 'keyboard', label: 'keyboard', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 1062, y: 648, w: 126, h: 107, z: 53 },
      { x: 316, y: 758, w: 139, h: 118, z: 45 },
    ] },

  { category: 'lego', label: 'lego', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 1105, y: 754, w: 83, h: 84, z: 39 },
      { x: 773, y: 924, w: 83, h: 84, z: 42 },
      { x: 389, y: 722, w: 78, h: 79, z: 43 },
      { x: 510, y: 936, w: 81, h: 82, z: 44 },
      { x: 803, y: 954, w: 83, h: 84, z: 46 },
    ] },

  { category: 'lollipop', label: 'lollipop', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 115, y: 331, w: 33, h: 68, z: 32, r: 0.70 },
      { x: 1366, y: 806, w: 55, h: 113, z: 6, r: -1.20 },
      { x: 430, y: 799, w: 45, h: 93, z: 7, r: 0.70 },
    ] },

  { category: 'long lego', label: 'long lego', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 718, y: 977, w: 112, h: 92, z: 28, r: -0.10 },
      { x: 1233, y: 765, w: 90, h: 74, z: 10 },
    ] },

  { category: 'pencel', label: 'pencel', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 1008, y: 762, w: 93, h: 54, z: 23, r: 0.20 },
      { x: 536, y: 843, w: 93, h: 54, z: 24, r: 0.20 },
      { x: 1149, y: 936, w: 103, h: 59, z: 25, r: 0.20 },
      { x: 871, y: 931, w: 93, h: 54, z: 54, r: 0.20 },
    ] },

  { category: 'pink candy', label: 'pink candy', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 469, y: 875, w: 72, h: 28, z: 33 },
      { x: 983, y: 920, w: 80, h: 31, z: 30 },
      { x: 921, y: 563, w: 56, h: 22, z: 35 },
      { x: 146, y: 348, w: 46, h: 18, z: 31 },
      { x: 567, y: 489, w: 42, h: 16, z: 51 },
    ] },

  { category: 'rabit', label: 'rabit', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 521, y: 675, w: 80, h: 126, z: 26 },
      { x: 1420, y: 738, w: 88, h: 139, z: 27 },
      { x: 703, y: 553, w: 65, h: 102, z: 29, r: 1.10 },
    ] },

  { category: 'remocontroller', label: 'remocontroller', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 444, y: 422, w: 34, h: 67, z: 4, r: -1.30 },
      { x: 934, y: 979, w: 59, h: 116, z: 11, r: -1.30 },
    ] },

  { category: 'robot', label: 'robot', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 628, y: 837, w: 64, h: 120, z: 19 },
      { x: 275, y: 691, w: 64, h: 120, z: 21 },
      { x: 950, y: 502, w: 64, h: 120, z: 20 },
    ] },

  { category: 'shoes', label: 'shoes', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 941, y: 841, w: 120, h: 104, z: 50 },
      { x: 822, y: 361, w: 68, h: 60, z: 52 },
    ] },

  { category: 'train', label: 'train', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 1152, y: 822, w: 120, h: 111, z: 40 },
    ] },

  { category: 'truck', label: 'truck', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 1243, y: 859, w: 139, h: 120, z: 41 },
      { x: 464, y: 657, w: 113, h: 98, z: 5 },
    ] },

  { category: 'xylophone', label: 'xylophone', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 711, y: 835, w: 111, h: 126, z: 61 },
    ] },
];

function generateTrash(): TrashItem[] {
  const items: TrashItem[] = [];
  for (const spec of CATEGORIES) {
    spec.instances.forEach((inst, i) => {
      const variantNum = inst.v ?? (spec.variants ? (i % spec.variants) + 1 : null);
      const texturePath = variantNum !== null
        ? `./images/trash_lv3_${spec.category}${variantNum}.png`
        : `./images/trash_lv3_${spec.category}.png`;

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

export const LV3_DEMO: SceneData = {
  id: 'lv3',
  title: { ko: '아이방', en: 'Kids Room' },
  story: {
    ko: '장난감 폭풍 다음 날',
    en: 'After Toy Storm',
  },
  backgroundClean: './images/bg_lv3_clean.png',
  backgroundMessy: './images/bg_lv3_clean.png',
  trashItems: generateTrash(),
  interactiveObjects: [],
  timeLimit: 120,
  pig: {
    position: { x: 840, y: 701 },
    size: 200,
  },
  contentShiftX: 0,
  bgDisplayWidth: 1680,
  bgEdgeColor: 0x0fb97e,
};
