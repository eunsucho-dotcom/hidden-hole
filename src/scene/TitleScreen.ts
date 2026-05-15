import { Container, Graphics, Text, Sprite, Texture, Assets } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../primitives/constants';

/**
 * 타이틀/스플래시 화면 — 로고 + 로딩바 + 로딩 텍스트
 * 로딩바 채워지면 자동으로 onPlay 호출 (게임 시작)
 */
export class TitleScreen extends Container {
  private onPlayCallback?: () => void;
  private logoSprite?: Sprite;
  private logoFallback?: Text;
  private logoSubFallback?: Text;
  private loadingBarFill?: Graphics;
  // 화면에 표시되는 바 크기
  private barDisplayW = 600;
  private barDisplayH = 60;
  // 노란 fill을 바 외곽선 안쪽에 그리기 위한 inset (좌우 / 상하)
  private fillInsetX = 14;
  private fillInsetY = 10;
  private loadingProgress = 0;
  private loadingDuration = 2400;
  private hasTriggeredPlay = false;

  constructor() {
    super();

    // 배경
    const bg = new Graphics()
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .fill({ color: COLORS.WARM_BEIGE });
    this.addChild(bg);

    // 로고 placeholder (텍스트)
    this.logoFallback = new Text({
      text: 'Hidden Hole',
      style: {
        fontSize: 160,
        fill: COLORS.SUNSET_ORANGE,
        fontWeight: 'bold',
        stroke: { color: COLORS.DARK_CHARCOAL, width: 8 },
      },
    });
    this.logoFallback.anchor.set(0.5);
    this.logoFallback.position.set(GAME_WIDTH / 2, GAME_HEIGHT * 0.32);
    this.addChild(this.logoFallback);

    this.logoSubFallback = new Text({
      text: '히든홀',
      style: {
        fontSize: 56,
        fill: COLORS.DARK_CHARCOAL,
        fontWeight: 'bold',
      },
    });
    this.logoSubFallback.anchor.set(0.5);
    this.logoSubFallback.position.set(GAME_WIDTH / 2, GAME_HEIGHT * 0.42);
    this.addChild(this.logoSubFallback);

    // 로고 PNG 로드 + 로딩바 셋업
    this.loadAssets();
    this.setupLoadingBar();
    this.startLoadingAnimation();
  }

  private async loadAssets(): Promise<void> {
    let logoTex: Texture | undefined;
    try {
      logoTex = await Assets.load('/images/logo_main.png');
    } catch {}
    if (logoTex && this.logoFallback && this.logoSubFallback) {
      this.removeChild(this.logoFallback);
      this.removeChild(this.logoSubFallback);
      this.logoFallback.destroy();
      this.logoSubFallback.destroy();
      this.logoFallback = undefined;
      this.logoSubFallback = undefined;

      // 로고 — 풀스크린이 아니라 상단 중앙에 적당 크기로
      this.logoSprite = new Sprite(logoTex);
      this.logoSprite.anchor.set(0.5);
      // 가로 70% 너비로 fit
      const targetW = GAME_WIDTH * 0.7;
      const scale = targetW / logoTex.width;
      this.logoSprite.width = logoTex.width * scale;
      this.logoSprite.height = logoTex.height * scale;
      this.logoSprite.position.set(GAME_WIDTH / 2, GAME_HEIGHT * 0.38);
      this.addChildAt(this.logoSprite, 1);
    }
  }

  /**
   * 로딩바 PNG (외곽선) + 안쪽 노란 fill + "Loading..." 텍스트 PNG
   */
  private async setupLoadingBar(): Promise<void> {
    const barCenterX = GAME_WIDTH / 2;
    const barCenterY = GAME_HEIGHT * 0.82;

    // "Loading..." 텍스트 PNG
    let txtTex: Texture | undefined;
    try {
      txtTex = await Assets.load('/images/Loading-bar_txt.png');
    } catch {}
    if (txtTex) {
      const txtSprite = new Sprite(txtTex);
      txtSprite.anchor.set(0.5);
      const txtTargetW = 280;
      const txtScale = txtTargetW / txtTex.width;
      txtSprite.width = txtTex.width * txtScale;
      txtSprite.height = txtTex.height * txtScale;
      txtSprite.position.set(barCenterX, barCenterY - 60);
      this.addChild(txtSprite);
    }

    // 로딩바 외곽 PNG (먼저 그리기 — 아래)
    let barTex: Texture | undefined;
    try {
      barTex = await Assets.load('/images/Loading-bar.png');
    } catch {}
    if (barTex) {
      const barSprite = new Sprite(barTex);
      barSprite.anchor.set(0.5);
      const scale = this.barDisplayW / barTex.width;
      barSprite.width = barTex.width * scale;
      barSprite.height = barTex.height * scale;
      barSprite.position.set(barCenterX, barCenterY);
      this.barDisplayH = barTex.height * scale; // 실제 높이로 갱신
      this.addChild(barSprite);
    }

    // 노란 fill — 바 위에 그리되, 외곽선 안쪽에 맞도록 inset 적용
    this.loadingBarFill = new Graphics();
    this.loadingBarFill.position.set(
      barCenterX - this.barDisplayW / 2 + this.fillInsetX,
      barCenterY - this.barDisplayH / 2 + this.fillInsetY
    );
    this.addChild(this.loadingBarFill);
  }

  private startLoadingAnimation(): void {
    const startTime = performance.now();
    const animate = () => {
      const elapsed = performance.now() - startTime;
      this.loadingProgress = Math.min(elapsed / this.loadingDuration, 1);
      this.redrawLoadingFill();
      if (this.loadingProgress < 1) {
        requestAnimationFrame(animate);
      } else if (!this.hasTriggeredPlay) {
        this.hasTriggeredPlay = true;
        setTimeout(() => this.onPlayCallback?.(), 200);
      }
    };
    animate();
  }

  private redrawLoadingFill(): void {
    if (!this.loadingBarFill) return;
    this.loadingBarFill.clear();
    const fillW = (this.barDisplayW - this.fillInsetX * 2) * this.loadingProgress;
    const fillH = this.barDisplayH - this.fillInsetY * 2;
    if (fillW > 0) {
      this.loadingBarFill
        .roundRect(0, 0, fillW, fillH, fillH / 2)
        .fill({ color: 0xefb63a });
    }
  }

  onPlay(callback: () => void): void {
    this.onPlayCallback = callback;
  }
}
