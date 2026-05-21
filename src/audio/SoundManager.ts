import { Howl } from 'howler';

/**
 * 사운드 매니저 — Howler.js 기반
 * 파일이 없어도 게임은 정상 동작 (로그만 출력)
 *
 * 볼륨 정책:
 * - SFX: 1.0 (포어그라운드, ASMR 카타르시스)
 * - BGM: 0.04 (작게 — ASMR 클릭 사운드가 도드라지도록)
 */
const BGM_TARGET_VOLUME = 0.04;

export class SoundManager {
  private sounds = new Map<string, Howl>();
  private bgmCurrent: Howl | null = null;
  private muted = false;
  private masterVolume = 1.0;

  /**
   * 사운드 등록 (사전 로드)
   * @param key 식별자 (예: 'click_paper', 'blackhole_main')
   * @param src 파일 경로 (예: './sounds/sfx_click_paper.mp3')
   */
  register(key: string, src: string, options: { volume?: number; loop?: boolean; rate?: number } = {}): void {
    const sound = new Howl({
      src: [src],
      volume: options.volume ?? 1.0,
      loop: options.loop ?? false,
      rate: options.rate ?? 1.0,
      preload: true,
      onloaderror: (_id, err) => {
        console.warn(`[Sound] 로드 실패: ${key} (${src}) - 파일이 아직 없을 수 있음. 무시하고 진행.`, err);
      },
    });
    this.sounds.set(key, sound);
  }

  /**
   * 효과음 재생 (일회성)
   */
  play(key: string): void {
    if (this.muted) return;
    const sound = this.sounds.get(key);
    if (!sound) {
      // 파일 없으면 조용히 무시
      return;
    }
    sound.volume(this.masterVolume);
    sound.play();
  }

  /**
   * BGM 재생 (이전 BGM 자동 정지) — idempotent (이미 같은 BGM 재생 중이면 무시)
   */
  playBgm(key: string, fadeMs: number = 1000): void {
    const sound = this.sounds.get(key);
    if (!sound) return;
    // 이미 같은 BGM이 재생 중이면 skip
    if (this.bgmCurrent === sound && sound.playing()) return;

    if (this.bgmCurrent && this.bgmCurrent !== sound) {
      this.bgmCurrent.fade(this.bgmCurrent.volume(), 0, fadeMs);
      const oldBgm = this.bgmCurrent;
      setTimeout(() => oldBgm.stop(), fadeMs);
    }

    this.bgmCurrent = sound;
    if (!this.muted) {
      sound.volume(0);
      sound.play();
      sound.fade(0, this.masterVolume * BGM_TARGET_VOLUME, fadeMs);
    }
  }

  /**
   * 음소거 토글
   */
  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) {
      this.sounds.forEach((s) => s.volume(0));
    } else {
      this.sounds.forEach((s) => s.volume(this.masterVolume));
    }
    return this.muted;
  }

  /**
   * 마스터 볼륨 설정 (0.0 ~ 1.0)
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (!this.muted) {
      this.sounds.forEach((s) => s.volume(this.masterVolume));
    }
  }

  /**
   * 모든 사운드 중지
   */
  stopAll(): void {
    this.sounds.forEach((s) => s.stop());
    this.bgmCurrent = null;
  }

  pauseAll(): void {
    this.sounds.forEach((s) => s.pause());
  }

  resumeAll(): void {
    if (this.muted) return;
    // BGM만 재개 (SFX는 일회성이라 재개 불필요)
    if (this.bgmCurrent) this.bgmCurrent.play();
  }
}

// 싱글턴 (전역 접근용)
export const audio = new SoundManager();

/**
 * 게임 시작 시 한 번만 호출 — 모든 사운드 사전 등록
 */
