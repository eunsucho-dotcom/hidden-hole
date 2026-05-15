import { Container, Graphics, AnimatedSprite, Text, Texture, Rectangle, Assets } from 'pixi.js';

/**
 * 시그니처 캐릭터 — 돼지인형 (스프라이트시트 애니메이션)
 *
 * 스프라이트시트 구조 (`/images/pig.png` 2000×2892):
 *   - 프레임 사이즈: 400 × 482
 *   - 5 cols × 5 rows = 25 + 마지막 row 1 = 총 26 프레임
 *   - 프레임 0~25 순환 (입 닫힘 → 벌림 → 닫힘 loop)
 *
 * 동작:
 *   - 평소: 천천히 26 프레임 루프 (살아있는 듯한 모션)
 *   - openMouth: 살짝 확대 (놀라는 느낌, 애니메이션은 계속 루프)
 *   - closeMouth: 꿀꺽 효과 (축소 → 원래 크기)
 */
export class PigCharacter extends Container {
  private animSprite?: AnimatedSprite;
  private placeholder: Container;
  private originalY: number;
  private idleTime = 0;

  constructor(private pigSize: number = 250) {
    super();
    this.originalY = 0;

    // 플레이스홀더 (스프라이트시트 로드 전)
    this.placeholder = this.createPlaceholder('🐷', 0xf4a6a6);
    this.addChild(this.placeholder);

    this.loadAnimation();
  }

  private createPlaceholder(emoji: string, color: number): Container {
    const container = new Container();
    const bg = new Graphics()
      .circle(0, 0, this.pigSize / 2)
      .fill({ color, alpha: 0.3 })
      .stroke({ color: 0xff69b4, width: 4 });
    container.addChild(bg);
    const text = new Text({
      text: emoji,
      style: { fontSize: this.pigSize * 0.6 },
    });
    text.anchor.set(0.5);
    container.addChild(text);
    return container;
  }

  private async loadAnimation(): Promise<void> {
    let sheet: Texture | undefined;
    try {
      sheet = await Assets.load('/images/pig.png');
    } catch {}
    if (!sheet) return;

    // 26 프레임 추출 — 각 (row, col) 정확한 bbox 측정값 사용
    // (스프라이트시트가 균일 그리드가 아니라 행/열마다 픽셀 위치 다름)
    const ROW_STARTS = [44, 541, 1032, 1532, 2026, 2474];
    const FRAME_H = 430;
    // [row][col] = { x, w } : 각 프레임의 좌상단 x + 폭
    const FRAMES_DATA: Array<Array<{ x: number; w: number }>> = [
      // Row 0
      [{ x: 22, w: 364 }, { x: 422, w: 368 }, { x: 834, w: 371 }, { x: 1223, w: 375 }, { x: 1604, w: 382 }],
      // Row 1
      [{ x: 25, w: 381 }, { x: 414, w: 372 }, { x: 838, w: 356 }, { x: 1240, w: 350 }, { x: 1604, w: 354 }],
      // Row 2
      [{ x: 38, w: 360 }, { x: 412, w: 376 }, { x: 810, w: 381 }, { x: 1199, w: 382 }, { x: 1605, w: 383 }],
      // Row 3
      [{ x: 61, w: 382 }, { x: 449, w: 381 }, { x: 843, w: 373 }, { x: 1231, w: 369 }, { x: 1621, w: 366 }],
      // Row 4
      [{ x: 50, w: 367 }, { x: 442, w: 367 }, { x: 817, w: 367 }, { x: 1208, w: 369 }, { x: 1597, w: 370 }],
      // Row 5 (1 프레임)
      [{ x: 26, w: 364 }],
    ];
    const sheetH = sheet.height;
    const frames: Texture[] = [];
    for (let row = 0; row < FRAMES_DATA.length; row++) {
      const rowY = ROW_STARTS[row];
      const h = Math.min(FRAME_H, sheetH - rowY);
      for (const cell of FRAMES_DATA[row]) {
        frames.push(new Texture({
          source: sheet.source,
          frame: new Rectangle(cell.x, rowY, cell.w, h),
        }));
      }
    }

    this.animSprite = new AnimatedSprite(frames);
    this.animSprite.anchor.set(0.5);
    // 모든 프레임이 동일한 표시 크기로 — pigSize 정사각형
    this.animSprite.width = this.pigSize;
    this.animSprite.height = this.pigSize;
    this.animSprite.animationSpeed = 0.15; // 평상시 느린 루프 (살랑살랑)
    this.animSprite.loop = true;
    this.animSprite.play();

    // 플레이스홀더 제거하고 애니메이션 스프라이트로 교체
    this.removeChild(this.placeholder);
    this.placeholder.destroy({ children: true });
    this.addChild(this.animSprite);
  }

