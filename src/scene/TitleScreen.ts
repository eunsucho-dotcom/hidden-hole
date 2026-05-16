import { Container, Graphics, Text, Sprite, Texture, Assets, NineSliceSprite } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../primitives/constants';
import { audio } from '../audio/SoundManager';

/**
 * 타이틀/스플래시 화면
 * 흐름:
 *   1) 배경(logo_bg.png) + 로딩바 표시
 *   2) 로딩 완료 → 0.3초 간격으로 staggered pop-in:
 *      타이틀(title.png) → 돼지(logo_character.png) → PLAY 버튼
 *   3) PLAY 클릭 시 게임 시작
 */
export class TitleScreen extends Container {
  private onPlayCallback?: () => void;
  // 배경 (항상 보임)
  private bgSprite?: Sprite;
  // 타이틀 로고 텍스트 (pop-in)
  private titleContainer: Container;
  private titleSprite?: Sprite;
  // 돼지 캐릭터 (pop-in)
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

    // 배경 fallback (이미지 로드 실패 시 단색)
    const bg = new Graphics()
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .fill({ color: COLORS.WARM_BEIGE });
    this.addChild(bg);

    // 타이틀 로고 컨테이너 (상단, 초기엔 숨김)
    this.titleContainer = new Container();
    this.titleContainer.position.set(GAME_WIDTH / 2, 240);
    this.titleContainer.alpha = 0;
    this.titleContainer.scale.set(0);
    this.addChild(this.titleContainer);

    // 돼지 캐릭터 컨테이너 (중앙, 초기엔 숨김)
    this.titlePigContainer = new Container();
    this.titlePigContainer.position.set(GAME_WIDTH / 2, 650);
    this.titlePigContainer.alpha = 0;
    this.titlePigContainer.scale.set(0);
    this.addChild(this.titlePigContainer);

    this.loadAssets();
    this.setupLoadingBar();
    this.startLoadingAnimation();
  }

  private async loadAssets(): Promise<void> {
    // 1. 배경 PNG (logo_bg.png) — 풀스크린 cover, 항상 보임
    let bgTex: Texture | undefined;
    try {
      bgTex = await Assets.load('/images/logo_bg.png');
    } catch {}
    if (bgTex) {
      this.bgSprite = new Sprite(bgTex);
      this.bgSprite.anchor.set(0.5);
      const scaleX = GAME_WIDTH / bgTex.width;
      const scaleY = GAME_HEIGHT / bgTex.height;
      const scale = Math.max(scaleX, scaleY);
      this.bgSprite.width = bgTex.width * scale;
      this.bgSprite.height = bgTex.height * scale;
      this.bgSprite.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2);
      // 단색 fallback bg 위에, 다른 요소들 아래에
      this.addChildAt(this.bgSprite, 1);
    }

    // 2. 타이틀 로고 (title.png) — Hidden Hole 텍스트
    let titleTex: Texture | undefined;
    try {
      titleTex = await Assets.load('/images/title.png');
    } catch {}
    if (titleTex) {
      this.titleSprite = new Sprite(titleTex);
      this.titleSprite.anchor.set(0.5);
      const targetH = 320;
      const aspect = titleTex.width / titleTex.height;
      this.titleSprite.height = targetH;
      this.titleSprite.width = targetH * aspect;
      this.titleSprite.position.set(0, 0);
      this.titleContainer.addChild(this.titleSprite);
    }

    // 3. 돼지 캐릭터 (logo_character.png) — 먼지털이개 들고 있는 돼지
    let pigTex: Texture | undefined;
    try {
      pigTex = await Assets.load('/images/logo_character.png');
    } catch {}
    if (pigTex) {
      this.titlePigSprite = new Sprite(pigTex);
      this.titlePigSprite.anchor.set(0.5);
      const targetH = 480;
      const aspect = pigTex.width / pigTex.height;
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
    // 2. Staggered pop-in (0.3초 간격) — 타이틀 → 돼지 → PLAY 버튼
    setTimeout(() => this.popIn(this.titleContainer), 200);
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
