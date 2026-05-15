import { Container, Graphics, Text, Sprite, Texture, Assets } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../primitives/constants';
import { audio } from '../audio/SoundManager';
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
      .fill({ color: 0x000000, alpha: 0.75 });
    this.addChild(overlay);

    // 결과 패널
    const panel = new Graphics()
      .roundRect(GAME_WIDTH / 2 - 500, GAME_HEIGHT / 2 - 350, 1000, 700, 30)
      .fill({ color: COLORS.CREAM_WHITE })
      .stroke({ color: COLORS.SUNSET_ORANGE, width: 6 });
    this.addChild(panel);

    // 타이틀
    const title = new Text({
      text: `🎉 Stage Clear!`,
      style: {
        fontSize: 64,
        fill: COLORS.DARK_CHARCOAL,
        fontWeight: 'bold',
      },
    });
    title.anchor.set(0.5);
    title.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 280);
    this.addChild(title);

    // 씬 이름
    const sceneName = new Text({
      text: result.sceneTitle.ko,
      style: {
        fontSize: 32,
        fill: 0x666666,
        fontStyle: 'italic',
      },
    });
    sceneName.anchor.set(0.5);
    sceneName.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 210);
    this.addChild(sceneName);

    // 별점 표시 (3개 별)
    this.renderStars(result.stars);

    // 점수 상세
    this.renderScoreBreakdown(result);

    // 총점
    const totalLabel = new Text({
      text: `TOTAL SCORE`,
      style: { fontSize: 24, fill: 0x888888, fontWeight: 'bold' },
    });
    totalLabel.anchor.set(0.5);
    totalLabel.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130);
    this.addChild(totalLabel);

    const totalScore = new Text({
      text: `${result.totalScore}`,
      style: {
        fontSize: 80,
        fill: COLORS.SUNSET_ORANGE,
        fontWeight: 'bold',
      },
    });
    totalScore.anchor.set(0.5);
    totalScore.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 190);
    this.addChild(totalScore);

    // 버튼 2개 (PNG 아이콘)
    this.renderButton('🔄', '/images/btn_retry.png', GAME_WIDTH / 2 - 130, GAME_HEIGHT / 2 + 250, () => {
      audio.play('button');
      this.onRetryCallback?.();
    });
    this.renderButton('🏠', '/images/btn_home.png', GAME_WIDTH / 2 + 130, GAME_HEIGHT / 2 + 250, () => {
      audio.play('button');
      this.onHomeCallback?.();
    });

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
    const STAR_SIZE = 140;
    const starPositions = [
      { x: GAME_WIDTH / 2 - 150, y: GAME_HEIGHT / 2 - 100 },
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 - 110 },
      { x: GAME_WIDTH / 2 + 150, y: GAME_HEIGHT / 2 - 100 },
    ];

    // PNG 자산 로드 (실패 시 이모지 fallback)
    let filledTex: Texture | undefined;
    let emptyTex: Texture | undefined;
    try {
      filledTex = await Assets.load('/images/star_filled.png');
    } catch {}
    try {
      emptyTex = await Assets.load('/images/star_empty.png');
    } catch {}

    starPositions.forEach((pos, i) => {
      const isFilled = i < stars;
      let star: Sprite | Text;

      const tex = isFilled ? filledTex : emptyTex;
      if (tex) {
        star = new Sprite(tex);
        star.anchor.set(0.5);
        const scale = STAR_SIZE / Math.max(tex.width, tex.height);
        star.width = tex.width * scale;
        star.height = tex.height * scale;
      } else {
        // PNG 로드 실패 시 이모지 fallback
        star = new Text({
          text: isFilled ? '⭐' : '☆',
          style: { fontSize: 100 },
        });
        star.anchor.set(0.5);
      }
      star.position.set(pos.x, pos.y);
      star.scale.set(0);
      this.addChild(star);

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
    const baseY = GAME_HEIGHT / 2 + 30;
    const items = [
      { label: '쓰레기 점수', value: result.baseScore },
      { label: '시간 보너스', value: result.timeBonus },
      { label: '콤보 보너스', value: result.comboBonus },
      { label: '완벽 보너스', value: result.perfectBonus },
    ];

    items.forEach((item, i) => {
      const x = GAME_WIDTH / 2 - 300 + (i % 2) * 300;
      const y = baseY + Math.floor(i / 2) * 40;

      const label = new Text({
        text: item.label,
        style: { fontSize: 22, fill: 0x666666 },
      });
      label.position.set(x, y);
      this.addChild(label);

      const value = new Text({
        text: `+${item.value}`,
        style: { fontSize: 22, fill: 0x000000, fontWeight: 'bold' },
      });
      value.anchor.set(1, 0);
      value.position.set(x + 200, y);
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

  onRetry(callback: () => void): void {
    this.onRetryCallback = callback;
  }

  onHome(callback: () => void): void {
    this.onHomeCallback = callback;
  }
}
