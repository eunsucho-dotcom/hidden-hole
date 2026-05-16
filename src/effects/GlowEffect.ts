import { Container, Graphics } from 'pixi.js';
import { ACTIVATION, COLORS } from '../primitives/constants';

/**
 * 활성화 글로우 효과 — 클릭 시 점프 + 노란 빛 테두리
 * 모바일 최적화: BlurFilter 대신 다층 alpha rect 사용 (성능 ~10x ↑)
 */
export class GlowEffect extends Container {
  private glow: Graphics;

  constructor(width: number, height: number) {
    super();

    this.glow = new Graphics();
    // 4 겹 레이어 — 안쪽일수록 진하게, 바깥일수록 옅게 (소프트 글로우)
    for (let i = 4; i >= 1; i--) {
      const ex = i * 5;
      this.glow
        .roundRect(
          -width / 2 - 10 - ex,
          -height / 2 - 10 - ex,
          width + 20 + ex * 2,
          height + 20 + ex * 2,
          12 + ex
        )
        .fill({ color: COLORS.SUNSET_ORANGE, alpha: ACTIVATION.GLOW_INTENSITY * 0.25 });
    }

    this.addChild(this.glow);
    this.visible = false;
  }

  show(): void {
    this.visible = true;
    this.alpha = 1;
  }

  fadeOut(durationMs: number = ACTIVATION.GLOW_DURATION_MS): void {
    const startAlpha = this.alpha;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / durationMs, 1);
      this.alpha = startAlpha * (1 - t);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this.visible = false;
      }
    };
    animate();
  }

  /**
   * 활성화 상태 영구 유지 — 초기 강한 글로우 → 부드러운 잔존 글로우
   */
  fadeToPersistent(targetAlpha: number = 0.35, durationMs: number = 400): void {
    const startAlpha = this.alpha;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / durationMs, 1);
      this.alpha = startAlpha + (targetAlpha - startAlpha) * t;

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }
}
