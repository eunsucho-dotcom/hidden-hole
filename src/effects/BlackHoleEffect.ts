import { Container, Graphics } from 'pixi.js';
import { SUCTION, COLORS } from '../primitives/constants';
import { audio } from '../audio/SoundManager';
import type { TrashSprite } from '../scene/TrashSprite';

/**
 * 블랙홀 흡입 효과
 * 모든 활성화된 사물이 화면 중앙으로 스파이럴 곡선을 그리며 빨려들어감
 * 사용 트릭: 스케일↓ + 회전 + 알파↓ + 곡선 경로 + 블러
 */
export class BlackHoleEffect extends Container {
  private hole: Graphics;
  private targetX: number;
  private targetY: number;
  private onCompleteCallback?: () => void;

  constructor(centerX: number, centerY: number) {
    super();
    this.targetX = centerX;
    this.targetY = centerY;
    this.position.set(centerX, centerY);

    // 블랙홀 자체 (어차피 alpha=0 이라 안 보임 — visible=false 로 렌더 비용 0)
    this.hole = new Graphics()
      .circle(0, 0, SUCTION.HOLE_RADIUS)
      .fill({ color: 0x000000, alpha: 0 });
    this.hole.visible = false; // BlurFilter 도 제거 — 모바일 성능
    this.addChild(this.hole);
  }

  /**
   * 흡입 시퀀스 시작
   * @param targets 빨려들어갈 스프라이트들 (이미 활성화된 것들 + 인터랙티브 오브젝트)
   */
  start(targets: Container[]): void {
    const startTime = performance.now();

    // 흡입 사운드 시퀀스 발동
    audio.play('blackhole_start');
    setTimeout(() => audio.play('blackhole_main'), 300);
    setTimeout(() => audio.play('blackhole_climax'), 1500);

    // 각 타겟의 시작 정보 저장
    const targetStates = targets.map((target) => ({
      sprite: target,
      startX: target.x,
      startY: target.y,
      startScale: target.scale.x,
      startRotation: target.rotation,
      delay: Math.random() * 150,
    }));

    // 블랙홀 자체는 visible=false 라 등장 애니 불필요 (성능 절약)

    // 항목마다 살짝 다른 호버 위로 떠오르는 양 (다양성)
    const liftStates = targetStates.map((state) => ({
      ...state,
      liftY: 18 + Math.random() * 18,           // 위로 부유 18~36px
      tinyRotation: (Math.random() - 0.5) * 0.5, // 호버 중 살짝 흔들림
    }));

    // 흡입 애니메이션 — 2단계
    // Phase 1 (0~25%): 호버 — 살짝 위로 떠오르고 1.15배로 커짐 (카메라로 다가오는 느낌)
    // Phase 2 (25~100%): 강력한 흡입 — 직선 가속 + 급격한 스케일 다운 (깊이감)
    const animate = () => {
      const elapsed = performance.now() - startTime;
      let allDone = true;

      for (const state of liftStates) {
        const localElapsed = elapsed - state.delay;
        if (localElapsed < 0) {
          allDone = false;
          continue;
        }
        const duration = 1100;
        const t = Math.min(localElapsed / duration, 1);
        if (t < 1) allDone = false;

        let scaleFactor: number;
        let posT: number;
        let extraY = 0;
        let rotMul = 0;

        if (t < 0.25) {
          // Phase 1 — 호버 / 카메라로 다가오기
          const pT = t / 0.25;
          // easeOutCubic — 살짝 위로 올라옴
          const eased = 1 - Math.pow(1 - pT, 3);
          scaleFactor = 1 + eased * 0.15;     // 1 → 1.15
          extraY = -state.liftY * eased;
          posT = 0;                            // 위치는 아직 시작점
          rotMul = state.tinyRotation * eased; // 미세 흔들림
        } else {
          // Phase 2 — 빨려들어감 (직선 가속 + 강한 스케일 다운)
          const sT = (t - 0.25) / 0.75;
          // easeInExpo — 천천히 시작해서 끝에 폭발적 가속
          const sEased = sT === 0 ? 0 : Math.pow(2, 10 * sT - 10);
          posT = sEased;
          // 스케일: 1.15 → 0.04 (강한 깊이감)
          scaleFactor = 1.15 * (1 - sEased * 0.97);
          extraY = -state.liftY * (1 - sEased); // 위로 올라간 만큼 다시 내려옴
          rotMul = state.tinyRotation + sEased * Math.PI * 1.2; // 1바퀴 미만 회전
        }

        state.sprite.x = state.startX + (this.targetX - state.startX) * posT;
        state.sprite.y = state.startY + (this.targetY - state.startY) * posT + extraY;
        state.sprite.scale.set(state.startScale * scaleFactor);
        state.sprite.rotation = state.startRotation + rotMul;

        // 알파 — 끝 10% 만 페이드
        if (t < 0.9) {
          state.sprite.alpha = 1;
        } else {
          state.sprite.alpha = Math.max(0, 1 - (t - 0.9) / 0.1);
        }
      }

      if (!allDone) {
        requestAnimationFrame(animate);
      } else {
        this.collapse();
      }
    };
    animate();
  }

  private collapse(): void {
    // 어차피 hole 은 안 보이므로 즉시 완료 콜백 (애니 RAF 절약)
    this.visible = false;
    this.onCompleteCallback?.();
  }

  private easeInCubic(t: number): number {
    return t * t * t;
  }

  onComplete(callback: () => void): void {
    this.onCompleteCallback = callback;
  }
}
