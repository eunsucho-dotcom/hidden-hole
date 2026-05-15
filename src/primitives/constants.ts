// 게임 전역 상수

export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

// 좌측 아이템 패널 (Hidden Folks 스타일 - 1열 세로 스크롤, 22+개 카테고리 수용)
export const LEFT_PANEL_WIDTH = 180;
export const SCENE_AREA_X = LEFT_PANEL_WIDTH;
export const SCENE_AREA_WIDTH = GAME_WIDTH - LEFT_PANEL_WIDTH;

// 아이템 슬롯 크기 (1열, 크게)
export const ITEM_SLOT_SIZE = 144;
// active 슬롯이 1.2배 확대되므로 간격을 넉넉히
export const ITEM_SLOT_GAP = 28;
export const PANEL_COLUMNS = 1;
// 패널 스크롤 영역 시작 y — 상단 타이머 바(70px) 아래
export const PANEL_SCROLL_TOP = 118;
// 슬롯 컨테이너 상단 여백 — 첫 슬롯의 1.2x 확대 영역이 마스크에 잘리지 않도록
export const SLOT_TOP_PADDING = 22;

// 컬러 (spec.md와 동기화)
export const COLORS = {
  CREAM_WHITE: 0xfaf3e0,
  WARM_BEIGE: 0xe8d5b7,
  COZY_PINK: 0xf4a6a6,
  MINT_GREEN: 0xa8d8b9,
  SUNSET_ORANGE: 0xff9f68, // ⭐ 활성화 글로우 전용
  DARK_CHARCOAL: 0x3d3d3d,
  // 씬별
  LV1_NAVY: 0x2c3e50,
  LV1_LAMP: 0xf4d35e,
  LV2_GOLD: 0xe9b872,
  LV2_SUNLIGHT: 0xfff3d6,
  LV3_BLUE: 0x6b7a99,
  LV3_FLUOR: 0xe8f0f8,
  BG_DARK: 0x1a1a1a,
} as const;

// 활성화 비주얼 (점프 + 글로우)
export const ACTIVATION = {
  JUMP_HEIGHT: 5, // px
  GLOW_INTENSITY: 0.8,
  GLOW_DURATION_MS: 400,
  IDLE_AMPLITUDE: 1.5, // 인터랙티브 오브젝트 미세 흔들림 (px)
  IDLE_PERIOD_MS: 1500,
} as const;

// 블랙홀 흡입 시퀀스 타이밍 (ms)
export const SUCTION = {
  PHASE_START_MS: 0,     // 슈우우~
  PHASE_RUSH_MS: 300,    // 와다다다 시작
  PHASE_CLIMAX_MS: 1500, // 꼴록!
  PHASE_SILENCE_MS: 2000,// 침묵
  PHASE_REVEAL_MS: 2300, // 차랑~ 새 지저귐
  TOTAL_MS: 2500,
  HOLE_RADIUS: 60, // 최종 흡입 반경
} as const;

// 점수 시스템
export const SCORING = {
  PER_TRASH: 100,
  TIME_BONUS_PER_SECOND: 10,
  TIME_BONUS_MAX_SECONDS: 60,
  COMBO_MULTIPLIER: 1.5,
  COMBO_WINDOW_MS: 1000,
  PERFECT_BONUS: 500,
  STAR_1_THRESHOLD: 0,
  STAR_2_THRESHOLD: 1500,
  STAR_3_THRESHOLD: 2200,
} as const;

// 힌트 시스템
export const HINT = {
  STUCK_TIMEOUT_MS: 15000, // 15초 막힘 감지
  HINT_PULSE_DURATION_MS: 1000,
} as const;

// 스킬 시스템
export const SKILLS = {
  EOK_UNLOCK_ROUNDS: 5,
  CLEAR_UNLOCK_ROUNDS: 10,
  CLEAR_CHARGE_ROUNDS: 5,
} as const;
