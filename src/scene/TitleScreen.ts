import { Container, Graphics, Text, Sprite, Texture, Assets, FillGradient } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../primitives/constants';
import { audio } from '../audio/SoundManager';

/**
 * 타이틀/스플래시 화면
 * 흐름: 로고 + 로딩바 채워짐 → PLAY 버튼 노출 → 클릭 시 게임 시작
 */
export class TitleScreen extends Container {
  private onPlayCallback?: () => void;
  private logoSprite?: Sprite;
  private logoFallback?: Text;
  private logoSubFallback?: Text;
  // 로딩
  private loadingBarFillSprite?: Sprite;
  private loadingBarFillMask?: Graphics;
  private loadingBarSprite?: Sprite;
  private loadingTxtSprite?: Sprite;
  private barDisplayW = 600;
  private barDisplayH = 60;
  private fillInsetX = 14;
  private fillInsetY = 5;
  private loadingProgress = 0;
  private loadingDuration = 2400;
  // Play 버튼
  private btnContainer?: Container;
  private btnSprite?: Sprite;
  private playClicked = false;

  constructor() {
    super();

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
    this.logoFallback.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100);
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
    this.logoSubFallback.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
    this.addChild(this.logoSubFallback);

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

      // 로고 — 풀스크린 cover (크게)
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

  private async setupLoadingBar(): Promise<void> {
    const barCenterX = GAME_WIDTH / 2;
    const barCenterY = GAME_HEIGHT - 170;

    let txtTex: Texture | undefined;
    try {
      txtTex = await Assets.load('/images/Loading-bar_txt.png');
    } catch {}
    if (txtTex) {
      this.loadingTxtSprite = new Sprite(txtTex);
      this.loadingTxtSprite.anchor.set(0.5);
      const txtTargetW = 280;
      const txtScale = txtTargetW / txtTex.width;
      this.loadingTxtSprite.width = txtTex.width * txtScale;
      this.loadingTxtSprite.height = txtTex.height * txtScale;
      this.loadingTxtSprite.position.set(barCenterX, barCenterY - 65);
      this.addChild(this.loadingTxtSprite);
    }

    let barTex: Texture | undefined;
    try {
      barTex = await Assets.load('/images/Loading-bar.png');
    } catch {}
    if (barTex) {
      this.loadingBarSprite = new Sprite(barTex);
      this.loadingBarSprite.anchor.set(0.5);
      const scale = this.barDisplayW / barTex.width;
      this.loadingBarSprite.width = barTex.width * scale;
      this.loadingBarSprite.height = barTex.height * scale;
      this.loadingBarSprite.position.set(barCenterX, barCenterY);
      this.barDisplayH = barTex.height * scale;
      this.addChild(this.loadingBarSprite);
    }

    // 노란 fill PNG (입체감 있는 캡슐) — 마스크로 채워지는 영역 제어
    let fillTex: Texture | undefined;
    try {
      fillTex = await Assets.load('/images/Loading-bar1.png');
    } catch {}
    if (fillTex) {
      const fillFullW = this.barDisplayW - this.fillInsetX * 2;
      const fillFullH = this.barDisplayH - this.fillInsetY * 2;
      this.loadingBarFillSprite = new Sprite(fillTex);
      this.loadingBarFillSprite.width = fillFullW;
      this.loadingBarFillSprite.height = fillFullH;
      this.loadingBarFillSprite.position.set(
        barCenterX - this.barDisplayW / 2 + this.fillInsetX,
        barCenterY - this.barDisplayH / 2 + this.fillInsetY
      );
      this.addChild(this.loadingBarFillSprite);

      // 마스크 — progress에 따라 너비 늘어남
      this.loadingBarFillMask = new Graphics();
      this.loadingBarFillMask.position.set(
        barCenterX - this.barDisplayW / 2 + this.fillInsetX,
        barCenterY - this.barDisplayH / 2 + this.fillInsetY
      );
      this.addChild(this.loadingBarFillMask);
      this.loadingBarFillSprite.mask = this.loadingBarFillMask;
    }

    // PLAY 버튼 (처음엔 hidden — 로딩 완료 후 등장)
    await this.setupPlayButton(barCenterX, barCenterY);
  }

