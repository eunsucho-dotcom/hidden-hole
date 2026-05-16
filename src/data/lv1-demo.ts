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
      { x: 376, y: 570, w: 44, h: 63, z: 46 },
      { x: 1123, y: 573, w: 49, h: 69, z: 47 },
      { x: 989, y: 804, w: 44, h: 63, z: 12 },
    ] },

  { category: 'snackbag1', label: '과자봉지1', emoji: '🍿', defaultSize: { w: 174, h: 145 },
    instances: [
      { x: 424, y: 892, w: 174, h: 145, z: 43 },
      { x: 830, y: 495, w: 137, h: 114, z: 28 },
    ] },

  { category: 'snackbag2', label: '과자봉지2', emoji: '🍪', defaultSize: { w: 110, h: 69 },
    instances: [
      { x: 845, y: 794, w: 110, h: 69, z: 17 },
      { x: 453, y: 556, w: 112, h: 70, z: 45 },
    ] },

  { category: 'crumbs', label: '과자부스러기', emoji: '✨', defaultSize: { w: 30, h: 30 }, variants: 6,
    instances: [
      { x: 1071, y: 589, w: 80, h: 39, z: 55 },
      { x: 946, y: 837, w: 96, h: 54, z: 35 },
      { x: 547, y: 834, w: 58, h: 45, z: 0 },
      { x: 555, y: 747, w: 80, h: 39, z: 61 },
      { x: 496, y: 864, w: 52, h: 45, z: 1 },
      { x: 1115, y: 741, w: 65, h: 32, z: 60 },
    ] },

  { category: 'tissueroll', label: '두루마리휴지', emoji: '🧻', defaultSize: { w: 120, h: 90 },
    instances: [
      { x: 975, y: 536, w: 107, h: 82, z: 57 },
      { x: 258, y: 841, w: 120, h: 92, z: 41 },
      { x: 1095, y: 1027, w: 161, h: 123, z: 38 },
    ] },

  { category: 'beer', label: '맥주', emoji: '🍻', defaultSize: { w: 55, h: 100 },
    instances: [
      { x: 1189, y: 565, w: 53, h: 99, z: 15 },
      { x: 588, y: 497, w: 51, h: 95, z: 51 },
      { x: 289, y: 578, w: 50, h: 94, z: 2 },
      { x: 1376, y: 873, w: 59, h: 111, z: 21 },
      { x: 1182, y: 817, w: 54, h: 102, z: 3 },
      { x: 590, y: 919, w: 65, h: 122, z: 26, r: 1.50 },
      { x: 1421, y: 803, w: 50, h: 94, z: 20 },
      { x: 1344, y: 857, w: 60, h: 113, z: 19, r: -1.40 },
      { x: 743, y: 888, w: 53, h: 99, z: 4 },
      { x: 813, y: 693, w: 54, h: 101, z: 52 },
      { x: 738, y: 718, w: 60, h: 113, z: 54 },
      { x: 765, y: 657, w: 50, h: 94, z: 53 },
      { x: 290, y: 762, w: 51, h: 96, z: 29 },
      { x: 955, y: 1040, w: 58, h: 108, z: 5, r: 1.50 },
    ] },

  { category: 'beercup', label: '맥주컵', emoji: '🍺', defaultSize: { w: 63, h: 77 },
    instances: [
      { x: 501, y: 520, w: 63, h: 77, z: 44 },
      { x: 927, y: 773, w: 65, h: 80, z: 59 },
    ] },

  { category: 'plastic', label: '비닐봉지', emoji: '🛍️', defaultSize: { w: 130, h: 110 }, variants: 2,
    instances: [
      { x: 1156, y: 363, w: 110, h: 101, z: 33 },
      { x: 349, y: 867, w: 137, h: 115, z: 42 },
      { x: 1519, y: 703, w: 119, h: 109, z: 63 },
      { x: 933, y: 718, w: 144, h: 121, z: 58 },
    ] },

  { category: 'redcup', label: '빨간컵', emoji: '🥤', defaultSize: { w: 67, h: 90 },
    instances: [
      { x: 1042, y: 920, w: 67, h: 90, z: 31 },
      { x: 691, y: 939, w: 67, h: 90, z: 14 },
      { x: 658, y: 909, w: 64, h: 87, z: 6 },
      { x: 1309, y: 776, w: 55, h: 74, z: 23 },
      { x: 1036, y: 775, w: 62, h: 84, z: 13 },
    ] },

  { category: 'soju', label: '소주', emoji: '🍶', defaultSize: { w: 40, h: 114 },
    instances: [
      { x: 584, y: 666, w: 40, h: 114, z: 62 },
      { x: 699, y: 664, w: 43, h: 125, z: 11 },
      { x: 828, y: 938, w: 55, h: 159, z: 24, r: 1.50 },
      { x: 558, y: 891, w: 53, h: 152, z: 25, r: -1.50 },
      { x: 204, y: 586, w: 45, h: 131, z: 7 },
      { x: 773, y: 168, w: 39, h: 113, z: 48, r: 1.60 },
      { x: 536, y: 496, w: 37, h: 108, z: 8 },
      { x: 666, y: 609, w: 34, h: 99, z: 9 },
    ] },

  { category: 'towel', label: '수건', emoji: '🧴', defaultSize: { w: 173, h: 175 },
    instances: [
      { x: 840, y: 575, w: 173, h: 175, z: 18 },
      { x: 1386, y: 723, w: 169, h: 171, z: 22 },
    ] },

  { category: 'pizza', label: '피자', emoji: '🍕', defaultSize: { w: 200, h: 150 }, variants: 3,
    instances: [
      { x: 1249, y: 972, w: 390, h: 238, z: 37 },
      { x: 794, y: 1021, w: 175, h: 91, z: 32 },
      { x: 644, y: 1002, w: 136, h: 92, z: 16 },
    ] },

  { category: 'tissue', label: '휴지뭉치', emoji: '🧻', defaultSize: { w: 50, h: 50 }, variants: 1,
    instances: [
      { x: 767, y: 182, w: 43, h: 38, z: 50 },
      { x: 738, y: 949, w: 52, h: 47, z: 10 },
      { x: 573, y: 797, w: 49, h: 44, z: 40 },
      { x: 921, y: 971, w: 58, h: 52, z: 39 },
      { x: 1231, y: 791, w: 43, h: 39, z: 36 },
      { x: 1230, y: 398, w: 49, h: 44, z: 49 },
    ] },

  { category: 'letter', label: '편지', emoji: '✉️', defaultSize: { w: 148, h: 96 },
    instances: [
      { x: 1560, y: 739, w: 148, h: 96, z: 66 },
    ] },

  { category: 'box', label: '박스', emoji: '📦', defaultSize: { w: 231, h: 203 },
    instances: [
      { x: 1548, y: 807, w: 231, h: 203, z: 65 },
    ] },

  { category: 'pants', label: '바지', emoji: '👖', defaultSize: { w: 244, h: 232 },
    instances: [
      { x: 974, y: 589, w: 244, h: 232, z: 56 },
    ] },

  { category: 'frame', label: '액자', emoji: '🖼️', defaultSize: { w: 97, h: 117 }, isHidden: true,
    instances: [
      { x: 912, y: 477, w: 97, h: 117, z: 27 },
    ] },

  { category: 'ring', label: '반지', emoji: '💍', defaultSize: { w: 160, h: 174 }, isHidden: true,
    instances: [
      { x: 1626, y: 759, w: 55, h: 60, z: 30 },
    ] },
];

