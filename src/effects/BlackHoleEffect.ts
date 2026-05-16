import { Container, Graphics, BlurFilter } from 'pixi.js';
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

    // 블랙홀 자체 (회전하는 어두운 원)
    this.hole = new Graphics()
      .circle(0, 0, SUCTION.HOLE_RADIUS)
      .fill({ color: 0x000000, alpha: 0 });

    this.hole.filters = [new BlurFilter({ strength: 12 })];
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

    // 블랙홀 등장 애니메이션
    const holeAnimate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / 500, 1); // 0.5초 동안 등장
      this.hole.fill({ color: 0x000000, alpha: t });
      this.hole.clear();
      this.hole.circle(0, 0, SUCTION.HOLE_RADIUS * (0.3 + t * 0.7)).fill({
        color: 0x000000,
        alpha: t * 0.9,
      });
      this.hole.rotation += 0.15;
      if (t < 1) requestAnimationFrame(holeAnimate);
    };
    holeAnimate();

    // 시작 각도/거리 — 스파이럴 경로 계산용
    const spiralStates = targetStates.map((state) => {
      const dx = state.startX - this.targetX;
      const dy = state.startY - this.targetY;
      return {
        ...state,
        startAngle: Math.atan2(dy, dx),
        startDist: Math.hypot(dx, dy),
        // 항목마다 다른 스핀 방향/속도 (다양성)
        spinDir: Math.random() < 0.5 ? -1 : 1,
        spinSpeed: 8 + Math.random() * 4,   // 4~6바퀴
        tumbleSpeedX: 0.012 + Math.random() * 0.008,
        tumbleSpeedY: 0.014 + Math.random() * 0.008,
      };
    });

    // 흡입 애니메이션 메인 루프 — 3D 느낌 (스파이럴 + 텀블 + 강한 스케일 다운)
    const animate = () => {
      const elapsed = performance.now() - startTime;
      let allDone = true;

      for (const state of spiralStates) {
        const localElapsed = elapsed - state.delay;
        if (localElapsed < 0) {
          allDone = false;
          continue;
        }
        const duration = 1300;
        const t = Math.min(localElapsed / duration, 1);
        if (t < 1) allDone = false;

        // easeInCubic 가속 — 처음 천천히, 끝에 빨려들어감
        const eased = this.easeInCubic(t);

        // 스파이럴 — 거리 줄면서 각도 증가 (소용돌이)
        const currentDist = state.startDist * (1 - eased);
        const angle = state.startAngle + eased * Math.PI * 3 * state.spinDir;
        state.sprite.x = this.targetX + Math.cos(angle) * currentDist;
        state.sprite.y = this.targetY + Math.sin(angle) * currentDist;

        // 3D 깊이감 — 강하게 작아짐 (0~0.05)
        // 처음에 살짝 커지는 느낌(1.0→1.08) 주고, 그 후 0.05까지 수축
        let scaleFactor: number;
        if (eased < 0.15) {
          scaleFactor = 1 + (eased / 0.15) * 0.08; // 1 → 1.08
        } else {
          const shrinkT = (eased - 0.15) / 0.85;
          scaleFactor = 1.08 * (1 - shrinkT * 0.95); // 1.08 → 0.054
        }
        state.sprite.scale.set(state.startScale * scaleFactor);

        // 자체 회전 — 다회전 (3D 스핀)
        state.sprite.rotation =
          state.startRotation + eased * Math.PI * state.spinSpeed * state.spinDir;

        // 텀블 효과 — skew 사인파로 3D 회전 시뮬레이션
        // 시간에 따라 진폭 증가 (가까울수록 더 격렬한 텀블)
        const tumbleAmp = 0.35 + eased * 0.45;
        // Sprite 만 skew 가능 (Container 는 없음). Sprite 인스턴스 체크 후 적용
        const anySprite = state.sprite as unknown as { skew?: { x: number; y: number } };
        if (anySprite.skew) {
          anySprite.skew.x = Math.sin(elapsed * state.tumbleSpeedX) * tumbleAmp;
          anySprite.skew.y = Math.cos(elapsed * state.tumbleSpeedY) * tumbleAmp;
        }

        // 알파 — 끝 12% 만 페이드 (블랙홀 안으로 사라지는 느낌)
        if (eased < 0.88) {
          state.sprite.alpha = 1;
        } else {
          state.sprite.alpha = Math.max(0, 1 - (eased - 0.88) / 0.12);
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
    // 흡입 완료 후 블랙홀 수축 + 임팩트 펄스 (살짝 커졌다 줄어듦)
    const startTime = performance.now();
    const startRadius = SUCTION.HOLE_RADIUS;
    const duration = 400;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      // 0~0.3: 펄스 확장 (1.0 → 1.4), 0.3~1.0: 급격히 수축 (1.4 → 0)
      let radiusMul: number;
      let alphaMul: number;
      if (t < 0.3) {
        const pt = t / 0.3;
        radiusMul = 1 + pt * 0.4;
        alphaMul = 1;
      } else {
        const ct = (t - 0.3) / 0.7;
        radiusMul = 1.4 * (1 - ct);
        alphaMul = 1 - ct;
      }
      this.hole.clear();
      this.hole.circle(0, 0, startRadius * radiusMul).fill({
        color: 0x000000,
        alpha: 0.9 * alphaMul,
      });

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this.visible = false;
        this.onCompleteCallback?.();
      }
    };
    animate();
  }

  private easeInCubic(t: number): number {
    return t * t * t;
  }

  onComplete(callback: () => void): void {
    this.onCompleteCallback = callback;
  }
}
