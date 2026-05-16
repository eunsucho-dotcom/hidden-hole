import { Container, Graphics, Sprite, Texture, Rectangle, AnimatedSprite, Assets, Text } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../primitives/constants';
import { t } from '../primitives/i18n';

/**
 * 팝업 애니메이션 컴포넌트 — 25프레임 스프라이트시트(5×5) 기반 돼지 청소 모션
 *
 * 시트 구조 (`/images/popup animation.png` 1254×1254):
 *   - 5 cols × 5 rows = 25 프레임
 *   - 프레임 1칸 ≈ 250×250 (라벨 영역 포함)
 *   - 라벨 영역은 좌상단 ~30px → 크롭으로 제외
 *
 * 동작:
 *   - 어두운 오버레이 + 카드 형태로 등장 (fade in)
 *   - 25프레임 루프 재생 (10fps)
 *   - 아무 곳이나 탭하면 닫힘 (fade out)
 */
export class AnimatedPopup extends Container {
  private overlay: Graphics;
  private card: Container;
  private animSprite?: AnimatedSprite;
  private dismissed = false;
  private onDismissCallback?: () => void;

  constructor(private title: string = t('popup.title'), private subtitle: string = t('popup.subtitle')) {
    super();

    // 어두운 오버레이 (배경 클릭 차단)
    this.overlay = new Graphics()
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .fill({ color: 0x000000, alpha: 0.55 });
    this.overlay.eventMode = 'static';
    this.addChild(this.overlay);

    // 카드
    this.card = new Container();
    this.card.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.addChild(this.card);

    const cardW = 520;
    const cardH = 620;
    const cardBg = new Graphics()
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 32)
      .fill({ color: 0xfff5e6 })
      .stroke({ color: COLORS.DARK_CHARCOAL, width: 6 });
    this.card.addChild(cardBg);

    // 제목 텍스트
    const titleTxt = new Text({
      text: title,
      style: {
        fontSize: 48,
        fill: COLORS.SUNSET_ORANGE,
        fontWeight: 'bold',
        stroke: { color: COLORS.DARK_CHARCOAL, width: 4 },
      },
    });
    titleTxt.anchor.set(0.5);
    titleTxt.position.set(0, -cardH / 2 + 60);
    this.card.addChild(titleTxt);

    // 서브 텍스트
    const subTxt = new Text({
      text: subtitle,
      style: { fontSize: 26, fill: COLORS.DARK_CHARCOAL },
    });
    subTxt.anchor.set(0.5);
    subTxt.position.set(0, cardH / 2 - 50);
    this.card.addChild(subTxt);

    // 등장 애니메이션 (scale + alpha)
    this.alpha = 0;
    this.card.scale.set(0.7);
    this.animateIn();

    // 탭하면 닫힘
    this.eventMode = 'static';
    this.on('pointertap', () => this.dismiss());

    this.loadAnimation();
  }

  private async loadAnimation(): Promise<void> {
    let sheet: Texture | undefined;
    try {
      sheet = await Assets.load('/images/popup animation.png');
    } catch (e) {
      console.warn('팝업 애니메이션 로드 실패', e);
    }
    if (!sheet) return;

    // 5×5 그리드. 1254/5 = 250.8 → 251씩 끊고, 라벨 영역(좌상단 ~30px) 제외
    const COLS = 5;
    const ROWS = 5;
    const CELL_W = Math.floor(sheet.width / COLS);
    const CELL_H = Math.floor(sheet.height / ROWS);
    const LABEL_PAD_TOP = 32; // 라벨 영역 제거
    const LABEL_PAD_LEFT = 6;
    const frames: Texture[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        frames.push(new Texture({
          source: sheet.source,
          frame: new Rectangle(
            c * CELL_W + LABEL_PAD_LEFT,
            r * CELL_H + LABEL_PAD_TOP,
            CELL_W - LABEL_PAD_LEFT - 4,
            CELL_H - LABEL_PAD_TOP - 4
          ),
        }));
      }
    }

    this.animSprite = new AnimatedSprite(frames);
    this.animSprite.anchor.set(0.5);
    // 카드 중앙에 배치 (제목 아래, 서브텍스트 위)
    this.animSprite.position.set(0, 20);
    const targetSize = 420;
    this.animSprite.width = targetSize;
    this.animSprite.height = targetSize;
    this.animSprite.animationSpeed = 10 / 60; // 10fps
    this.animSprite.loop = true;
    this.animSprite.play();
    this.card.addChild(this.animSprite);
  }

  private animateIn(): void {
    const startTime = performance.now();
    const duration = 280;
    const animate = () => {
      const t = Math.min((performance.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      this.alpha = eased;
      this.card.scale.set(0.7 + 0.3 * eased);
      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }

  /** 닫힘 — fade out 후 parent 에서 제거 */
  dismiss(): void {
    if (this.dismissed) return;
    this.dismissed = true;
    const startTime = performance.now();
    const duration = 220;
    const startAlpha = this.alpha;
    const animate = () => {
      const t = Math.min((performance.now() - startTime) / duration, 1);
      this.alpha = startAlpha * (1 - t);
      this.card.scale.set(1 - 0.1 * t);
      if (t < 1) requestAnimationFrame(animate);
      else {
        if (this.parent) this.parent.removeChild(this);
        this.destroy({ children: true });
        this.onDismissCallback?.();
      }
    };
    animate();
  }

  onDismiss(callback: () => void): void {
    this.onDismissCallback = callback;
  }
}
