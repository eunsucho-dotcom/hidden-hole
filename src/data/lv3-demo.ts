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
      { x: 856, y: 1025, w: 153, h: 150, z: 30 },
      { x: 763, y: 507, w: 106, h: 104, z: 8, r: 0.30 },
    ] },

  { category: 'barbie doll', label: 'barbie doll', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 682, y: 300, w: 104, h: 113, z: 67 },
      { x: 1367, y: 407, w: 110, h: 120, z: 37 },
    ] },

  { category: 'bear', label: 'bear', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 1267, y: 536, w: 120, h: 139, z: 7 },
      { x: 443, y: 325, w: 97, h: 112, z: 68 },
    ] },

  { category: 'block frame', label: 'block frame', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 1023, y: 681, w: 105, h: 120, z: 65 },
      { x: 405, y: 879, w: 104, h: 119, z: 57 },
    ] },

  { category: 'book', label: 'book', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 336, y: 853, w: 92, h: 92, z: 32, r: 0.50 },
      { x: 1014, y: 1007, w: 112, h: 112, z: 31, r: 0.50 },
    ] },

  { category: 'crayon', label: 'crayon', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 505, y: 772, w: 56, h: 65, z: 4 },
      { x: 1069, y: 936, w: 64, h: 75, z: 6 },
      { x: 1043, y: 562, w: 52, h: 61, z: 62, r: -1.40 },
      { x: 141, y: 735, w: 50, h: 59, z: 59, r: -1.40 },
    ] },

  { category: 'cube', label: 'cube', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 266, y: 441, w: 59, h: 54, z: 48 },
      { x: 574, y: 566, w: 50, h: 46, z: 34 },
      { x: 1124, y: 584, w: 50, h: 46, z: 36 },
    ] },

  { category: 'dinosaur', label: 'dinosaur', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 875, y: 475, w: 139, h: 138, z: 0 },
      { x: 206, y: 737, w: 102, h: 101, z: 61, r: 1.00 },
    ] },

  { category: 'doy ring', label: 'doy ring', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 978, y: 600, w: 80, h: 120, z: 63 },
      { x: 600, y: 604, w: 65, h: 98, z: 35 },
      { x: 308, y: 356, w: 59, h: 88, z: 49 },
    ] },

  { category: 'drum', label: 'drum', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 1170, y: 698, w: 110, h: 114, z: 39 },
      { x: 637, y: 999, w: 127, h: 132, z: 21 },
      { x: 834, y: 549, w: 103, h: 107, z: 25 },
    ] },

  { category: 'duck', label: 'duck', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 336, y: 422, w: 82, h: 88, z: 50 },
      { x: 815, y: 123, w: 67, h: 71, z: 66 },
      { x: 1074, y: 864, w: 77, h: 83, z: 43 },
    ] },

  { category: 'excavator', label: 'excavator', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 628, y: 701, w: 169, h: 158, z: 38, r: -0.10 },
    ] },

  { category: 'green candy', label: 'green candy', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 892, y: 552, w: 48, h: 19, z: 20 },
      { x: 871, y: 223, w: 52, h: 21, z: 53 },
      { x: 1526, y: 654, w: 55, h: 21, z: 55 },
      { x: 763, y: 595, w: 58, h: 23, z: 45 },
      { x: 1025, y: 810, w: 67, h: 26, z: 44 },
      { x: 1323, y: 335, w: 55, h: 21, z: 54 },
      { x: 781, y: 813, w: 48, h: 19, z: 26 },
      { x: 400, y: 434, w: 52, h: 21, z: 46 },
    ] },

  { category: 'keyboard', label: 'keyboard', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 1062, y: 648, w: 126, h: 107, z: 64 },
      { x: 316, y: 758, w: 139, h: 118, z: 60 },
    ] },

  { category: 'lego', label: 'lego', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 1105, y: 754, w: 83, h: 84, z: 22 },
      { x: 773, y: 924, w: 83, h: 84, z: 23 },
      { x: 389, y: 722, w: 78, h: 79, z: 58 },
      { x: 510, y: 936, w: 81, h: 82, z: 24 },
    ] },

  { category: 'lollipop', label: 'lollipop', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 115, y: 331, w: 38, h: 79, z: 51, r: 0.70 },
      { x: 1366, y: 806, w: 55, h: 113, z: 2, r: -1.20 },
      { x: 430, y: 799, w: 45, h: 93, z: 3, r: 0.70 },
    ] },

  { category: 'long lego', label: 'long lego', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 718, y: 977, w: 112, h: 92, z: 17, r: -0.10 },
      { x: 1233, y: 765, w: 90, h: 74, z: 40 },
    ] },

  { category: 'pencel', label: 'pencel', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 1008, y: 762, w: 93, h: 54, z: 12, r: 0.20 },
      { x: 536, y: 843, w: 93, h: 54, z: 13, r: 0.20 },
      { x: 1149, y: 936, w: 103, h: 59, z: 14, r: 0.20 },
      { x: 871, y: 931, w: 93, h: 54, z: 29, r: 0.20 },
    ] },

  { category: 'pink candy', label: 'pink candy', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 481, y: 877, w: 72, h: 28, z: 56 },
      { x: 983, y: 920, w: 80, h: 31, z: 19 },
      { x: 146, y: 348, w: 52, h: 20, z: 52 },
      { x: 567, y: 489, w: 50, h: 20, z: 69 },
    ] },

  { category: 'rabit', label: 'rabit', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 521, y: 675, w: 80, h: 126, z: 15 },
      { x: 1420, y: 738, w: 88, h: 139, z: 16 },
      { x: 703, y: 553, w: 65, h: 102, z: 18, r: 1.10 },
    ] },

  { category: 'remocontroller', label: 'remocontroller', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 448, y: 417, w: 40, h: 78, z: 47, r: -1.30 },
      { x: 934, y: 979, w: 59, h: 116, z: 5, r: -1.30 },
    ] },

  { category: 'robot', label: 'robot', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 628, y: 837, w: 64, h: 120, z: 9 },
      { x: 275, y: 691, w: 64, h: 120, z: 11 },
      { x: 950, y: 502, w: 64, h: 120, z: 10 },
    ] },

  { category: 'shoes', label: 'shoes', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 941, y: 841, w: 120, h: 104, z: 27 },
      { x: 822, y: 361, w: 68, h: 59, z: 28 },
    ] },

  { category: 'train', label: 'train', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 1152, y: 822, w: 120, h: 111, z: 41 },
    ] },

  { category: 'truck', label: 'truck', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 1243, y: 859, w: 139, h: 121, z: 42 },
      { x: 464, y: 657, w: 113, h: 98, z: 1 },
    ] },

  { category: 'xylophone', label: 'xylophone', emoji: '🧸', defaultSize: { w: 120, h: 120 },
    instances: [
      { x: 711, y: 835, w: 111, h: 126, z: 33 },
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
    position: { x: 840, y: 703 },
    size: 200,
  },
  contentShiftX: 0,
  bgDisplayWidth: 1680,
  bgEdgeColor: 0x0fb97e,
};
