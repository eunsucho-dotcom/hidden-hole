import { Container, Graphics, Sprite, Texture, FederatedPointerEvent, Text } from 'pixi.js';
import { ACTIVATION } from '../primitives/constants';
import { audio } from '../audio/SoundManager';
import type { InteractiveObject } from '../primitives/types';

/**
 * 인터랙티브 오브젝트 (드래그/들기/스와이프/탭)
 * 조작 시 Before → After 변환 + 숨은 쓰레기 노출
 */
export class InteractiveSprite extends Container {
  public readonly data: InteractiveObject;
  private spriteBefore: Sprite | Graphics;
  private spriteAfter: Sprite | Graphics;
  private idleTime = 0;
  private isDragging = false;
  private dragStart: { x: number; y: number } | null = null;
  private originalPosition: { x: number; y: number };
  private onInteractedCallback?: () => void;
  private locked = true;

  constructor(
    data: InteractiveObject,
    textureBefore?: Texture,
    textureAfter?: Texture
  ) {
    super();
    this.data = data;
    this.position.set(data.position.x, data.position.y);
    this.originalPosition = { ...data.position };

    // Before 스프라이트 — 비율 유지 + 데이터 size 기준 스케일
    if (textureBefore) {
      this.spriteBefore = new Sprite(textureBefore);
      (this.spriteBefore as Sprite).anchor.set(0.5);
      const texW = textureBefore.width;
      const texH = textureBefore.height;
      const targetMax = Math.max(data.size.width, data.size.height);
      const naturalMax = Math.max(texW, texH);
      const scale = targetMax / naturalMax;
      this.spriteBefore.width = texW * scale;
      this.spriteBefore.height = texH * scale;
      data.size.width = Math.round(texW * scale);
      data.size.height = Math.round(texH * scale);
    } else {
      this.spriteBefore = new Graphics()
        .roundRect(-data.size.width / 2, -data.size.height / 2, data.size.width, data.size.height, 12)
        .fill({ color: 0xa0a0d0 })
        .stroke({ color: 0x6060a0, width: 3 });
    }

    // After 스프라이트 — 동일 처리
    if (textureAfter) {
      this.spriteAfter = new Sprite(textureAfter);
      (this.spriteAfter as Sprite).anchor.set(0.5);
      const texW = textureAfter.width;
      const texH = textureAfter.height;
      const targetMax = Math.max(data.size.width, data.size.height);
      const naturalMax = Math.max(texW, texH);
      const scale = targetMax / naturalMax;
      this.spriteAfter.width = texW * scale;
      this.spriteAfter.height = texH * scale;
    } else {
      this.spriteAfter = new Graphics()
        .roundRect(-data.size.width / 2, -data.size.height / 2, data.size.width, data.size.height, 12)
        .fill({ color: 0x60d060 })
        .stroke({ color: 0x309030, width: 3 });
    }

    this.spriteAfter.visible = false;
    this.addChild(this.spriteBefore as Container);
    this.addChild(this.spriteAfter as Container);

    // 인터랙션 설정 — 초기엔 잠금 (모든 visible 카테고리 깬 후 순차적 unlock)
    this.eventMode = 'none';
    this.cursor = 'default';
    this.locked = true;
    this.setupInteraction();

    // 편집 모드용 핸들러 (E 키 누르면 활성화)
    this.on('pointerdown', this.handleEditDown, this);
    this.on('globalpointermove', this.handleEditMove, this);
    this.on('pointerup', this.handleEditUp, this);
    this.on('pointerupoutside', this.handleEditUp, this);
  }

  private setupInteraction(): void {
    switch (this.data.interactionType) {
      case 'drag':
        this.on('pointerdown', this.handleDragStart, this);
        // globalpointermove: 포인터가 객체 밖으로 나가도 move 이벤트 계속 수신
        this.on('globalpointermove', this.handleDragMove, this);
        this.on('pointerup', this.handleDragEnd, this);
        this.on('pointerupoutside', this.handleDragEnd, this);
        break;
      case 'tap':
        this.on('pointertap', this.handleTap, this);
        break;
      case 'lift':
        // 길게 누름 (탭 홀드)
        this.on('pointerdown', this.handleLiftStart, this);
        break;
      case 'swipe':
        this.on('pointerdown', this.handleSwipeStart, this);
        this.on('globalpointermove', this.handleSwipeMove, this);
        this.on('pointerup', this.handleSwipeEnd, this);
        this.on('pointerupoutside', this.handleSwipeEnd, this);
        break;
    }
  }

  // ===== Drag =====
  private handleDragStart(e: FederatedPointerEvent): void {
    if (this.data.isInteracted) return;
    this.isDragging = true;
    this.dragStart = { x: e.global.x - this.x, y: e.global.y - this.y };
    this.cursor = 'grabbing';
    this.alpha = 0.8;
    audio.play('drag_start');
  }

