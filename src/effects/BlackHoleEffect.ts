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

    // 흡입 애니메이션 메인 루프
    const animate = () => {
      const elapsed = performance.now() - startTime;
      let allDone = true;

      for (const state of targetStates) {
        const localElapsed = elapsed - state.delay;
        if (localElapsed < 0) {
          allDone = false;
          continue;
        }
        const duration = 1300;
        const t = Math.min(localElapsed / duration, 1);
        if (t < 1) allDone = false;

        // 스파이럴 곡선 경로 — easeInCubic 가속
        const eased = this.easeInCubic(t);
        const dx = this.targetX - state.startX;
        const dy = this.targetY - state.startY;
        const controlX = state.startX + dx * 0.5;
        const controlY = state.startY + dy * 0.5 - 120;

        const mt = 1 - eased;
        const newX = mt * mt * state.startX + 2 * mt * eased * controlX + eased * eased * this.targetX;
        const newY = mt * mt * state.startY + 2 * mt * eased * controlY + eased * eased * this.targetY;

        state.sprite.x = newX;
        state.sprite.y = newY;

        // 스케일: 끝까지 거의 그대로 보이게 (마지막 15%에서만 수축)
        let scaleFactor: number;
        if (eased < 0.85) {
          scaleFactor = 1 - eased * 0.2;
        } else {
          const lateT = (eased - 0.85) / 0.15;
          scaleFactor = 0.83 * (1 - lateT);
        }
        state.sprite.scale.set(state.startScale * scaleFactor);

        // 회전 6π = 3바퀴
        state.sprite.rotation = state.startRotation + eased * Math.PI * 6;

        // 알파: 끝까지 1.0 → 마지막 10%만 페이드
        if (eased < 0.9) {
          state.sprite.alpha = 1;
        } else {
          state.sprite.alpha = Math.max(0, 1 - (eased - 0.9) * 10);
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
