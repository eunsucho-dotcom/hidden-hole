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

    // 26 프레임 추출
    const FRAME_W = 400;
    const FRAME_H = 482;
    const frames: Texture[] = [];
    for (let row = 0; row < 6; row++) {
      const colsThisRow = row === 5 ? 1 : 5;
      for (let col = 0; col < colsThisRow; col++) {
        frames.push(new Texture({
          source: sheet.source,
          frame: new Rectangle(col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H),
        }));
      }
    }

    this.animSprite = new AnimatedSprite(frames);
    this.animSprite.anchor.set(0.5);
    // 비율 유지 — pigSize를 짧은 변 기준
    const scale = this.pigSize / Math.max(FRAME_W, FRAME_H);
    this.animSprite.width = FRAME_W * scale;
    this.animSprite.height = FRAME_H * scale;
    this.animSprite.animationSpeed = 0.12; // ~7fps at 60fps render
    this.animSprite.loop = true;
    this.animSprite.play();

    // 플레이스홀더 제거하고 애니메이션 스프라이트로 교체
    this.removeChild(this.placeholder);
    this.placeholder.destroy({ children: true });
    this.addChild(this.animSprite);
  }

  /**
   * 입 벌림 (흡입 시작) — 살짝 확대 (애니메이션은 계속 루프)
   */
  openMouth(): void {
    if (this.animSprite) {
      // 애니메이션 속도 빨라짐 (먹는 느낌)
      this.animSprite.animationSpeed = 0.25;
    }
    this.animateScale(1.1, 200);
  }

  /**
   * 입 닫음 (흡입 끝) — 꿀꺽 효과 + 평상 속도 복귀
   */
  closeMouth(): void {
    this.animateScale(0.95, 100, () => {
      if (this.animSprite) {
        this.animSprite.animationSpeed = 0.12;
      }
      this.animateScale(1.0, 200);
    });
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
