import { Container, Graphics, Text, Sprite, Texture, Assets } from 'pixi.js';
import { GAME_WIDTH, COLORS } from '../primitives/constants';
import { audio } from '../audio/SoundManager';

/**
 * 게임 HUD — 상단 오버레이 (타이머, 점수, 활성화 카운터, 사운드 토글)
 */
export class GameHUD extends Container {
  private timerText: Text;
  private scoreText: Text;
  private statusText: Text;
  private skill1Slot: Container;
  private skill2Slot: Container;
  private soundToggle: Container;
  private soundOnSprite?: Sprite;
  private soundOffSprite?: Sprite;
  private soundFallback?: Text;
  private isMuted = false;

  constructor() {
    super();

    // 타이머 패널 배경 (좌상단)
    this.loadHudPanel(20, 12, 260, 64);

    // 타이머 아이콘 (좌) — PNG, fallback ⏱
    this.timerText = new Text({
      text: '0:00',
      style: {
        fontSize: 32,
        fill: 0x1c4a6a,
        fontWeight: 'bold',
      },
    });
    this.timerText.position.set(115, 28);
    this.addChild(this.timerText);
    this.loadHudIcon('/images/hud_timer.png', 64, 45, '⏱', 70);

    // 점수 패널 배경 (우상단, 사운드 토글과 겹치지 않게 왼쪽으로)
    this.loadHudPanel(GAME_WIDTH - 380, 12, 260, 64);

    // 활성화 카운터 (중)
    this.statusText = new Text({
      text: '0 / 0',
      style: {
        fontSize: 32,
        fill: 0xffd700,
        fontWeight: 'bold',
      },
    });
    this.statusText.anchor.set(0.5, 0);
    this.statusText.position.set(GAME_WIDTH / 2, 18);
    this.addChild(this.statusText);

    // 점수 (우, 사운드 토글 왼쪽) — 숫자 사이즈 타이머와 동일
    this.scoreText = new Text({
      text: '0',
      style: {
        fontSize: 32,
        fill: 0x1c4a6a,
        fontWeight: 'bold',
      },
    });
    this.scoreText.anchor.set(1, 0);
    this.scoreText.position.set(GAME_WIDTH - 200, 28);
    this.addChild(this.scoreText);
    // 점수 아이콘 — 숫자 좌측에 위치 (점수가 길어져도 아이콘은 고정)
    this.loadHudIcon('/images/hud_score.png', 58, 45, '🪙', GAME_WIDTH - 330);

    // 스킬 슬롯 (우하단) — 현재 비활성 (visible=false). 필요 시 true로 변경
    this.skill1Slot = this.createSkillSlot('🌀', '오기 발동', 'LOCKED', 0);
    this.skill1Slot.position.set(GAME_WIDTH - 280, 920);
    this.skill1Slot.visible = false;
    this.addChild(this.skill1Slot);

    this.skill2Slot = this.createSkillSlot('🧨', '즉시 클리어', 'LOCKED', 1);
    this.skill2Slot.position.set(GAME_WIDTH - 140, 920);
    this.skill2Slot.visible = false;
    this.addChild(this.skill2Slot);

    // 사운드 토글 (코인 패널과 같은 Y, 1.3배 크게)
    this.soundToggle = this.createSoundToggle();
    this.soundToggle.position.set(GAME_WIDTH - 60, 44);
    this.addChild(this.soundToggle);
  }

  /**
   * 사운드 ON/OFF 토글 버튼
   * 우상단 모서리, 점수 좌측에 배치
   */
  private createSoundToggle(): Container {
    const c = new Container();

    // PNG 로드 실패 시 fallback (🔊 텍스트)
    this.soundFallback = new Text({
      text: '🔊',
      style: { fontSize: 44 },
    });
    this.soundFallback.anchor.set(0.5);
    c.addChild(this.soundFallback);

    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointertap', () => this.toggleSound());
    c.on('pointerover', () => c.scale.set(1.1));
    c.on('pointerout', () => c.scale.set(1));

    // PNG 비동기 로드
    this.loadSoundIcons();

    return c;
  }

