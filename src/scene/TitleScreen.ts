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
  private loadingBarWidth = 600;
  private loadingBarHeight = 50;
  private loadingProgress = 0;
  private loadingDuration = 2200; // 2.2초간 로딩 채워짐
  private hasTriggeredPlay = false;

  constructor() {
    super();

    // 배경
    const bg = new Graphics()
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .fill({ color: COLORS.WARM_BEIGE });
    this.addChild(bg);

    // 로고 placeholder
    this.logoFallback = new Text({
      text: 'Hidden Hole',
      style: {
        fontSize: 180,
        fill: COLORS.SUNSET_ORANGE,
        fontWeight: 'bold',
        stroke: { color: COLORS.DARK_CHARCOAL, width: 8 },
      },
    });
    this.logoFallback.anchor.set(0.5);
    this.logoFallback.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 180);
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
    this.logoSubFallback.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
    this.addChild(this.logoSubFallback);

    // 하단 안내
    const hint = new Text({
      text: 'Lv1: The Breakup Night',
      style: {
        fontSize: 26,
        fill: 0xffffff,
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 2 },
      },
    });
    hint.anchor.set(0.5);
    hint.position.set(GAME_WIDTH / 2, GAME_HEIGHT - 80);
    this.addChild(hint);

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

      // 로고 풀스크린 cover
      this.logoSprite = new Sprite(logoTex);
      this.logoSprite.anchor.set(0.5);
      const scaleX = GAME_WIDTH / logoTex.width;
      const scaleY = GAME_HEIGHT / logoTex.height;
      const scale = Math.max(scaleX, scaleY);
      this.logoSprite.width = logoTex.width * scale;
      this.logoSprite.height = logoTex.height * scale;
      this.logoSprite.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2);
      this.addChildAt(this.logoSprite, 1);
    }
  }

  /**
   * 로딩바 (외곽 PNG) + 로딩 텍스트 PNG + 노란 fill
   */
  private async setupLoadingBar(): Promise<void> {
    const barCenterX = GAME_WIDTH / 2;
    const barCenterY = GAME_HEIGHT - 200;

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
      txtSprite.position.set(barCenterX, barCenterY - 70);
      this.addChild(txtSprite);
    }

    // 노란 fill (바 외곽 안쪽). 외곽 PNG보다 안쪽에 그려져야 함
    this.loadingBarFill = new Graphics();
    this.loadingBarFill.position.set(
      barCenterX - this.loadingBarWidth / 2,
      barCenterY - this.loadingBarHeight / 2
    );
    this.addChild(this.loadingBarFill);

    // 로딩바 외곽 PNG
    let barTex: Texture | undefined;
    try {
      barTex = await Assets.load('/images/Loading-bar.png');
    } catch {}
    if (barTex) {
      const barSprite = new Sprite(barTex);
      barSprite.anchor.set(0.5);
      // 외곽 PNG 비율 유지하면서 너비 매칭
      const targetW = this.loadingBarWidth + 20; // fill 보다 약간 더 큰 외곽
      const scale = targetW / barTex.width;
      barSprite.width = barTex.width * scale;
      barSprite.height = barTex.height * scale;
      barSprite.position.set(barCenterX, barCenterY);
      this.addChild(barSprite);
    }
  }

  /**
   * 로딩바 채워지는 애니메이션 — 진행 100% 시 자동 onPlay
   */
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
        // 100% 도달 시 짧은 딜레이 후 자동 시작
        setTimeout(() => this.onPlayCallback?.(), 200);
      }
    };
    animate();
  }

  private redrawLoadingFill(): void {
    if (!this.loadingBarFill) return;
    this.loadingBarFill.clear();
    const filledW = this.loadingBarWidth * this.loadingProgress;
    if (filledW > 0) {
      this.loadingBarFill
        .roundRect(0, 0, filledW, this.loadingBarHeight, 18)
        .fill({ color: 0xefb63a }); // 노란색
    }
  }

  onPlay(callback: () => void): void {
    this.onPlayCallback = callback;
  }
}