export function initializeSounds(): void {
  // BGM
  audio.register('bgm_lv1', './sounds/bgm_game_lv1.mp3', { loop: true });
  audio.register('bgm_lv2', './sounds/bgm_game_lv2.mp3', { loop: true });
  audio.register('bgm_lv3', './sounds/bgm_game_lv3.mp3', { loop: true });
  audio.register('bgm_title', './sounds/bgm_title.mp3', { loop: true });
  // 3종 BGM 옵션 — main.ts에서 마음에 드는 키로 audio.playBgm() 호출하면 됨
  audio.register('bgm_lofi', './sounds/bgm_lofi.mp3', { loop: true });
  audio.register('bgm_jazz', './sounds/bgm_jazz.mp3', { loop: true });
  audio.register('bgm_ambient', './sounds/bgm_ambient.mp3', { loop: true, rate: 0.5 });
  // 후보 3종 — 본인이 듣고 마음에 드는 거 선택
  audio.register('bgm_option1', './sounds/bgm_option1.mp3', { loop: true });
  audio.register('bgm_option2', './sounds/bgm_option2.mp3', { loop: true });
  audio.register('bgm_option3', './sounds/bgm_option3.mp3', { loop: true });

  // 클릭 SFX (사물별 다양) — ASMR 강조를 위해 볼륨 최대치
  audio.register('click_paper', './sounds/sfx_click_paper.mp3', { volume: 1.0 });
  audio.register('click_plastic', './sounds/sfx_click_plastic.mp3', { volume: 1.0 });
  audio.register('click_fabric', './sounds/sfx_click_fabric.mp3', { volume: 1.0 });
  audio.register('click_glass', './sounds/sfx_click_glass.mp3', { volume: 1.0 });
  audio.register('click_box', './sounds/sfx_click_box.mp3', { volume: 1.0 });
  audio.register('click_cup', './sounds/sfx_click_cup.mp3', { volume: 1.0 });
  audio.register('click_vinyl', './sounds/sfx_click_vinyl.mp3', { volume: 1.0 });
  audio.register('click_metal', './sounds/sfx_click_metal.mp3', { volume: 1.0 });
  audio.register('click_can', './sounds/sfx_click_can.mp3', { volume: 1.0 });
  audio.register('click_cracker', './sounds/sfx_click_cracker.mp3', { volume: 1.0 });
  audio.register('click_paper_towel', './sounds/sfx_click_paper_towel.mp3', { volume: 1.0 });
  audio.register('click_crumple', './sounds/sfx_click_crumple.mp3', { volume: 1.0 });
  audio.register('category_complete', './sounds/sfx_category_complete.mp3', { volume: 1.0 });
  audio.register('pig_open', './sounds/sfx_pig_open.mp3', { volume: 0.4 });

  // 인터랙션 SFX — ASMR 강조를 위해 볼륨 최대치
  audio.register('drag_start', './sounds/sfx_drag_start.mp3', { volume: 1.0 });
  audio.register('drag_complete', './sounds/sfx_drag_complete.mp3', { volume: 1.0 });
  audio.register('lift', './sounds/sfx_lift.mp3', { volume: 1.0 });
  audio.register('swipe', './sounds/sfx_swipe.mp3', { volume: 1.0 });
  audio.register('pop', './sounds/sfx_pop.mp3', { volume: 1.0 });

  // 블랙홀 흡입 시퀀스 (5단계)
  audio.register('blackhole_start', './sounds/sfx_blackhole_start.mp3', { volume: 0.5 });
  audio.register('blackhole_main', './sounds/sfx_blackhole_main.mp3');
  audio.register('blackhole_climax', './sounds/sfx_blackhole_climax.mp3');
  audio.register('clean_reveal', './sounds/sfx_clean_reveal.mp3');

  // UI / 결과
  audio.register('perfect', './sounds/sfx_perfect.mp3');
  audio.register('star', './sounds/sfx_star.mp3', { volume: 0.6 });
  audio.register('button', './sounds/sfx_button.mp3', { volume: 0.5 });

  // 스킬
  audio.register('skill_eok', './sounds/sfx_skill_eok.mp3');
  audio.register('skill_clear', './sounds/sfx_skill_clear.mp3');

  console.log('🔊 사운드 시스템 초기화 완료');
}

/**
 * 클릭 사운드를 카테고리별로 자동 선택 (trashId 포맷: "category_N")
 */
export function getClickSoundKey(trashId: string): string {
  const id = trashId.toLowerCase();
  // 맥주 캔 — 캔 찌그러트리는 소리
  if (id.startsWith('beer_')) return 'click_can';
  // 소주 + 맥주컵 — 유리 부딪히는 소리
  if (id.startsWith('soju') || id.startsWith('beercup')) return 'click_glass';
  // 갈색컵·빨간컵 — 가벼운 컵 톡
  if (id.startsWith('browncup') || id.startsWith('redcup')) return 'click_cup';
  // 비닐봉지 / 과자봉지 — 비닐 바스락
  if (id.startsWith('plastic') || id.startsWith('snackbag')) return 'click_vinyl';
  // 박스 / 액자
  if (id.startsWith('box') || id.startsWith('frame')) return 'click_box';
  // 금속 (반지)
  if (id.startsWith('ring')) return 'click_metal';
  // 천 (수건, 바지)
  if (id.startsWith('towel') || id.startsWith('pants')) return 'click_fabric';
  // 과자 부스러기 — 크래커 깨지는 소리
  if (id.startsWith('crumbs')) return 'click_cracker';
  // 키친 타올 (두루마리 휴지)
  if (id.startsWith('tissueroll')) return 'click_paper_towel';
  // 휴지조각 — 종이 꾸겨지는 소리
  if (id.startsWith('tissue')) return 'click_crumple';
  // 일반 종이류 (편지, 피자)
  if (id.startsWith('letter') || id.startsWith('pizza')) return 'click_paper';
  return 'click_plastic';
}
