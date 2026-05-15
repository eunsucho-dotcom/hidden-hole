import { Container, Graphics, Sprite, Text, Texture, Assets } from 'pixi.js';
import { ACTIVATION } from '../primitives/constants';

/**
 * 시그니처 캐릭터 — 돼지인형
 * 게임 내내 씬에 앉아있다가 카테고리 흡입 시 입 벌리고 빨아들임
 *
 * 상태:
 *   - closed: 입 닫음 (기본, idle 미세 흔들림)
 *   - open: 입 벌림 (흡입 중)
 */
export class PigCharacter extends Container {
  private closedSprite: Sprite | Graphics;
  private openSprite: Sprite | Graphics;
  private placeholderText?: Text;
  private originalY: number;
  private idleTime = 0;

  constructor(private pigSize: number = 250) {
    super();
    this.originalY = 0;

    // 입 닫은 상태 로드 시도
    this.closedSprite = this.createPlaceholder('🐷', 0xf4a6a6) as any;
    this.openSprite = this.createPlaceholder('😮', 0xf4a6a6) as any;
    this.openSprite.visible = false;

    this.addChild(this.closedSprite as Container);
    this.addChild(this.openSprite as Container);

    this.loadTextures();
  }

  private createPlaceholder(emoji: string, color: number): Container {
    const container = new Container();

    // 둥근 배경 (실제 PNG로 교체될 자리)
    const bg = new Graphics()
      .circle(0, 0, this.pigSize / 2)
      .fill({ color, alpha: 0.3 })
      .stroke({ color: 0xff69b4, width: 4 });
    container.addChild(bg);

    // 이모지 텍스트
    const text = new Text({
      text: emoji,
      style: { fontSize: this.pigSize * 0.6 },
    });
    text.anchor.set(0.5);
    container.addChild(text);

    return container as unknown as Sprite | Graphics & Container;
  }

  private async loadTextures(): Promise<void> {
    let closedTex: Texture | undefined;
    let openTex: Texture | undefined;

    try {
      closedTex = await Assets.load('/images/pig_closed.png');
    } catch {}
    try {
      openTex = await Assets.load('/images/pig_open.png');
    } catch {}

    if (closedTex) {
      // 플레이스홀더 제거, 실제 스프라이트로 교체
      this.removeChild(this.closedSprite as Container);
      const sprite = new Sprite(closedTex);
      sprite.anchor.set(0.5);
      sprite.width = this.pigSize;
      sprite.height = this.pigSize;
      this.closedSprite = sprite;
      this.addChildAt(this.closedSprite as Container, 0);
    }

    if (openTex) {
      this.removeChild(this.openSprite as Container);
      const sprite = new Sprite(openTex);
      sprite.anchor.set(0.5);
      sprite.width = this.pigSize;
      sprite.height = this.pigSize;
      sprite.visible = false;
      this.openSprite = sprite;
      this.addChildAt(this.openSprite as Container, 1);
    }
  }

  /**
   * 입 벌림 (흡입 시작)
   */
  openMouth(): void {
    (this.closedSprite as Container).visible = false;
    (this.openSprite as Container).visible = true;
    // 살짝 확대 (놀라는 느낌)
    this.animateScale(1.1, 200);
  }

  /**
   * 입 닫음 (흡입 끝)
   */
  closeMouth(): void {
    // 꿀꺽 효과 — 살짝 축소 후 원래 크기로
    this.animateScale(0.95, 100, () => {
      (this.openSprite as Container).visible = false;
      (this.closedSprite as Container).visible = true;
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