  private handleDragMove(e: FederatedPointerEvent): void {
    if (!this.isDragging || !this.dragStart) return;
    this.x = e.global.x - this.dragStart.x;
    this.y = e.global.y - this.dragStart.y;
  }

  private handleDragEnd(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.cursor = 'grab';
    this.alpha = 1;

    // 목표 위치에 충분히 가까우면 인터랙션 완료
    if (this.data.targetPosition) {
      const dx = this.x - this.data.targetPosition.x;
      const dy = this.y - this.data.targetPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      // 더 관대한 임계값 (50% — 모바일 친화적)
      const threshold = Math.max(this.data.size.width, this.data.size.height) * 0.5;

      console.log(`[Drag] distance=${distance.toFixed(0)}, threshold=${threshold.toFixed(0)}`);

      if (distance < threshold) {
        this.x = this.data.targetPosition.x;
        this.y = this.data.targetPosition.y;
        this.complete();
      } else {
        // 원위치로 부드럽게 복귀
        this.animateBackToOriginal();
      }
    } else {
      this.complete();
    }
  }

  private animateBackToOriginal(): void {
    const startX = this.x;
    const startY = this.y;
    const startTime = performance.now();
    const duration = 300;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      this.x = startX + (this.originalPosition.x - startX) * eased;
      this.y = startY + (this.originalPosition.y - startY) * eased;

      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * 인터랙션 완료 시 target 위치로 부드럽게 이동 (lift/swipe/tap용)
   */
  private animateToTarget(): void {
    if (!this.data.targetPosition) return;
    const startX = this.x;
    const startY = this.y;
    const targetX = this.data.targetPosition.x;
    const targetY = this.data.targetPosition.y;
    const startTime = performance.now();
    const duration = 500;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      this.x = startX + (targetX - startX) * eased;
      this.y = startY + (targetY - startY) * eased;

      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }

  // ===== Tap =====
  private handleTap(): void {
    if (this.data.isInteracted || this.locked) return;
    this.complete();
  }

  /**
   * 인터랙션 잠금 해제 — 모든 보이는 카테고리가 정리된 후 호출
   */
  unlock(): void {
    if (!this.locked) return;
    this.locked = false;
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  // ===== Lift (꾹 누름) =====
  private liftStartTime = 0;
  private isLifting = false;
  private readonly LIFT_HOLD_MS = 600;
  private readonly LIFT_RISE_PX = 60;

  private handleLiftStart(): void {
    if (this.data.isInteracted) return;
    this.isLifting = true;
    this.liftStartTime = performance.now();
    this.alpha = 0.95;
    audio.play('drag_start');
    this.animateLifting();

    // 글로벌 pointerup 리스너 (중간에 손 떼면 취소)
    this.on('pointerup', this.handleLiftCancel, this);
    this.on('pointerupoutside', this.handleLiftCancel, this);
    this.on('globalpointermove', this.handleLiftMove, this);
  }

  private handleLiftMove(): void {
    // 손 가락이 이동해도 lift는 유지 (잡고 있는 동안)
  }

  private animateLifting(): void {
    if (!this.isLifting) return;
    const elapsed = performance.now() - this.liftStartTime;
    const t = Math.min(elapsed / this.LIFT_HOLD_MS, 1);

    // 점점 위로 올라감 (시각 피드백)
    this.y = this.originalPosition.y - this.LIFT_RISE_PX * t;

    if (t >= 1) {
      // 완전히 들림 → 인터랙션 완료
      this.isLifting = false;
      this.off('pointerup', this.handleLiftCancel, this);
      this.off('pointerupoutside', this.handleLiftCancel, this);
      this.off('globalpointermove', this.handleLiftMove, this);
      this.alpha = 1;
      this.complete();
    } else {
      requestAnimationFrame(() => this.animateLifting());
    }
  }

  private handleLiftCancel(): void {
    if (!this.isLifting) return;
    this.isLifting = false;
    this.off('pointerup', this.handleLiftCancel, this);
    this.off('pointerupoutside', this.handleLiftCancel, this);
    this.off('globalpointermove', this.handleLiftMove, this);
    this.alpha = 1;
    // 원위치로 부드럽게 복귀
    this.animateBackToOriginal();
  }

  // ===== Swipe =====
  private swipeStart: { x: number; y: number } | null = null;
  private handleSwipeStart(e: FederatedPointerEvent): void {
    if (this.data.isInteracted) return;
    this.swipeStart = { x: e.global.x, y: e.global.y };
  }
  private handleSwipeMove(e: FederatedPointerEvent): void {
    if (!this.swipeStart) return;
    const dx = e.global.x - this.swipeStart.x;
    // 스와이프 시각화: 살짝 이동
    this.x = this.originalPosition.x + dx * 0.3;
  }
  private handleSwipeEnd(e: FederatedPointerEvent): void {
    if (!this.swipeStart) return;
    const dx = e.global.x - this.swipeStart.x;
    const threshold = this.data.size.width * 0.5;

    if (Math.abs(dx) > threshold) {
      this.complete();
    } else {
      this.animateBackToOriginal();
    }
    this.swipeStart = null;
  }

  // ===== 공통: 인터랙션 완료 =====
  private complete(): void {
    if (this.data.isInteracted) return;
    this.data.isInteracted = true;
    this.cursor = 'default';
    this.eventMode = 'none';

    // 인터랙션 타입별 완료 사운드
    switch (this.data.interactionType) {
      case 'drag':
        audio.play('drag_complete');
        break;
      case 'lift':
        audio.play('lift');
        break;
      case 'swipe':
        audio.play('swipe');
        break;
      case 'tap':
        audio.play('pop');
        break;
    }

    // lift/swipe/tap의 경우, targetPosition 있으면 그 위치로 자동 이동
    if (this.data.interactionType !== 'drag' && this.data.targetPosition) {
      this.animateToTarget();
    }

    // 인터랙션 완료 후 페이드 — 쓰레기와 동일한 시각 처리
    setTimeout(() => this.fadeToActivatedState(), 500);

    // Before → After 페이드 전환
    const startTime = performance.now();
    const duration = 400;
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      (this.spriteBefore as Container).alpha = 1 - t;
      if (t > 0.3) {
        this.spriteAfter.visible = true;
        (this.spriteAfter as Container).alpha = (t - 0.3) / 0.7;
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        (this.spriteBefore as Container).visible = false;
      }
    };
    animate();

    this.onInteractedCallback?.();
  }

  // 인터랙티브는 정적 — idle 흔들림 없음 (배경 장식처럼 보이도록)
  updateIdle(_deltaMs: number): void {
    /* no-op */
  }

  /**
   * 인터랙션 후 페이드 — 쓰레기 활성화 상태와 동일하게 반투명 처리
   * (Before → After 전환 완료 후 호출)
   */
  private fadeToActivatedState(): void {
    const startAlpha = (this.spriteAfter as Container).alpha;
    const targetAlpha = 0.4;
    const startTime = performance.now();
    const duration = 500;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const currentAlpha = startAlpha + (targetAlpha - startAlpha) * t;
      (this.spriteAfter as Container).alpha = currentAlpha;

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  onInteracted(callback: () => void): void {
    this.onInteractedCallback = callback;
  }

  // ===== 편집 모드 =====
  private editMode = false;
  private editDragging = false;
  private editDragOffset: { x: number; y: number } | null = null;

  setEditMode(enabled: boolean): void {
    this.editMode = enabled;
    if (enabled) {
      this.eventMode = 'static';
      this.cursor = 'move';
      this.alpha = 1;
    } else {
      this.cursor = 'grab';
      this.editDragging = false;
    }
  }

  private handleEditDown(e: FederatedPointerEvent): void {
    if (!this.editMode) return;
    this.editDragging = true;
    this.editDragOffset = {
      x: e.global.x - this.x,
      y: e.global.y - this.y,
    };
    this.alpha = 0.7;
    if (this.parent) {
      this.parent.setChildIndex(this, this.parent.children.length - 1);
    }
  }

  private handleEditMove(e: FederatedPointerEvent): void {
    if (!this.editMode || !this.editDragging || !this.editDragOffset) return;
    this.x = e.global.x - this.editDragOffset.x;
    this.y = e.global.y - this.editDragOffset.y;
    this.data.position.x = this.x;
    this.data.position.y = this.y;
    this.originalPosition.x = this.x;
    this.originalPosition.y = this.y;
  }

  private handleEditUp(): void {
    if (!this.editMode) return;
    this.editDragging = false;
    this.alpha = 1;
    this.editDragOffset = null;
  }

  /**
   * 편집 모드에서 마우스 스크롤로 사이즈 조절
   */
  resizeBy(factor: number): void {
    const newW = Math.max(20, this.data.size.width * factor);
    const newH = Math.max(20, this.data.size.height * factor);
    this.data.size.width = newW;
    this.data.size.height = newH;

    // Before/After 스프라이트 갱신 (비율 유지)
    const updateSpriteSize = (s: Sprite | Graphics) => {
      if (s instanceof Sprite && s.texture) {
        const texW = s.texture.width;
        const texH = s.texture.height;
        const targetMax = Math.max(newW, newH);
        const naturalMax = Math.max(texW, texH);
        const scale = targetMax / naturalMax;
        s.width = texW * scale;
        s.height = texH * scale;
        this.data.size.width = Math.round(texW * scale);
        this.data.size.height = Math.round(texH * scale);
      }
    };
    updateSpriteSize(this.spriteBefore as any);
    updateSpriteSize(this.spriteAfter as any);
  }

  isPointerOver(globalX: number, globalY: number): boolean {
    const localX = globalX - this.x;
    const localY = globalY - this.y;
    return (
      Math.abs(localX) < this.data.size.width / 2 &&
      Math.abs(localY) < this.data.size.height / 2
    );
  }
}
