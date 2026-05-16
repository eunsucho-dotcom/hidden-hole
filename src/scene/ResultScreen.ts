import { Container, Graphics, Text, Sprite, Texture, Assets } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../primitives/constants';
import { audio } from '../audio/SoundManager';
import { t } from '../primitives/i18n';
import type { ResultData } from '../primitives/result-types';

/**
 * 결과 화면 — 점수 + 별점 + Retry/Home 버튼
 */
export class ResultScreen extends Container {
  private onRetryCallback?: () => void;
  private onHomeCallback?: () => void;

  constructor(result: ResultData) {
    super();

    // 반투명 다크 오버레이
    const overlay = new Graphics()
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .fill({ color: 0x000000, alpha: 0.7 });
    this.addChild(overlay);

    // 결과 패널 PNG (popup_bg.png — 나무 카드 + 별 자리)
    // 표시 900×879, 중앙 (960, 460) — 화면 중앙보다 80px 위
    const PANEL_CY = 460;
    const panelFallback = new Graphics()
      .roundRect(GAME_WIDTH / 2 - 450, PANEL_CY - 440, 900, 879, 30)
      .fill({ color: COLORS.CREAM_WHITE })
      .stroke({ color: COLORS.SUNSET_ORANGE, width: 6 });
    this.addChild(panelFallback);
    Assets.load('./images/popup_bg.png').then((tex: Texture) => {
      this.removeChild(panelFallback);
      panelFallback.destroy();
      const panel = new Sprite(tex);
      panel.anchor.set(0.5);
      const DISPLAY_W = 900;
      const scale = DISPLAY_W / tex.width;
      panel.width = tex.width * scale;
      panel.height = tex.height * scale;
      panel.position.set(GAME_WIDTH / 2, PANEL_CY);
      this.addChildAt(panel, 1); // overlay 위, 컨텐츠 아래
    }).catch(() => {});

    // 씬 이름 — 사용자 요청으로 제거됨
    // 별점 — popup_bg 의 별 자리에 오버레이로 실제 점수 표현
    this.renderStars(result.stars);

    // 점수 상세
    this.renderScoreBreakdown(result);

    // 총점 라벨
    const totalLabel = new Text({
      text: t('result.total_score'),
      style: { fontSize: 26, fill: 0x8a6a4a, fontWeight: 'bold' },
    });
    totalLabel.anchor.set(0.5);
    totalLabel.position.set(GAME_WIDTH / 2, 595);
    this.addChild(totalLabel);

    const totalScore = new Text({
      text: `${result.totalScore}`,
      style: {
        fontSize: 72,
        fill: COLORS.SUNSET_ORANGE,
        fontWeight: 'bold',
        stroke: { color: 0x6b4a2b, width: 3 },
      },
    });
    totalScore.anchor.set(0.5);
    totalScore.position.set(GAME_WIDTH / 2, 665);
    this.addChild(totalScore);

    // 버튼 2개 — 패널 안쪽 (총점 아래)
    this.renderButton('🔄', './images/btn_retry.png', GAME_WIDTH / 2 - 130, 790, () => {
      audio.play('button');
      this.onRetryCallback?.();
    });
    this.renderButton('🏠', './images/btn_home.png', GAME_WIDTH / 2 + 130, 790, () => {
      audio.play('button');
      this.onHomeCallback?.();
    });

    // X 닫기 버튼 (popup_x.png) — 패널 우상단 모서리
    this.renderCloseButton();

    // 등장 애니메이션
    this.alpha = 0;
    const startTime = performance.now();
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / 400, 1);
      this.alpha = t;
      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }

  private async renderStars(stars: number): Promise<void> {
    // 가운데 별 — 양쪽보다 약간 위 + 사이즈 2x (1500)
    const SIDE_Y = 350;
    const SIDE_SIZE = 420;
    const CENTER_Y = 280;     // 좌우보다 70px 위
    const CENTER_SIZE = 1500; // 좌우 대비 ~3.5x, 직전 750 의 2x
    const starConfigs = [
      { x: 510 + 189 * 1.42, y: SIDE_Y,   size: SIDE_SIZE },
      { x: GAME_WIDTH / 2,    y: CENTER_Y, size: CENTER_SIZE },
      { x: 510 + 435 * 1.42, y: SIDE_Y,   size: SIDE_SIZE },
    ];

    // PNG 자산 로드 (실패 시 이모지 fallback)
    let filledTex: Texture | undefined;
    let emptyTex: Texture | undefined;
    let bigFilledTex: Texture | undefined; // 가운데 별 전용 (크게)
    try {
      filledTex = await Assets.load('./images/star_filled.png');
    } catch {}
    try {
      emptyTex = await Assets.load('./images/star_empty.png');
    } catch {}
    try {
      // 가운데 별 전용 큰 이미지 (205x195 고해상도)
      bigFilledTex = await Assets.load('./images/big-star_filled.png');
    } catch {}

    starConfigs.forEach((cfg, i) => {
      const isFilled = i < stars;
      const isCenter = i === 1;
      let star: Sprite | Text;

      // 가운데 채워진 별 = bigFilledTex 우선 (없으면 filledTex), 그 외 = filledTex/emptyTex
      const tex = isFilled
        ? (isCenter && bigFilledTex ? bigFilledTex : filledTex)
        : emptyTex;
      if (tex) {
        star = new Sprite(tex);
        star.anchor.set(0.5);
        const scale = cfg.size / Math.max(tex.width, tex.height);
        star.width = tex.width * scale;
        star.height = tex.height * scale;
      } else {
        // PNG 로드 실패 시 이모지 fallback
        star = new Text({
          text: isFilled ? '⭐' : '☆',
          style: { fontSize: cfg.size * 0.85 },
        });
        star.anchor.set(0.5);
      }
      star.position.set(cfg.x, cfg.y);
      star.scale.set(0);
      // 별을 패널 바로 위에, 텍스트 아래에 (index 2 = panel 다음)
      this.addChildAt(star, Math.min(2, this.children.length));

      // 별 등장 애니메이션 (순차) — 채워진 별만 사운드
      const delay = 200 + i * 200;
      setTimeout(() => {
        if (isFilled) audio.play('star');
        const start = performance.now();
        const baseScale = star instanceof Sprite ? 1 : 1; // 스프라이트는 이미 크기 적용됨
        const animate = () => {
          const elapsed = performance.now() - start;
          const t = Math.min(elapsed / 400, 1);
          const eased = 1 - Math.pow(1 - t, 4);
          const overshoot = t < 1 ? 1.3 - 0.3 * eased : 1;
          star.scale.set(eased * overshoot * baseScale);
          if (t < 1) requestAnimationFrame(animate);
        };
        animate();
      }, delay);
    });
  }

  private renderScoreBreakdown(result: ResultData): void {
    // 씬 이름 아래, 총점 위
    const baseY = 480;
    const items = [
      { label: t('result.score'), value: result.baseScore },
      { label: t('result.time_bonus'), value: result.timeBonus },
      { label: t('result.combo_bonus'), value: result.comboBonus },
      { label: t('result.perfect_bonus'), value: result.perfectBonus },
    ];

    items.forEach((item, i) => {
      const x = GAME_WIDTH / 2 - 280 + (i % 2) * 280;
      const y = baseY + Math.floor(i / 2) * 48;

      const label = new Text({
        text: item.label,
        style: { fontSize: 22, fill: 0x6b4a2b, fontWeight: 'bold' },
      });
      label.position.set(x, y);
      this.addChild(label);

      const value = new Text({
        text: `+${item.value}`,
        style: { fontSize: 22, fill: 0x3a2410, fontWeight: 'bold' },
      });
      value.anchor.set(1, 0);
      value.position.set(x + 220, y);
      this.addChild(value);
    });
  }

  private renderButton(
    fallbackEmoji: string,
    texturePath: string,
    x: number,
    y: number,
    onClick: () => void
  ): Container {
    const btn = new Container();
    btn.position.set(x, y);

    // PNG 로드 시도 — 실패 시 이모지 fallback
    const ICON_SIZE = 120;
    let placeholder: Text | null = new Text({
      text: fallbackEmoji,
      style: { fontSize: 80 },
    });
    placeholder.anchor.set(0.5);
    btn.addChild(placeholder);

    Assets.load(texturePath)
      .then((tex: Texture) => {
        if (placeholder) {
          btn.removeChild(placeholder);
          placeholder.destroy();
          placeholder = null;
        }
        const sprite = new Sprite(tex);
        sprite.anchor.set(0.5);
        const scale = ICON_SIZE / Math.max(tex.width, tex.height);
        sprite.width = tex.width * scale;
        sprite.height = tex.height * scale;
        btn.addChild(sprite);
      })
      .catch(() => {
        /* PNG 없으면 이모지 fallback 유지 */
      });

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerover', () => btn.scale.set(1.1));
    btn.on('pointerout', () => btn.scale.set(1));
    btn.on('pointertap', onClick);

    this.addChild(btn);
    return btn;
  }

  /** popup_bg 우상단 모서리에 X 닫기 버튼 — 위치 고정, 클릭=닫기 */
  private renderCloseButton(): void {
    const btn = new Container();
    // 고정 위치 — 패널 우상단 모서리
    btn.position.set(1395, 55);
    const SIZE = 90;
    Assets.load('./images/popup_x.png')
      .then((tex: Texture) => {
        const sprite = new Sprite(tex);
        sprite.anchor.set(0.5);
        const scale = SIZE / Math.max(tex.width, tex.height);
        sprite.width = tex.width * scale;
        sprite.height = tex.height * scale;
        btn.addChild(sprite);
      })
      .catch(() => {
        const fallback = new Text({
          text: '❌',
          style: { fontSize: 56 },
        });
        fallback.anchor.set(0.5);
        btn.addChild(fallback);
      });
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerover', () => btn.scale.set(1.12));
    btn.on('pointerout', () => btn.scale.set(1));
    btn.on('pointertap', () => {
      audio.play('button');
      this.onHomeCallback?.();
    });
    this.addChild(btn);
  }

  onRetry(callback: () => void): void {
    this.onRetryCallback = callback;
  }

  onHome(callback: () => void): void {
    this.onHomeCallback = callback;
  }
}
