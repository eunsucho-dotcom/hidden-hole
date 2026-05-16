import { Container, Graphics } from 'pixi.js';

/**
 * 입 벌릴 때 주변에 팡! 하고 터지는 흰 구름 파티클 효과
 *
 * 구조:
 *   - 메인 클러스터: 큰 흰 블롭 6~7개 (입 주변 푹신한 구름)
 *   - 디브리: 작은 흰 블롭 10개 (튀어나가는 스파클)
 *
 * 각 파티클: 빠르게 퍼지며 pop → 약간 떠 있다가 fade out
 * 전체 지속: ~450ms
 */
export class MouthPoofEffect extends Container {
  private particles: Array<{
    graphics: Graphics;
    angle: number;
    distance: number;
    delay: number;
    lifespan: number;
  }> = [];
  private startTime: number = performance.now();
  private rafId?: number;

  constructor(scale: number = 1) {
    super();

    // 메인 클러스터 — 큰 블롭 (입 주변 푹신한 구름)
    const mainCount = 7;
    for (let i = 0; i < mainCount; i++) {
      const angle = (Math.PI * 2 * i) / mainCount + (Math.random() - 0.5) * 0.35;
      const distance = (15 + Math.random() * 28) * scale;
      const size = (30 + Math.random() * 22) * scale;
      this.spawnParticle(angle, distance, size, i * 12, 380);
    }

    // 디브리 — 작은 블롭 (튀어나가는 스파클)
    const debrisCount = 10;
    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = (55 + Math.random() * 70) * scale;
      const size = (5 + Math.random() * 11) * scale;
      this.spawnParticle(angle, distance, size, 90 + i * 18, 340);
    }

    this.animate();
  }

  private spawnParticle(angle: number, distance: number, size: number, delay: number, lifespan: number): void {
    const g = new Graphics();
    g.ellipse(0, 0, size, size * 0.88).fill({ color: 0xffffff });
    g.alpha = 0;
    this.addChild(g);
    this.particles.push({ graphics: g, angle, distance, delay, lifespan });
  }

  private animate = (): void => {
    const elapsed = performance.now() - this.startTime;
    let allDone = true;

    for (const p of this.particles) {
      const t = (elapsed - p.delay) / p.lifespan;
      if (t < 0) {
        p.graphics.alpha = 0;
        allDone = false;
      } else if (t >= 1) {
        p.graphics.alpha = 0;
      } else {
        allDone = false;
        // 위치 — 빠르게 퍼지고 멈춤 (easeOutQuad)
        const posT = Math.min(t * 1.6, 1);
        const posEased = 1 - (1 - posT) * (1 - posT);
        p.graphics.x = Math.cos(p.angle) * p.distance * posEased;
        p.graphics.y = Math.sin(p.angle) * p.distance * posEased;
        // pop scale: 0→1.0 (0~0.18) → 1.1 (0.18~0.45) → 0.55 (0.45~1)
        let scl: number;
        if (t < 0.18) scl = (t / 0.18) * 1.0;
        else if (t < 0.45) scl = 1.0 + ((t - 0.18) / 0.27) * 0.1;
        else scl = 1.1 - ((t - 0.45) / 0.55) * 0.55;
        p.graphics.scale.set(scl);
        // 알파: 빠르게 등장 후 천천히 fade
        p.graphics.alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
      }
    }

    if (allDone) {
      if (this.parent) this.parent.removeChild(this);
      this.destroy({ children: true });
    } else {
      this.rafId = requestAnimationFrame(this.animate);
    }
  };
}
