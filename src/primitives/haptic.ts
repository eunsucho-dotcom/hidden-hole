/**
 * 햅틱 (모바일 진동) 유틸리티
 *
 * 우선순위:
 *   1. playforge VibrateBridge (안드로이드 네이티브, APK 환경)
 *   2. navigator.vibrate (웹 표준 API, 모바일 Chrome 등)
 *   3. 둘 다 없으면 무시 (PC 브라우저 등)
 */

type VibrateBridge = {
  vibrate(ms: number): void;
  vibratePattern?(arr: number[]): void;
};

interface WindowWithBridge {
  VibrateBridge?: VibrateBridge;
}

/**
 * 짧은 진동 — ms 밀리초
 * 사물 클릭, 활성화 등 가벼운 피드백
 */
export function vibrate(ms: number = 25): void {
  const w = window as unknown as WindowWithBridge;
  if (w.VibrateBridge && typeof w.VibrateBridge.vibrate === 'function') {
    w.VibrateBridge.vibrate(ms);
    return;
  }
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(ms);
  }
}

/**
 * 패턴 진동 — [진동, 정지, 진동, ...] 배열
 * 사용처: 카테고리 클리어, 게임 완료 등 강한 피드백
 */
export function vibratePattern(pattern: number[]): void {
  const w = window as unknown as WindowWithBridge;
  if (w.VibrateBridge?.vibratePattern) {
    w.VibrateBridge.vibratePattern(pattern);
    return;
  }
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern);
  }
}
