import { Container, Graphics, Text, Sprite, Texture, Rectangle, Assets, NineSliceSprite } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../primitives/constants';
import { audio } from '../audio/SoundManager';

/**
 * 타이틀/스플래시 화면
 * 흐름: 로고 + 로딩바 채워짐 → PLAY 버튼 노출 → 클릭 시 게임 시작
 */
export class TitleScreen extends Container {
  private onPlayCallback?: () => void;
  // 로고 — Container로 감싸서 staggered pop-in 적용
  private logoContainer: Container;
  private logoSprite?: Sprite;
  private logoFallback?: Text;
  private logoSubFallback?: Text;
  // 타이틀 돼지 캐릭터
  private titlePigContainer: Container;
  private titlePigSprite?: Sprite;
  // 로딩
  private loadingBarFillSprite?: NineSliceSprite;
  private loadingBarFillMask?: Graphics;
  private loadingBarSprite?: Sprite;
  private loadingTxtSprite?: Sprite;
  private barDisplayW = 600;
  private barDisplayH = 60;
  private fillInsetX = 18;
  private fillInsetY = 15;
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

    // 로고 컨테이너 (게임 중심에 위치, 초기엔 숨김 — 로딩 완료 후 pop-in)
    this.logoContainer = new Container();
    this.logoContainer.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.logoContainer.alpha = 0;
    this.logoContainer.scale.set(0);
    this.addChild(this.logoContainer);

    // 로고 placeholder (logoContainer 내부에 (0,0) 기준)
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
    this.logoFallback.position.set(0, -100);
    this.logoContainer.addChild(this.logoFallback);

    this.logoSubFallback = new Text({
      text: '히든홀',
      style: {
        fontSize: 56,
        fill: COLORS.DARK_CHARCOAL,
        fontWeight: 'bold',
      },
    });
    this.logoSubFallback.anchor.set(0.5);
    this.logoSubFallback.position.set(0, 30);
    this.logoContainer.addChild(this.logoSubFallback);

    // 타이틀 돼지 컨테이너 (PLAY 버튼 위쪽, 초기엔 숨김)
    this.titlePigContainer = new Container();
    this.titlePigContainer.position.set(GAME_WIDTH / 2, GAME_HEIGHT - 430);
    this.titlePigContainer.alpha = 0;
    this.titlePigContainer.scale.set(0);
    this.addChild(this.titlePigContainer);

    this.loadAssets();
    this.setupLoadingBar();
    this.startLoadingAnimation();
  }

  private async loadAssets(): Promise<void> {
    // 로고 PNG 로드
    let logoTex: Texture | undefined;
    try {
      logoTex = await Assets.load('/images/logo_main.png');
    } catch {}
    if (logoTex && this.logoFallback && this.logoSubFallback) {
      this.logoContainer.removeChild(this.logoFallback);
      this.logoContainer.removeChild(this.logoSubFallback);
      this.logoFallback.destroy();
      this.logoSubFallback.destroy();
      this.logoFallback = undefined;
      this.logoSubFallback = undefined;

      // 로고 — 풀스크린 cover (logoContainer는 GAME 중심에 있으므로 (0,0) 기준)
      this.logoSprite = new Sprite(logoTex);
      this.logoSprite.anchor.set(0.5);
      const scaleX = GAME_WIDTH / logoTex.width;
      const scaleY = GAME_HEIGHT / logoTex.height;
      const scale = Math.max(scaleX, scaleY);
      this.logoSprite.width = logoTex.width * scale;
      this.logoSprite.height = logoTex.height * scale;
      this.logoSprite.position.set(0, 0);
      this.logoContainer.addChild(this.logoSprite);
    }

    // 타이틀 돼지 (pig.png 스프라이트시트 frame 0 — 닫힘)
    let pigTex: Texture | undefined;
    try {
      pigTex = await Assets.load('/images/pig.png');
    } catch {}
    if (pigTex) {
      const frame0 = new Texture({
        source: pigTex.source,
        frame: new Rectangle(143, 113, 364, 418),
      });
      this.titlePigSprite = new Sprite(frame0);
      this.titlePigSprite.anchor.set(0.5);
      const targetH = 280;
      const aspect = 364 / 418;
      this.titlePigSprite.height = targetH;
      this.titlePigSprite.width = targetH * aspect;
      this.titlePigSprite.position.set(0, 0);
      this.titlePigContainer.addChild(this.titlePigSprite);
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
      // NineSliceSprite — 좌우 30px(둥근 끝) 고정, 가운데만 가로 stretch
      this.loadingBarFillSprite = new NineSliceSprite({
        texture: fillTex,
        leftWidth: 50,
        topHeight: 0,
        rightWidth: 50,
        bottomHeight: 0,
      });
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
    this.btnContainer.scale.set(0);
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
    // 1. 로딩바·텍스트 fade out
    this.fadeOutLoadingBar();
    // 2. Staggered pop-in (0.3초 간격) — 로고 → 돼지 → PLAY 버튼
    setTimeout(() => this.popIn(this.logoContainer), 200);
    setTimeout(() => this.popIn(this.titlePigContainer), 500);
    setTimeout(() => {
      if (this.btnContainer) {
        this.btnContainer.visible = true;
        this.popIn(this.btnContainer);
      }
    }, 800);
  }

  private fadeOutLoadingBar(): void {
    const startTime = performance.now();
    const fadeMs = 350;
    const animate = () => {
      const t = Math.min((performance.now() - startTime) / fadeMs, 1);
      if (this.loadingBarSprite) this.loadingBarSprite.alpha = 1 - t;
      if (this.loadingBarFillSprite) this.loadingBarFillSprite.alpha = 1 - t;
      if (this.loadingTxtSprite) this.loadingTxtSprite.alpha = 1 - t;
      if (t < 1) requestAnimationFrame(animate);
      else {
        if (this.loadingBarSprite) this.loadingBarSprite.visible = false;
        if (this.loadingBarFillSprite) this.loadingBarFillSprite.visible = false;
        if (this.loadingTxtSprite) this.loadingTxtSprite.visible = false;
      }
    };
    animate();
  }

  /** pop-in 애니메이션 — scale 0→1.0 (살짝 오버슛) + alpha 0→1 */
  private popIn(target: Container, durationMs: number = 360): void {
    target.visible = true;
    const startTime = performance.now();
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const animate = () => {
      const t = Math.min((performance.now() - startTime) / durationMs, 1);
      // easeOutBack — 1.0 살짝 넘었다가 안착
      const eased = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      target.alpha = Math.min(1, t * 1.8);
      target.scale.set(eased);
      if (t < 1) requestAnimationFrame(animate);
      else {
        target.alpha = 1;
        target.scale.set(1);
      }
    };
    animate();
  }

  onPlay(callback: () => void): void {
    this.onPlayCallback = callback;
  }
}
