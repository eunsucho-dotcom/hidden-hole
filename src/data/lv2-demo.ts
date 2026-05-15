import type { SceneData, TrashItem } from '../primitives/types';

/**
 * Lv2 데이터 — 키친 씬 (새 카테고리)
 *
 * 본인이 새 카테고리 PNG를 올리면 아래 CATEGORIES 배열에 한 줄씩 추가됨.
 * 에디터에서 D = 복사, X = 삭제, Q/T = 회전, R = 회전 초기화,
 *           wheel = 사이즈, drag = 위치, S = export
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

// ====== Lv2 카테고리 (PNG 올리면 여기에 추가) ======
const CATEGORIES: CategorySpec[] = [
  // 예시 구조 (PNG: trash_lv2_<category>.png)
  // {
  //   category: 'cup',
  //   label: '컵',
  //   emoji: '☕',
  //   defaultSize: { w: 80, h: 100 },
  //   instances: [
  //     { x: 800, y: 500, w: 80, h: 100, z: 10 },
  //   ],
  // },
];

function generateTrash(): TrashItem[] {
  const items: TrashItem[] = [];
  for (const spec of CATEGORIES) {
    spec.instances.forEach((inst, i) => {
      const variantNum = inst.v ?? (spec.variants ? (i % spec.variants) + 1 : null);
      const texturePath = variantNum !== null
        ? `/images/trash_lv2_${spec.category}${variantNum}.png`
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
  interactiveObjects: [], // Lv2는 인터랙티브 없이 시작 (필요시 추가)
  timeLimit: 120,
  pig: {
    position: { x: 425, y: 786 },
    size: 200,
  },
};
