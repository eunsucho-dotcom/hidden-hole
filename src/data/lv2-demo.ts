import type { SceneData, TrashItem } from '../primitives/types';

/**
 * Lv2 데이터 — 키친 씬
 *
 * 22개 카테고리, 임시 위치는 가운데 격자. 본인이 에디터에서 재배치.
 * 단축키: E=편집 토글, drag=이동, wheel=사이즈, D=복사, X=삭제,
 *        Q=반시계 회전, T=시계 회전, R=회전 초기화, S=export
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

// 격자 배치 헬퍼 (자동 분포, 본인이 에디터로 재배치)
let gridIdx = 0;
function gridPos(): { x: number; y: number } {
  const cols = 6;
  const startX = 350;
  const startY = 250;
  const spacingX = 200;
  const spacingY = 180;
  const col = gridIdx % cols;
  const row = Math.floor(gridIdx / cols);
  gridIdx++;
  return { x: startX + col * spacingX, y: startY + row * spacingY };
}

const CATEGORIES: CategorySpec[] = [
  { category: 'apple', label: '사과', emoji: '🍎', defaultSize: { w: 90, h: 90 },
    instances: [{ ...gridPos(), z: 10 }] },

  { category: 'chicken', label: '치킨', emoji: '🍗', defaultSize: { w: 140, h: 100 },
    instances: [{ ...gridPos(), z: 11 }] },

  { category: 'cibdunebt', label: '양념통', emoji: '🧂', defaultSize: { w: 70, h: 100 }, variants: 4,
    instances: [
      { ...gridPos(), z: 12, v: 1 },
      { ...gridPos(), z: 13, v: 2 },
      { ...gridPos(), z: 14, v: 3 },
      { ...gridPos(), z: 15, v: 4 },
    ] },

  { category: 'cup', label: '컵', emoji: '☕', defaultSize: { w: 90, h: 110 },
    instances: [{ ...gridPos(), z: 16 }] },

  { category: 'cuttingboard', label: '도마', emoji: '🍽️', defaultSize: { w: 160, h: 120 },
    instances: [{ ...gridPos(), z: 17 }] },

  { category: 'dishcloth', label: '행주', emoji: '🧻', defaultSize: { w: 120, h: 100 },
    instances: [{ ...gridPos(), z: 18 }] },

  { category: 'eeg', label: '깨진 계란', emoji: '🥚', defaultSize: { w: 130, h: 110 },
    instances: [{ ...gridPos(), z: 19 }] },

  { category: 'flour', label: '밀가루', emoji: '🌾', defaultSize: { w: 100, h: 130 },
    instances: [{ ...gridPos(), z: 20 }] },

  { category: 'fork', label: '포크', emoji: '🍴', defaultSize: { w: 80, h: 140 },
    instances: [{ ...gridPos(), z: 21 }] },

  { category: 'greenonion', label: '파', emoji: '🌿', defaultSize: { w: 150, h: 80 },
    instances: [{ ...gridPos(), z: 22 }] },

  { category: 'milk', label: '우유', emoji: '🥛', defaultSize: { w: 100, h: 150 },
    instances: [{ ...gridPos(), z: 23 }] },

  { category: 'mixer', label: '믹서', emoji: '🥤', defaultSize: { w: 110, h: 160 },
    instances: [{ ...gridPos(), z: 24 }] },

  { category: 'nife', label: '칼', emoji: '🔪', defaultSize: { w: 130, h: 50 },
    instances: [{ ...gridPos(), z: 25 }] },

  { category: 'onion', label: '양파', emoji: '🧅', defaultSize: { w: 90, h: 90 },
    instances: [{ ...gridPos(), z: 26 }] },

  { category: 'scissors', label: '가위', emoji: '✂️', defaultSize: { w: 110, h: 80 },
    instances: [{ ...gridPos(), z: 27 }] },

  { category: 'scoop', label: '국자', emoji: '🥄', defaultSize: { w: 80, h: 160 },
    instances: [{ ...gridPos(), z: 28 }] },

  { category: 'soup', label: '국', emoji: '🍲', defaultSize: { w: 150, h: 130 },
    instances: [{ ...gridPos(), z: 29 }] },

  { category: 'source', label: '소스', emoji: '🍶', defaultSize: { w: 80, h: 130 },
    instances: [{ ...gridPos(), z: 30 }] },

  { category: 'soysauce', label: '간장', emoji: '🍯', defaultSize: { w: 80, h: 130 },
    instances: [{ ...gridPos(), z: 31 }] },

  { category: 'spoon', label: '숟가락', emoji: '🥄', defaultSize: { w: 80, h: 140 },
    instances: [{ ...gridPos(), z: 32 }] },

  { category: 'towel', label: '수건', emoji: '🧴', defaultSize: { w: 140, h: 140 },
    instances: [{ ...gridPos(), z: 33 }] },

  { category: 'trashbeen', label: '쓰레기통', emoji: '🗑️', defaultSize: { w: 130, h: 180 },
    instances: [{ ...gridPos(), z: 34 }] },
];

function generateTrash(): TrashItem[] {
  const items: TrashItem[] = [];
  for (const spec of CATEGORIES) {
    spec.instances.forEach((inst, i) => {
      const variantNum = inst.v ?? (spec.variants ? (i % spec.variants) + 1 : null);
      // Lv2는 variant 파일명이 `_N` 패턴 (예: trash_lv2_cibdunebt_1.png)
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
    position: { x: 425, y: 786 },
    size: 200,
  },
};
