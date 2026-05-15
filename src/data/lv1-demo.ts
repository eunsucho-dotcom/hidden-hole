import type { SceneData, TrashItem } from '../primitives/types';

/**
 * Lv1 데이터 — 본인 편집 모드로 직접 조정한 최종 위치 + 사이즈 + 레이어
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
  { category: 'browncup', label: '갈색컵', emoji: '🥃', defaultSize: { w: 38, h: 54 },
    instances: [
      { x: 381, y: 579, w: 38, h: 54, z: 0 },
      { x: 1110, y: 575, w: 44, h: 63, z: 50 },
      { x: 989, y: 804, w: 44, h: 63, z: 35 },
    ] },

  { category: 'snackbag1', label: '과자봉지1', emoji: '🍿', defaultSize: { w: 174, h: 145 },
    instances: [
      { x: 424, y: 892, w: 174, h: 145, z: 42 },
      { x: 830, y: 495, w: 137, h: 114, z: 64 },
    ] },

  { category: 'snackbag2', label: '과자봉지2', emoji: '🍪', defaultSize: { w: 110, h: 69 },
    instances: [
      { x: 845, y: 794, w: 110, h: 69, z: 48 },
      { x: 442, y: 560, w: 112, h: 70, z: 1 },
    ] },

  { category: 'crumbs', label: '과자부스러기', emoji: '✨', defaultSize: { w: 30, h: 30 }, variants: 6,
    instances: [
      { x: 1264, y: 583, w: 45, h: 22, z: 2, v: 2 },
      { x: 1074, y: 805, w: 36, h: 31, z: 3, v: 3 },
      { x: 855, y: 720, w: 21, h: 22, z: 38, v: 4 },
      { x: 946, y: 831, w: 87, h: 49, z: 4, v: 5 },
      { x: 547, y: 834, w: 58, h: 45, z: 5, v: 6 },
      { x: 1060, y: 596, w: 34, h: 29, z: 72, v: 1 },
      { x: 248, y: 809, w: 45, h: 22, z: 47, v: 2 },
      { x: 496, y: 864, w: 52, h: 45, z: 6, v: 3 },
      { x: 1020, y: 1057, w: 35, h: 37, z: 7, v: 4 },
      { x: 769, y: 1061, w: 71, h: 61, z: 8, v: 1 },
      { x: 1146, y: 773, w: 42, h: 20, z: 9, v: 2 },
    ] },

  { category: 'tissueroll', label: '두루마리휴지', emoji: '🧻', defaultSize: { w: 120, h: 90 },
    instances: [
      { x: 974, y: 532, w: 107, h: 82, z: 75 },
      { x: 230, y: 871, w: 120, h: 92, z: 52 },
      { x: 1099, y: 1045, w: 161, h: 123, z: 56 },
    ] },

  { category: 'beer', label: '맥주', emoji: '🍻', defaultSize: { w: 55, h: 100 },
    instances: [
      { x: 1189, y: 565, w: 53, h: 99, z: 45 },
      { x: 563, y: 513, w: 51, h: 95, z: 49 },
      { x: 289, y: 578, w: 50, h: 94, z: 10 },
      { x: 1376, y: 873, w: 59, h: 111, z: 55 },
      { x: 1182, y: 817, w: 54, h: 102, z: 11 },
      { x: 590, y: 919, w: 65, h: 122, z: 62, r: 1.50 },
      { x: 1421, y: 803, w: 50, h: 94, z: 54 },
      { x: 1344, y: 857, w: 60, h: 113, z: 53, r: -1.40 },
      { x: 743, y: 888, w: 53, h: 99, z: 12 },
      { x: 781, y: 715, w: 54, h: 101, z: 67 },
      { x: 746, y: 723, w: 60, h: 113, z: 68 },
      { x: 760, y: 665, w: 50, h: 94, z: 66 },
      { x: 290, y: 762, w: 51, h: 96, z: 69 },
      { x: 955, y: 1040, w: 58, h: 108, z: 13, r: 1.50 },
    ] },

  { category: 'beercup', label: '맥주컵', emoji: '🍺', defaultSize: { w: 63, h: 77 },
    instances: [
      { x: 452, y: 529, w: 63, h: 77, z: 14 },
      { x: 919, y: 795, w: 65, h: 80, z: 77 },
    ] },

  { category: 'plastic', label: '비닐봉지', emoji: '🛍️', defaultSize: { w: 130, h: 110 }, variants: 2,
    instances: [
      { x: 1155, y: 376, w: 110, h: 101, z: 15, v: 1 },
      { x: 349, y: 867, w: 137, h: 115, z: 41, v: 2 },
      { x: 1541, y: 719, w: 139, h: 127, z: 82, v: 1 },
      { x: 936, y: 734, w: 144, h: 121, z: 76, v: 2 },
    ] },

  { category: 'redcup', label: '빨간컵', emoji: '🥤', defaultSize: { w: 67, h: 90 },
    instances: [
      { x: 1042, y: 920, w: 67, h: 90, z: 79 },
      { x: 691, y: 939, w: 67, h: 90, z: 37 },
      { x: 658, y: 909, w: 64, h: 87, z: 16 },
      { x: 1471, y: 759, w: 67, h: 91, z: 83 },
      { x: 1309, y: 776, w: 55, h: 74, z: 58 },
      { x: 1036, y: 775, w: 62, h: 84, z: 36 },
    ] },

  { category: 'soju', label: '소주', emoji: '🍶', defaultSize: { w: 40, h: 114 },
    instances: [
      { x: 579, y: 672, w: 40, h: 114, z: 17 },
      { x: 699, y: 664, w: 43, h: 125, z: 34 },
      { x: 689, y: 592, w: 33, h: 94, z: 18 },
      { x: 828, y: 938, w: 55, h: 159, z: 59, r: 1.50 },
      { x: 558, y: 891, w: 53, h: 152, z: 61, r: -1.50 },
      { x: 118, y: 561, w: 44, h: 126, z: 19 },
      { x: 204, y: 586, w: 45, h: 131, z: 20 },
      { x: 651, y: 687, w: 46, h: 132, z: 33, r: 1.30 },
      { x: 536, y: 496, w: 37, h: 108, z: 21 },
      { x: 666, y: 609, w: 34, h: 99, z: 22 },
    ] },

  { category: 'towel', label: '수건', emoji: '🧴', defaultSize: { w: 173, h: 175 },
    instances: [
      { x: 840, y: 575, w: 173, h: 175, z: 51 },
      { x: 1386, y: 723, w: 169, h: 171, z: 57 },
    ] },

  { category: 'pizza', label: '피자', emoji: '🍕', defaultSize: { w: 200, h: 150 }, variants: 3,
    instances: [
      { x: 1237, y: 940, w: 390, h: 238, z: 80, v: 1 },
      { x: 772, y: 1018, w: 175, h: 91, z: 60, v: 2 },
      { x: 644, y: 1002, w: 136, h: 92, z: 46, v: 3 },
    ] },

  { category: 'tissue', label: '휴지뭉치', emoji: '🧻', defaultSize: { w: 50, h: 50 }, variants: 3,
    instances: [
      { x: 1245, y: 399, w: 49, h: 44, z: 44, v: 1 },
      { x: 1040, y: 556, w: 111, h: 60, z: 73, v: 2 },
      { x: 772, y: 192, w: 78, h: 42, z: 43, v: 3 },
      { x: 738, y: 949, w: 52, h: 47, z: 23, v: 1 },
      { x: 331, y: 595, w: 51, h: 27, z: 24, v: 2 },
      { x: 864, y: 1054, w: 49, h: 26, z: 25, v: 3 },
      { x: 1027, y: 982, w: 49, h: 44, z: 40, v: 1 },
      { x: 274, y: 832, w: 49, h: 26, z: 26, v: 2 },
      { x: 1238, y: 786, w: 49, h: 26, z: 27, v: 3 },
      { x: 581, y: 812, w: 49, h: 44, z: 28, v: 1 },
      { x: 1024, y: 709, w: 49, h: 26, z: 29, v: 2 },
      { x: 638, y: 678, w: 81, h: 44, z: 30, v: 3 },
      { x: 915, y: 966, w: 58, h: 52, z: 39, v: 1 },
      { x: 524, y: 543, w: 67, h: 36, z: 71, v: 2 },
      { x: 1105, y: 737, w: 124, h: 67, z: 31, v: 3 },
      { x: 1243, y: 835, w: 43, h: 39, z: 32, v: 1 },
      { x: 560, y: 763, w: 85, h: 45, z: 86, v: 2 },
      { x: 1393, y: 530, w: 67, h: 36, z: 70, v: 3 },
    ] },

  { category: 'letter', label: '편지', emoji: '✉️', defaultSize: { w: 148, h: 96 },
    instances: [
      { x: 1553, y: 760, w: 148, h: 96, z: 85 },
    ] },

  { category: 'box', label: '박스', emoji: '📦', defaultSize: { w: 231, h: 203 },
    instances: [
      { x: 1540, y: 825, w: 231, h: 203, z: 84 },
    ] },

  { category: 'pants', label: '바지', emoji: '👖', defaultSize: { w: 244, h: 232 },
    instances: [
      { x: 968, y: 588, w: 244, h: 232, z: 74 },
    ] },

  { category: 'frame', label: '액자', emoji: '🖼️', defaultSize: { w: 97, h: 117 }, isHidden: true,
    instances: [
      { x: 912, y: 477, w: 97, h: 117, z: 63 },
    ] },

  { category: 'ring', label: '반지', emoji: '💍', defaultSize: { w: 160, h: 174 }, isHidden: true,
    instances: [
      { x: 1626, y: 759, w: 55, h: 60, z: 78 },
    ] },
];

function generateTrash(): TrashItem[] {
  const items: TrashItem[] = [];
  for (const spec of CATEGORIES) {
    spec.instances.forEach((inst, i) => {
      const variantNum = inst.v ?? (spec.variants ? (i % spec.variants) + 1 : null);
      const texturePath = variantNum !== null
        ? `/images/trash_lv1_${spec.category}${variantNum}.png`
        : `/images/trash_lv1_${spec.category}.png`;

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

export const LV1_DEMO: SceneData = {
  id: 'lv1',
  title: { ko: '실연의 밤', en: 'The Breakup Night' },
  story: {
    ko: '파티 다음 날 새벽',
    en: 'The Morning After The Party.',
  },
  backgroundClean: '/images/bg_lv1_clean.png',
  backgroundMessy: '/images/bg_lv1_clean.png',
  trashItems: generateTrash(),
  interactiveObjects: [
    {
      id: 'cushion',
      position: { x: 907, y: 486 },
      size: { width: 188, height: 163 },
      z: 65,
      textureBefore: '/images/interact_lv1_cushion.png',
      textureAfter: '/images/interact_lv1_cushion.png',
      interactionType: 'tap',
      isInteracted: false,
      revealsTrashIds: ['frame_1'],
    },
    {
      id: 'flowerpot',
      position: { x: 1621, y: 675 },
      size: { width: 188, height: 291 },
      z: 81,
      textureBefore: '/images/interact_lv1_flowerpot.png',
      textureAfter: '/images/interact_lv1_flowerpot.png',
      interactionType: 'tap',
      isInteracted: false,
      revealsTrashIds: ['ring_1'],
    },
  ],
  timeLimit: 120,
  pig: {
    position: { x: 425, y: 754 },
    size: 200,
  },
  // 패널 폭 240으로 넓어진 만큼 좌측 시프트 보정
  contentShiftX: -60,
};
