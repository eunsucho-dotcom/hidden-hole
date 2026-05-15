// 결과 화면 데이터 타입

export interface ResultData {
  sceneId: string;
  sceneTitle: { ko: string; en: string };
  trashCount: number;
  elapsedMs: number;
  baseScore: number;
  timeBonus: number;
  comboBonus: number;
  perfectBonus: number;
  totalScore: number;
  stars: number; // 0~3
}

export function calculateStars(totalScore: number): number {
  if (totalScore >= 2200) return 3;
  if (totalScore >= 1500) return 2;
  if (totalScore > 0) return 1;
  return 0;
}