function generateTrash(): TrashItem[] {
  const items: TrashItem[] = [];
  for (const spec of CATEGORIES) {
    spec.instances.forEach((inst, i) => {
      const variantNum = inst.v ?? (spec.variants ? (i % spec.variants) + 1 : null);
      const texturePath = variantNum !== null
        ? `./images/trash_lv1_${spec.category}${variantNum}.png`
        : `./images/trash_lv1_${spec.category}.png`;

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
  backgroundClean: './images/bg_lv1_clean.png',
  backgroundMessy: './images/bg_lv1_clean.png',
  trashItems: generateTrash(),
  interactiveObjects: [
    {
      id: 'cushion',
      position: { x: 913, y: 475 },
      size: { width: 188, height: 163 },
      z: 34,
      textureBefore: './images/interact_lv1_cushion.png',
      textureAfter: './images/interact_lv1_cushion.png',
      interactionType: 'tap',
      isInteracted: false,
      revealsTrashIds: ['frame_1'],
    },
    {
      id: 'flowerpot',
      position: { x: 1625, y: 656 },
      size: { width: 188, height: 291 },
      z: 64,
      textureBefore: './images/interact_lv1_flowerpot.png',
      textureAfter: './images/interact_lv1_flowerpot.png',
      interactionType: 'tap',
      isInteracted: false,
      revealsTrashIds: ['ring_1'],
    },
  ],
  timeLimit: 120,
  pig: {
    position: { x: 425, y: 757 },
    size: 200,
  },
  contentShiftX: -60,
};
