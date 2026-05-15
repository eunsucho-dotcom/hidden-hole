import { Container, Graphics, Text, Sprite, Texture, Assets } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../primitives/constants';
import { audio } from '../audio/SoundManager';

/**
 * 타이틀 화면 — 로고 PNG + Play 버튼 PNG
 */
export class TitleScreen extends Container {
  private onPlayCallback?: () => void;
  private logoSprite?: Sprite;
  private btnSprite?: Sprite;
  private logoFallback?: Text;
  private logoSubFallback?: Text;

  constructor() {
    super();

    // 배경
    const bg = new Graphics()
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .fill({ color: COLORS.WARM_BEIGE });
    this.addChild(bg);

    // 로고 placeholder (PNG 로드 전, 또는 실패 시 fallback)
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

    // Play 버튼 컨테이너 (PNG 로드 전 fallback Graphics 안에)
    const btn = new Container();
    btn.position.set(GAME_WIDTH / 2, GAME_HEIGHT - 170);

    const btnBgFallback = new Graphics()
      .roundRect(-180, -55, 360, 110, 24)
      .fill({ color: COLORS.SUNSET_ORANGE })
      .stroke({ color: COLORS.DARK_CHARCOAL, width: 4 });
    btn.addChild(btnBgFallback);

    const btnLabelFallback = new Text({
      text: '▶  PLAY',
      style: { fontSize: 56, fill: 0xffffff, fontWeight: 'bold' },
    });
    btnLabelFallback.anchor.set(0.5);
    btn.addChild(btnLabelFallback);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerover', () => {
      btn.scale.set(1.05);
    });
    btn.on('pointerout', () => {
      btn.scale.set(1);
    });
    btn.on('pointertap', () => {
      audio.play('button');
      this.onPlayCallback?.();
    });
    this.addChild(btn);

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

    // PNG 자산 비동기 로드 → 있으면 교체
    this.loadAssets(btn, btnBgFallback, btnLabelFallback);
  }

  private async loadAssets(
    btn: Container,
    btnBgFallback: Graphics,
    btnLabelFallback: Text
  ): Promise<void> {
    // 로고
    let logoTex: Texture | undefined;
    try {
      logoTex = await Assets.load('/images/logo_main.png');
    } catch {}
    if (logoTex && this.logoFallback && this.logoSubFallback) {
      // 텍스트 fallback 제거
      this.removeChild(this.logoFallback);
      this.removeChild(this.logoSubFallback);
      this.logoFallback.destroy();
      this.logoSubFallback.destroy();
      this.logoFallback = undefined;
      this.logoSubFallback = undefined;

      // PNG 스프라이트 — 화면 전체를 덮음 (cover 방식, 비율 유지)
      this.logoSprite = new Sprite(logoTex);
      this.logoSprite.anchor.set(0.5);
      const scaleX = GAME_WIDTH / logoTex.width;
      const scaleY = GAME_HEIGHT / logoTex.height;
      const scale = Math.max(scaleX, scaleY); // 짧은 변 기준으로 화면 꽉 채움
      this.logoSprite.width = logoTex.width * scale;
      this.logoSprite.height = logoTex.height * scale;
      this.logoSprite.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2);
      // 배경(bg) 바로 위 인덱스 1에 삽입 → 다른 UI 요소가 위로 올라옴
      this.addChildAt(this.logoSprite, 1);
    }

    // Play 버튼
    let btnTex: Texture | undefined;
    try {
      btnTex = await Assets.load('/images/btn_play.png');
    } catch {}
    if (btnTex) {
      // 기존 fallback Graphics/Text 제거
      btn.removeChild(btnBgFallback);
      btn.removeChild(btnLabelFallback);
      btnBgFallback.destroy();
      btnLabelFallback.destroy();

      // PNG 스프라이트 추가 (목표 너비 360px 기준 비율 유지)
      this.btnSprite = new Sprite(btnTex);
      this.btnSprite.anchor.set(0.5);
      const targetW = 360;
      const scale = targetW / btnTex.width;
      this.btnSprite.width = btnTex.width * scale;
      this.btnSprite.height = btnTex.height * scale;
      btn.addChildAt(this.btnSprite, 0);
    }

    // 로고가 풀스크린으로 깔려서 위에 올라온 텍스트 요소들이 다 가려졌을 수 있음
    // → btn을 최상위로 보장
    this.setChildIndex(btn, this.children.length - 1);
  }

  onPlay(callback: () => void): void {
    this.onPlayCallback = callback;
  }
}