  private async loadSoundIcons(): Promise<void> {
    let onTex: Texture | undefined;
    let offTex: Texture | undefined;
    try {
      onTex = await Assets.load('/images/icon_sound_on.png');
    } catch {}
    try {
      offTex = await Assets.load('/images/icon_sound_off.png');
    } catch {}

    if (!onTex && !offTex) return;

    // 텍스트 fallback 제거
    if (this.soundFallback) {
      this.soundToggle.removeChild(this.soundFallback);
      this.soundFallback.destroy();
      this.soundFallback = undefined;
    }

    const ICON_SIZE = 78;
    if (onTex) {
      this.soundOnSprite = new Sprite(onTex);
      this.soundOnSprite.anchor.set(0.5);
      const scale = ICON_SIZE / Math.max(onTex.width, onTex.height);
      this.soundOnSprite.width = onTex.width * scale;
      this.soundOnSprite.height = onTex.height * scale;
      this.soundOnSprite.visible = !this.isMuted;
      this.soundToggle.addChild(this.soundOnSprite);
    }
    if (offTex) {
      this.soundOffSprite = new Sprite(offTex);
      this.soundOffSprite.anchor.set(0.5);
      const scale = ICON_SIZE / Math.max(offTex.width, offTex.height);
      this.soundOffSprite.width = offTex.width * scale;
      this.soundOffSprite.height = offTex.height * scale;
      this.soundOffSprite.visible = this.isMuted;
      this.soundToggle.addChild(this.soundOffSprite);
    }
  }

  private toggleSound(): void {
    this.isMuted = audio.toggleMute();
    if (this.soundOnSprite) this.soundOnSprite.visible = !this.isMuted;
    if (this.soundOffSprite) this.soundOffSprite.visible = this.isMuted;
    if (this.soundFallback) {
      this.soundFallback.text = this.isMuted ? '🔇' : '🔊';
    }
  }

  // 스킬 클릭 콜백 (외부에서 등록)
  private skillClickCallbacks: Array<(() => void) | null> = [null, null];
  onSkillClick(slotIndex: 0 | 1, cb: () => void): void {
    this.skillClickCallbacks[slotIndex] = cb;
  }

  /**
   * 스킬 상태 갱신 (외부에서 호출) — 잠금 → 준비됨 → 발동대기(ARMED) → 사용완료
   */
  updateSkillStatus(slotIndex: 0 | 1, status: 'LOCKED' | 'READY' | 'ARMED' | 'USED'): void {
    const slot = slotIndex === 0 ? this.skill1Slot : this.skill2Slot;
    // 기존 슬롯 제거 후 재생성
    const x = slot.x;
    const y = slot.y;
    const idx = this.getChildIndex(slot);
    this.removeChild(slot);
    slot.destroy({ children: true });
    const newSlot = this.createSkillSlot(
      slotIndex === 0 ? '🌀' : '🧨',
      slotIndex === 0 ? '오기 발동' : '즉시 클리어',
      status,
      slotIndex,
    );
    newSlot.position.set(x, y);
    this.addChildAt(newSlot, idx);
    if (slotIndex === 0) this.skill1Slot = newSlot;
    else this.skill2Slot = newSlot;
  }

