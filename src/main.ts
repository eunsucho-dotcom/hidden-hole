import { Application, Container } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './primitives/constants';
import { SplitScene } from './scene/SplitScene';
import { TitleScreen } from './scene/TitleScreen';
import { ResultScreen } from './scene/ResultScreen';
import { AnimatedPopup } from './scene/AnimatedPopup';
import { t } from './primitives/i18n';
import { LV1_DEMO } from './data/lv1-demo';
import { LV2_DEMO } from './data/lv2-demo';
import { audio, initializeSounds } from './audio/SoundManager';
import type { SceneData } from './primitives/types';

/**
 * SceneData 깊은 복제 (상태 초기화 포함)
 * 다시 플레이 시 isActivated/isInteracted 상태가 남아있으면 안 되니까
 */
function freshSceneData(data: SceneData): SceneData {
  return {
    ...data,
    title: { ...data.title },
    story: { ...data.story },
    trashItems: data.trashItems.map((t) => ({
      ...t,
      position: { ...t.position },
      size: { ...t.size },
      isActivated: false,
    })),
    interactiveObjects: data.interactiveObjects.map((i) => ({
      ...i,
      position: { ...i.position },
      size: { ...i.size },
      targetPosition: i.targetPosition ? { ...i.targetPosition } : undefined,
      revealsTrashIds: [...i.revealsTrashIds],
      isInteracted: false,
    })),
  };
}

/**
 * Hidden Hole (히든홀) — 엔트리 + 상태 관리
 *
 * 게임 흐름:
 *   Title → Level (SplitScene) → Result → (Retry: Level 다시 / Home: Title)
 */
class Game {
  private app: Application;
  private root: Container;
  private currentScene: Container | null = null;

  constructor(app: Application) {
    this.app = app;
    this.root = new Container();
    this.app.stage.addChild(this.root);
  }

  private clearScene(): void {
    if (this.currentScene) {
      this.root.removeChild(this.currentScene);
      this.currentScene.destroy({ children: true });
      this.currentScene = null;
    }
  }

  /**
   * 현재 레벨 ID 기반으로 다음 레벨 SceneData 반환 (없으면 null)
   */
  private getNextLevel(currentId: string): SceneData | null {
    if (currentId === 'lv1') return LV2_DEMO;
    return null;
  }

  showTitle(): void {
    this.clearScene();
    const title = new TitleScreen();
    title.onPlay(() => this.showLevel(LV1_DEMO));
    this.root.addChild(title);
    this.currentScene = title;

    // 타이틀 화면에서 키보드 1/2 누르면 Lv1/Lv2 직접 시작, 3 누르면 팝업 애니 테스트
    const keyHandler = (e: KeyboardEvent) => {
      if (this.currentScene !== title) {
        window.removeEventListener('keydown', keyHandler);
        return;
      }
      if (e.code === 'Digit1') this.showLevel(LV1_DEMO);
      else if (e.code === 'Digit2') this.showLevel(LV2_DEMO);
      else if (e.code === 'Digit3') {
        const popup = new AnimatedPopup(t('popup.title'), t('popup.subtitle'));
        this.root.addChild(popup);
      }
    };
    window.addEventListener('keydown', keyHandler);
  }

  showLevel(data: SceneData): void {
    this.clearScene();
    // BGM 시작 (사용자가 게임 진입한 후, 브라우저 autoplay 허용됨)
    audio.playBgm('bgm_ambient');
    // 데이터 깊은 복제 — 상태 초기화로 재시작 시에도 정상 작동
    const freshData = freshSceneData(data);
    const scene = new SplitScene(freshData);
    scene.onComplete((result) => {
      const resultScreen = new ResultScreen(result);
      const nextLevel = this.getNextLevel(data.id);
      // 다음 레벨 있으면 5초 후 자동 이동 (사용자가 retry/home 누르면 취소)
      let autoTimer: number | undefined;
      const cancelAuto = () => {
        if (autoTimer !== undefined) {
          clearTimeout(autoTimer);
          autoTimer = undefined;
        }
      };
      const cleanupResult = () => {
        cancelAuto();
        if (resultScreen.parent) this.root.removeChild(resultScreen);
        resultScreen.destroy({ children: true });
      };
      // 재시작 = 같은 레벨 replay (다음 레벨 있으면 자동 진행이 처리)
      resultScreen.onRetry(() => {
        cleanupResult();
        this.showLevel(data);
      });
      resultScreen.onHome(() => {
        cleanupResult();
        this.showTitle();
      });
      this.root.addChild(resultScreen);
      // 다음 레벨 있으면 5초 후 자동 진행
      if (nextLevel) {
        autoTimer = window.setTimeout(() => {
          cleanupResult();
          this.showLevel(nextLevel);
        }, 5000);
      }
    });
    this.root.addChild(scene);
    this.currentScene = scene;

    // 게임 루프 (idle 모션 + 타이머)
    let lastTime = performance.now();
    const ticker = (): void => {
      if (this.currentScene !== scene) {
        this.app.ticker.remove(ticker);
        return;
      }
      const now = performance.now();
      const deltaMs = now - lastTime;
      lastTime = now;
      scene.update(deltaMs);
    };
    this.app.ticker.add(ticker);
  }
}

/**
 * 커스텀 폰트를 PixiJS가 사용하기 전에 명시적으로 로드.
 * PixiJS는 캔버스에 텍스트 렌더 시점에 폰트가 document.fonts에 있어야 적용됨.
 * CSS @font-face만 있으면 lazy 로드 때문에 적용 안 되는 경우 많음.
 */
async function preloadFonts(): Promise<void> {
  const fonts = [
    { family: 'ARLRDBD', url: './fonts/ARLRDBD.TTF' },
  ];
  for (const f of fonts) {
    try {
      const face = new FontFace(f.family, `url(${f.url})`);
      await face.load();
      document.fonts.add(face);
      console.log(`✅ 폰트 로드: ${f.family}`);
    } catch (e) {
      console.warn(`⚠️ 폰트 로드 실패: ${f.family}`, e);
    }
  }
  // 모든 폰트 로드 완료 대기
  await document.fonts.ready;
}

async function main() {
  // 폰트 먼저 로드 (PixiJS 텍스트 렌더 전에)
  await preloadFonts();

  const app = new Application();

  await app.init({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: COLORS.BG_DARK,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  const appDiv = document.getElementById('app');
  if (!appDiv) throw new Error('#app 엘리먼트가 없습니다');
  appDiv.appendChild(app.canvas);

  // 반응형 스케일링 (해상도 유지하면서 화면에 맞춤)
  const resize = () => {
    const ratio = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
    app.canvas.style.width = `${GAME_WIDTH * ratio}px`;
    app.canvas.style.height = `${GAME_HEIGHT * ratio}px`;
  };
  window.addEventListener('resize', resize);
  resize();

  // 사운드 시스템 초기화
  initializeSounds();

  // BGM 비활성화 — ASMR 컨셉상 무음이 효과적 (SFX가 주인공)
  // 다시 켜고 싶으면 아래 주석 해제:
  // window.addEventListener('pointerdown', () => audio.playBgm('bgm_lv1'), { once: true });

  // 게임 시작 — 타이틀 화면부터
  const game = new Game(app);
  game.showTitle();

  console.log('🎮 Hidden Hole 시작! 타이틀 → Play → Lv1 → 결과 → 다시');
}

main().catch((err) => {
  console.error('게임 시작 실패:', err);
});