  /**
   * 입 벌림 (흡입 시작) — 프레임 0→12(가장 크게 벌림)로 천천히 이동 후 정지
   * 흡입되는 사물들이 입에 들어가는 동안 입은 활짝 벌린 상태 유지
   */
  openMouth(): void {
    if (!this.animSprite) return;
    this.animSprite.stop();
    this.animSprite.loop = false;
    this.animateScale(1.1, 200);
    // 600ms에 걸쳐 입 벌리는 모션 → 프레임 12에서 정지
    this.playToFrame(12, 600);
  }

  /**
   * 입 닫음 (흡입 끝) — 현재 프레임 → 25(닫힘)로 빠르게 + 꿀꺽 효과
   */
  closeMouth(): void {
    if (!this.animSprite) return;
    this.animateScale(0.95, 100, () => {
      this.animateScale(1.0, 200);
    });
    // 입 닫는 모션 (꿀꺽) 350ms 후 idle 루프 재개
    this.playToFrame(25, 350, () => {
      if (this.animSprite) {
        this.animSprite.loop = true;
        this.animSprite.animationSpeed = 0.15;
        this.animSprite.gotoAndPlay(0);
      }
    });
  }

  /** 프레임을 from→target까지 duration ms에 걸쳐 보간하며 재생 후 stop */
  private frameAnimRaf?: number;
  private playToFrame(target: number, duration: number, onComplete?: () => void): void {
    if (this.frameAnimRaf !== undefined) cancelAnimationFrame(this.frameAnimRaf);
    if (!this.animSprite) return;
    const start = this.animSprite.currentFrame;
    const startTime = performance.now();
    const step = () => {
      if (!this.animSprite) return;
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      // easeInOutQuad — 시작·끝 부드럽게
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const frame = Math.round(start + (target - start) * eased);
      this.animSprite.gotoAndStop(frame);
      if (t < 1) {
        this.frameAnimRaf = requestAnimationFrame(step);
      } else {
        this.frameAnimRaf = undefined;
        if (onComplete) onComplete();
      }
    };
    this.frameAnimRaf = requestAnimationFrame(step);
  }

  /**
   * 입을 향한 사물 흡입 — 외부에서 사용할 좌표
   */
  getMouthPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y - this.pigSize * 0.1 };
  }

  /**
   * idle 미세 흔들림 (살아있는 느낌)
   */
  updateIdle(deltaMs: number): void {
    this.idleTime += deltaMs;
    const phase = (this.idleTime / 2000) * Math.PI * 2;
    this.y = this.originalY + Math.sin(phase) * 2;
  }

  setOriginalPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.originalY = y;
  }

  private animateScale(targetScale: number, duration: number, onComplete?: () => void): void {
    const startScale = this.scale.x;
    const startTime = performance.now();
    const animate = () => {
      const t = Math.min((performance.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const newScale = startScale + (targetScale - startScale) * eased;
      this.scale.set(newScale);
      if (t < 1) requestAnimationFrame(animate);
      else if (onComplete) onComplete();
    };
    animate();
  }
}
