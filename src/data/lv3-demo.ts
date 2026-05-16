import type { SceneData, TrashItem } from '../primitives/types';

/**
 * Lv3 데이터 — 어린이방 (장난감 흩어진 씬)
 * 초기 위치는 그리드로 배치 — 사용자가 EDIT 모드(E)에서 옮기고 S 키로 export
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

// 모든 lv3 트래시 — 한 개씩 초기 그리드 배치 (5열 × 6행, 좌상단 (350, 280))
const COLS = 5;
const COL_W = 280;
const ROW_H = 140;
const START_X = 350;
const START_Y = 280;
const gridPos = (i: number): Inst => ({
  x: START_X + (i % COLS) * COL_W,
  y: START_Y + Math.floor(i / COLS) * ROW_H,
});

// 카테고리 정의 — 파일명(공백 포함)을 그대로 category 로 사용
const CATEGORY_NAMES = [
  'ball', 'barbie doll', 'bear', 'block frame', 'book',
  'crayon', 'cube', 'dinosaur', 'doy ring', 'drum',
  'duck', 'excavator', 'green candy', 'keyboard', 'lego',
  'lollipop', 'long lego', 'pencel', 'pink candy', 'rabit',
  'remocontroller', 'robot', 'shoes', 'train', 'truck', 'xylophone',
];

const CATEGORIES: CategorySpec[] = CATEGORY_NAMES.map((name, i) => ({
  category: name,
  label: name,
  emoji: '🧸',
  defaultSize: { w: 120, h: 120 },
  instances: [gridPos(i)],
}));

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
    position: { x: 425, y: 758 },
    size: 200,
  },
  // 방 콘텐츠 중앙쪽으로 (이전 -260 은 너무 좌측)
  contentShiftX: -100,
  // 방 이미지 가장자리 색과 동일 (#0fb97e — 초록)
  bgEdgeColor: 0x0fb97e,
};