  private async setupPlayButton(cx: number, cy: number): Promise<void> {
    this.btnContainer = new Container();
    this.btnContainer.position.set(cx, cy);
    this.btnContainer.alpha = 0;
    this.btnContainer.visible = false;

    // fallback graphics
    const bgFallback = new Graphics()
      .roundRect(-180, -55, 360, 110, 24)
      .fill({ color: COLORS.SUNSET_ORANGE })
      .stroke({ color: COLORS.DARK_CHARCOAL, width: 4 });
    this.btnContainer.addChild(bgFallback);
    const labelFallback = new Text({
      text: '▶  PLAY',
      style: { fontSize: 56, fill: 0xffffff, fontWeight: 'bold' },
    });
    labelFallback.anchor.set(0.5);
    this.btnContainer.addChild(labelFallback);

    this.btnContainer.eventMode = 'static';
    this.btnContainer.cursor = 'pointer';
    this.btnContainer.on('pointerover', () => this.btnContainer && this.btnContainer.scale.set(1.05));
    this.btnContainer.on('pointerout', () => this.btnContainer && this.btnContainer.scale.set(1));
    this.btnContainer.on('pointertap', () => {
      if (this.playClicked) return;
      this.playClicked = true;
      audio.play('button');
      this.onPlayCallback?.();
    });
    this.addChild(this.btnContainer);

    // PNG로 교체
    try {
      const btnTex = await Assets.load('/images/btn_play.png');
      if (btnTex && this.btnContainer) {
        this.btnContainer.removeChild(bgFallback);
        this.btnContainer.removeChild(labelFallback);
        bgFallback.destroy();
        labelFallback.destroy();
        this.btnSprite = new Sprite(btnTex);
        this.btnSprite.anchor.set(0.5);
        const targetW = 360;
        const scale = targetW / btnTex.width;
        this.btnSprite.width = btnTex.width * scale;
        this.btnSprite.height = btnTex.height * scale;
        this.btnContainer.addChildAt(this.btnSprite, 0);
      }
    } catch {}
  }

  private startLoadingAnimation(): void {
    const startTime = performance.now();
    const animate = () => {
      const elapsed = performance.now() - startTime;
      this.loadingProgress = Math.min(elapsed / this.loadingDuration, 1);
      this.redrawLoadingFill();
      if (this.loadingProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        // 로딩 완료 → 로딩바 fade out + PLAY 버튼 fade in
        this.showPlayButton();
      }
    };
    animate();
  }

  private redrawLoadingFill(): void {
    if (!this.loadingBarFillMask) return;
    const fillFullW = this.barDisplayW - this.fillInsetX * 2;
    const fillFullH = this.barDisplayH - this.fillInsetY * 2;
    const visibleW = fillFullW * this.loadingProgress;
    this.loadingBarFillMask.clear();
    if (visibleW > 0) {
      this.loadingBarFillMask
        .rect(0, 0, visibleW, fillFullH)
        .fill({ color: 0xffffff });
    }
  }

  private showPlayButton(): void {
    if (!this.btnContainer) return;
    this.btnContainer.visible = true;
    const startTime = performance.now();
    const fadeMs = 400;
    const animate = () => {
      const t = Math.min((performance.now() - startTime) / fadeMs, 1);
      // 로딩바·텍스트 fade out
      if (this.loadingBarSprite) this.loadingBarSprite.alpha = 1 - t;
      if (this.loadingBarFillSprite) this.loadingBarFillSprite.alpha = 1 - t;
      if (this.loadingTxtSprite) this.loadingTxtSprite.alpha = 1 - t;
      // PLAY 버튼 fade in
      if (this.btnContainer) this.btnContainer.alpha = t;
      if (t < 1) requestAnimationFrame(animate);
      else {
        // 로딩바 요소 완전 제거
        if (this.loadingBarSprite) this.loadingBarSprite.visible = false;
        if (this.loadingBarFillSprite) this.loadingBarFillSprite.visible = false;
        if (this.loadingTxtSprite) this.loadingTxtSprite.visible = false;
      }
    };
    animate();
  }

  onPlay(callback: () => void): void {
    this.onPlayCallback = callback;
  }
}
