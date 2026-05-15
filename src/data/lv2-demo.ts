import type { SceneData } from '../primitives/types';
import { LV1_DEMO } from './lv1-demo';

/**
 * Lv2 데이터 — 키친 씬
 *
 * 첫 위치는 Lv1을 그대로 복사. 본인이 에디터에서
 * D = 복사, Q/T = 회전, R = 회전 초기화, X = 삭제, wheel = 사이즈, drag = 위치
 * 로 재배치 후 S로 export → 이 파일에 붙여넣기.
 */

export const LV2_DEMO: SceneData = {
  id: 'lv2',
  title: { ko: '키친', en: 'Kitchen' },
  story: {
    ko: '뭘 만들었는지 모를 부엌',
    en: 'No idea what was cooking',
  },
  backgroundClean: '/images/bg_lv2_clean.png',
  backgroundMessy: '/images/bg_lv2_clean.png',
  // Lv1 트래시 아이템들을 복사 (본인이 에디터에서 재배치)
  trashItems: LV1_DEMO.trashItems.map((t) => ({
    ...t,
    id: t.id.replace('_', '_lv2_'),
    isActivated: false,
  })),
  interactiveObjects: LV1_DEMO.interactiveObjects.map((o) => ({
    ...o,
    id: `${o.id}_lv2`,
    isInteracted: false,
    revealsTrashIds: o.revealsTrashIds.map((tid) => tid.replace('_', '_lv2_')),
  })),
  timeLimit: 120,
  pig: {
    position: { x: 425, y: 786 },
    size: 200,
  },
};
