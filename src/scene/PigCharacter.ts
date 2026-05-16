import { Container, Graphics, AnimatedSprite, Text, Texture, Rectangle, Assets } from 'pixi.js';
import { audio } from '../audio/SoundManager';
import { MouthPoofEffect } from './MouthPoofEffect';

/**
 * 시그니처 캐릭터 — 돼지인형 (스프라이트시트 애니메이션)
 *
 * 스프라이트시트 구조 (`./images/pig.png` 2000×2892):
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
      sheet = await Assets.load('./images/pig.png');
    } catch {}
    if (!sheet) return;

    // 7 프레임 가로 1행 스프라이트시트
    // frame 0: 닫힘, frame 4: 가장 크게 벌림 (peak), frame 6: 닫힘
    const ROW_Y = 113;
    const ROW_H = 418;
    const FRAMES_DATA: Array<{ x: number; w: number }> = [
      { x: 143,  w: 364 }, // 0
      { x: 642,  w: 368 }, // 1
      { x: 1162, w: 371 }, // 2
      { x: 1661, w: 375 }, // 3
      { x: 2161, w: 382 }, // 4 (peak open)
      { x: 2660, w: 381 }, // 5
      { x: 3164, w: 364 }, // 6 (close)
    ];
    const frames: Texture[] = [];
    for (const cell of FRAMES_DATA) {
      frames.push(new Texture({
        source: sheet.source,
        frame: new Rectangle(cell.x, ROW_Y, cell.w, ROW_H),
      }));
    }

    this.animSprite = new AnimatedSprite(frames);
    this.animSprite.anchor.set(0.5);
    this.animSprite.width = this.pigSize;
    this.animSprite.height = this.pigSize;
    // 평상시 frame 0 (닫힘)에서 정지. 흡입 시에만 애니메이션
    this.animSprite.gotoAndStop(0);

    // 플레이스홀더 제거하고 애니메이션 스프라이트로 교체
    this.removeChild(this.placeholder);
    this.placeholder.destroy({ children: true });
    this.addChild(this.animSprite);
  }

  /**
   * 입 벌림 (흡입 시작) — 프레임 0→4(peak open)로 빠르게 이동 후 정지
   * 흡입 사물 들어가는 동안 입 활짝 벌린 상태 유지 (frame 4)
   */
  openMouth(): void {
    if (!this.animSprite) return;
    this.animSprite.stop();
    this.animateScale(1.1, 200);
    audio.play('pig_open');
    // 입 주변에 팡! 흰 구름 파티클 효과
    if (this.parent) {
      const poof = new MouthPoofEffect(this.pigSize / 250);
      const mouth = this.getMouthPosition();
      poof.position.set(mouth.x, mouth.y);
      this.parent.addChild(poof);
    }
    // 빠른 입 벌리기: 250ms (frame 0 → 4)
    this.playToFrame(4, 250);
  }

  /**
   * 입 닫음 (흡입 끝) — 한번에 확 닫음 (snap)
   */
  closeMouth(): void {
    if (!this.animSprite) return;
    // 꿀꺽 효과 + 즉시 닫힘 프레임으로 스냅
    this.animateScale(0.92, 80, () => this.animateScale(1.0, 150));
    if (this.frameAnimRaf !== undefined) cancelAnimationFrame(this.frameAnimRaf);
    // 한번에 확 — 80ms에 4→6 (마지막 닫힘 프레임)
    this.playToFrame(6, 80, () => {
      // 80ms 뒤 frame 0으로 복귀 (idle 정지 상태)
      setTimeout(() => {
        if (this.animSprite) this.animSprite.gotoAndStop(0);
      }, 80);
    });
  }

  /** 프레임 from→target까지 duration ms에 걸쳐 보간 재생 후 stop */
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
      // easeOutQuad — 시작 빠르고 끝에서 부드럽게 정지
      const eased = 1 - (1 - t) * (1 - t);
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
   * 새 sprite sheet의 돼지는 정면 향함 → 입은 중심 살짝 위
   */
  getMouthPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y - this.pigSize * 0.02 };
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