  private createSkillSlot(
    emoji: string,
    name: string,
    status: 'LOCKED' | 'READY' | 'ARMED' | 'USED',
    slotIndex?: 0 | 1
  ): Container {
    const c = new Container();
    const isActive = status === 'READY' || status === 'ARMED';
    const fillColor = status === 'ARMED' ? 0xff9f68 : isActive ? 0x4a4a4a : 0x2a2a2a;
    const strokeColor = isActive ? COLORS.SUNSET_ORANGE : 0x666666;
    const bg = new Graphics()
      .roundRect(0, 0, 120, 120, 16)
      .fill({ color: fillColor, alpha: 0.9 })
      .stroke({ color: strokeColor, width: status === 'ARMED' ? 5 : 3 });
    c.addChild(bg);

    if (status === 'READY' && slotIndex !== undefined) {
      c.eventMode = 'static';
      c.cursor = 'pointer';
      c.on('pointertap', () => {
        const cb = this.skillClickCallbacks[slotIndex];
        if (cb) cb();
      });
      c.on('pointerover', () => c.scale.set(1.05));
      c.on('pointerout', () => c.scale.set(1));
    }

    // ARMED 상태: 펄스 애니메이션 (사물 클릭 대기 중)
    if (status === 'ARMED') {
      const pulseStart = performance.now();
      const pulse = () => {
        if (!c.parent) return; // destroy되면 중단
        const t = ((performance.now() - pulseStart) / 600) * Math.PI * 2;
        const s = 1 + Math.sin(t) * 0.08;
        c.scale.set(s);
        requestAnimationFrame(pulse);
      };
      pulse();
    }

    if (status === 'LOCKED') {
      // 잠금 PNG (fallback 🔒)
      const lockFallback = new Text({
        text: '🔒',
        style: { fontSize: 44 },
      });
      lockFallback.anchor.set(0.5);
      lockFallback.position.set(60, 42);
      c.addChild(lockFallback);
      Assets.load('/images/icon_lock.png').then((tex: Texture) => {
        c.removeChild(lockFallback);
        lockFallback.destroy();
        const lockSprite = new Sprite(tex);
        lockSprite.anchor.set(0.5);
        const SIZE = 60;
        const scale = SIZE / Math.max(tex.width, tex.height);
        lockSprite.width = tex.width * scale;
        lockSprite.height = tex.height * scale;
        lockSprite.position.set(60, 42);
        c.addChild(lockSprite);
      }).catch(() => {});
      // 잠금 해제 조건 표시 (예: "5장 클리어")
      const conditions = ['5장 클리어', '제한시간 내\n10장 클리어'];
      const condIdx = slotIndex ?? 0;
      const conditionText = new Text({
        text: conditions[condIdx] || '',
        style: {
          fontSize: 12,
          fill: 0xffd966,
          fontWeight: 'bold',
          align: 'center',
        },
      });
      conditionText.anchor.set(0.5);
      conditionText.position.set(60, 80);
      c.addChild(conditionText);
    } else {
      const icon = new Text({
        text: emoji,
        style: { fontSize: 48 },
      });
      icon.anchor.set(0.5);
      icon.position.set(60, 50);
      c.addChild(icon);
    }

    const label = new Text({
      text: name,
      style: { fontSize: 14, fill: 0xffffff, fontWeight: 'bold' },
    });
    label.anchor.set(0.5);
    label.position.set(60, 100);
    c.addChild(label);

    return c;
  }

  /**
   * 타이머/점수 패널 배경 PNG (timer_score_panel.png) 비동기 로드
   */
  private async loadHudPanel(x: number, y: number, width: number, height: number): Promise<void> {
    try {
      const tex = await Assets.load('/images/timer_score_panel.png');
      const sprite = new Sprite(tex);
      sprite.width = width;
      sprite.height = height;
      sprite.position.set(x, y);
      // 가장 아래로 — 아이콘/텍스트가 위에 덮이도록
      this.addChildAt(sprite, 0);
    } catch {
      /* PNG 없으면 무시 */
    }
  }

  /**
   * HUD 작은 아이콘 PNG 비동기 로드 + 위치 배치
   * @param x 명시하지 않으면 timer 좌측 (40)
   */
  private async loadHudIcon(
    path: string,
    size: number,
    y: number,
    fallbackEmoji: string,
    x: number = 40
  ): Promise<void> {
    // 일단 이모지 fallback 렌더 (PNG 로드 전에도 뭔가 보이게)
    const fallback = new Text({
      text: fallbackEmoji,
      style: { fontSize: size },
    });
    fallback.anchor.set(0.5);
    fallback.position.set(x, y);
    this.addChild(fallback);

    try {
      const tex = await Assets.load(path);
      this.removeChild(fallback);
      fallback.destroy();
      const sprite = new Sprite(tex);
      sprite.anchor.set(0.5);
      const scale = size / Math.max(tex.width, tex.height);
      sprite.width = tex.width * scale;
      sprite.height = tex.height * scale;
      sprite.position.set(x, y);
      this.addChild(sprite);
    } catch {
      /* 이모지 fallback 유지 */
    }
  }

  updateTimer(elapsedMs: number): void {
    const totalSec = Math.floor(elapsedMs / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    this.timerText.text = `${min}:${sec.toString().padStart(2, '0')}`;
  }

  updateStatus(activated: number, total: number): void {
    this.statusText.text = `${activated} / ${total}`;
  }

  updateScore(score: number): void {
    this.scoreText.text = `${score}`;
  }

  hide(): void {
    this.visible = false;
  }
}
