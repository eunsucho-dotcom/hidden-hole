// 게임의 기본 타입들 (Lv.0 Primitives)

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TrashItem {
  id: string;
  category: string;
  categoryLabel?: string;
  categoryEmoji?: string;
  position: Position;
  size: Size;
  rotation?: number;
  z?: number; // 렌더링 z-index (낮을수록 뒤, 높을수록 앞)
  texture: string;
  isActivated: boolean;
  isHidden: boolean;
}

export type InteractionType = 'drag' | 'lift' | 'swipe' | 'tap';

export interface InteractiveObject {
  id: string;
  position: Position;
  size: Size;
  z?: number; // 렌더링 z-index
  textureBefore: string;
  textureAfter: string;
  interactionType: InteractionType;
  isInteracted: boolean;
  revealsTrashIds: string[];
  targetPosition?: Position;
}

export interface SceneData {
  id: string;
  title: { ko: string; en: string };
  story: { ko: string; en: string };
  backgroundClean: string;
  backgroundMessy: string;
  trashItems: TrashItem[];
  interactiveObjects: InteractiveObject[];
  timeLimit?: number;
  // 시그니처 캐릭터 (돼지인형) 위치 — 모든 씬 공통
  pig?: {
    position: Position;
    size: number; // 픽셀 크기 (정사각형 기준)
  };
}

export type GamePhase = 'preview' | 'playing' | 'sucking' | 'reveal' | 'result';

export interface GameState {
  phase: GamePhase;
  currentScene: SceneData | null;
  elapsedTime: number;
  score: number;
  comboCount: number;
}
