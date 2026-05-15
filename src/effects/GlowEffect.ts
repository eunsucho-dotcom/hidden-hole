import { Container, Graphics, BlurFilter } from 'pixi.js';
import { ACTIVATION, COLORS } from '../primitives/constants';

/**
 * 활성화 글로우 효과 — 클릭 시 점프 + 노란 빛 테두리
 */
export class GlowEffect extends Container {
  private glow: Graphics;
  private blurFilter: BlurFilter;

  constructor(width: number, height: number) {
    super();

    this.glow = new Graphics()
      .roundRect(-width / 2 - 10, -height / 2 - 10, width + 20, height + 20, 12)
      .fill({ color: COLORS.SUNSET_ORANGE, alpha: ACTIVATION.GLOW_INTENSITY });

    this.blurFilter = new BlurFilter({ strength: 8 });
    this.glow.filters = [this.blurFilter];

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
