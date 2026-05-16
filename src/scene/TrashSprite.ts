import { Container, Graphics, Sprite, Texture, FederatedPointerEvent } from 'pixi.js';
import { ACTIVATION } from '../primitives/constants';
import { GlowEffect } from '../effects/GlowEffect';
import { audio, getClickSoundKey } from '../audio/SoundManager';
import { vibrate } from '../primitives/haptic';
import type { TrashItem } from '../primitives/types';

/**
 * 쓰레기 스프라이트 — 클릭으로 활성화
 * 활성화 시: 점프 + 글로우
 */
export class TrashSprite extends Container {
  public readonly data: TrashItem;
  private sprite: Sprite | Graphics;
  private glow: GlowEffect;
  private originalY: number;
  private isAnimating = false;
  private onActivatedCallback?: () => void;

  /**
   * 원본 텍스처 반환 (편집 모드 복사 시 사용)
   */
  getTexture(): Texture | undefined {
    if (this.sprite instanceof Sprite) {
      return (this.sprite as Sprite).texture;
    }
    return undefined;
  }

  constructor(data: TrashItem, texture?: Texture) {
    super();
    this.data = data;
    this.position.set(data.position.x, data.position.y);
    this.originalY = data.position.y;
    if (data.rotation) this.rotation = data.rotation;

    // 텍스처 있으면 스프라이트, 없으면 플레이스홀더 (PoC)
    if (texture) {
      this.sprite = new Sprite(texture);
      this.sprite.anchor.set(0.5);
      // 원본 비율 유지 — 데이터 size 는 "타겟 최대 크기"로 사용
      const texW = texture.width;
      const texH = texture.height;
      const targetMax = Math.max(data.size.width, data.size.height);
      const naturalMax = Math.max(texW, texH);
      const scale = targetMax / naturalMax;
      this.sprite.width = texW * scale;
      this.sprite.height = texH * scale;
      // 실제 표시 크기를 데이터에 반영 (편집 모드 export 정확하게)
      data.size.width = Math.round(texW * scale);
      data.size.height = Math.round(texH * scale);
    } else {
      // PoC 플레이스홀더: 회색 박스 + 라벨
      this.sprite = new Graphics()
        .roundRect(-data.size.width / 2, -data.size.height / 2, data.size.width, data.size.height, 8)
        .fill({ color: 0x888888 })
        .stroke({ color: 0x444444, width: 2 });
    }

    this.glow = new GlowEffect(data.size.width, data.size.height);

    this.addChild(this.glow);
    this.addChild(this.sprite as Container);

    // 숨은 쓰레기는 처음에 숨김
    this.visible = !data.isHidden;

    // 인터랙티브 설정
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointertap', this.handleTap, this);
    // 편집 모드용 핸들러 (E 키 토글 시 활성화)
    this.on('pointerdown', this.handleEditDragStart, this);
    this.on('globalpointermove', this.handleEditDragMove, this);
    this.on('pointerup', this.handleEditDragEnd, this);
    this.on('pointerupoutside', this.handleEditDragEnd, this);

    // hitArea를 실제 표시 크기 + 8px 여유로 설정 (모바일 친화적)
    const pad = 8;
    const hitW = data.size.width;
    const hitH = data.size.height;
    this.hitArea = {
      contains: (x: number, y: number): boolean => {
        return (
          x >= -hitW / 2 - pad &&
          x <= hitW / 2 + pad &&
          y >= -hitH / 2 - pad &&
          y <= hitH / 2 + pad
        );
      },
    };
  }

  private handleTap(): void {
    if (this.editMode) return; // 편집 모드에선 클릭=드래그
    if (this.data.isActivated || this.isAnimating) return;
    this.activate();
  }

  activate(): void {
    if (this.data.isActivated) return;
    this.data.isActivated = true;
    this.isAnimating = true;

    // 사운드 (사물 종류별 자동 선택)
    audio.play(getClickSoundKey(this.data.id));
    // 모바일 햅틱 — 짧은 진동 (사물 클릭 피드백)
    vibrate(25);

    // 점프 + 글로우
    this.glow.show();
    this.animateJump();

    // 콜백
    this.onActivatedCallback?.();
  }

  private animateJump(): void {
    const startTime = performance.now();
    const duration = 300; // ms
    const jumpHeight = ACTIVATION.JUMP_HEIGHT;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      // 포물선 점프
      const offset = -jumpHeight * Math.sin(t * Math.PI);
      this.y = this.originalY + offset;

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this.y = this.originalY;
        this.isAnimating = false;
        this.showActivatedState();
      }
    };
    animate();
  }

  /**
   * 활성화 후 영구 시각 표시
   * - 반투명 (곧 빨려갈 것 같은 느낌)
   * - 부드러운 오렌지 글로우 잔존
   */
  private showActivatedState(): void {
    // 사물 alpha 페이드: 1.0 → 0.4
    const startSpriteAlpha = (this.sprite as Container).alpha;
    const targetSpriteAlpha = 0.4;
    const startTime = performance.now();
    const duration = 400;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      (this.sprite as Container).alpha = startSpriteAlpha + (targetSpriteAlpha - startSpriteAlpha) * t;

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();

    // 글로우 영구 잔존 (희미하게)
    this.glow.fadeToPersistent(0.35);
  }

  reveal(): void {
    if (this.visible) return;
    this.visible = true;
    this.alpha = 0;

    const startTime = performance.now();
    const duration = 400;
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      this.alpha = t;

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  onActivated(callback: () => void): void {
    this.onActivatedCallback = callback;
  }

  // ===== 편집 모드 (E 키 토글) =====
  private editMode = false;
  private editDragging = false;
  private editDragOffset: { x: number; y: number } | null = null;

  setEditMode(enabled: boolean): void {
    this.editMode = enabled;
    if (enabled) {
      this.eventMode = 'static'; // 활성화 상태 무관하게 클릭 가능
      this.cursor = 'move';
      // 편집 모드 시각 단서 (살짝 어두운 보더)
      this.alpha = this.data.isActivated ? 0.6 : 1;
    } else {
      this.cursor = 'pointer';
      this.editDragging = false;
    }
  }

  private handleEditDragStart(e: FederatedPointerEvent): void {
    if (!this.editMode) return;
    this.editDragging = true;
    this.editDragOffset = {
      x: e.global.x - this.x,
      y: e.global.y - this.y,
    };
    this.alpha = 0.7;
    // z-order 최상위 (다른 사물 위로 올라옴)
    if (this.parent) {
      this.parent.setChildIndex(this, this.parent.children.length - 1);
    }
  }

  private handleEditDragMove(e: FederatedPointerEvent): void {
    if (!this.editMode || !this.editDragging || !this.editDragOffset) return;
    this.x = e.global.x - this.editDragOffset.x;
    this.y = e.global.y - this.editDragOffset.y;
    // 데이터에도 반영
    this.data.position.x = this.x;
    this.data.position.y = this.y;
  }

  private handleEditDragEnd(): void {
    if (!this.editMode) return;
    this.editDragging = false;
    this.alpha = 1;
    this.editDragOffset = null;
  }

  /**
   * 편집 모드에서 마우스 스크롤로 사이즈 조절
   * 스크롤 위 → 커짐 / 스크롤 아래 → 작아짐
   */
  resizeBy(factor: number): void {
    const newW = Math.max(10, this.data.size.width * factor);
    const newH = Math.max(10, this.data.size.height * factor);
    this.data.size.width = newW;
    this.data.size.height = newH;

    // 스프라이트 크기 갱신 (비율 유지)
    if (this.sprite instanceof Sprite && (this.sprite as Sprite).texture) {
      const sprite = this.sprite as Sprite;
      const texW = sprite.texture.width;
      const texH = sprite.texture.height;
      const targetMax = Math.max(newW, newH);
      const naturalMax = Math.max(texW, texH);
      const scale = targetMax / naturalMax;
      sprite.width = texW * scale;
      sprite.height = texH * scale;
      this.data.size.width = Math.round(texW * scale);
      this.data.size.height = Math.round(texH * scale);
    }
  }

  /**
   * 마우스가 이 스프라이트 위에 있는지 체크 (스크롤 리사이즈용)
   */
  isPointerOver(globalX: number, globalY: number): boolean {
    const localX = globalX - this.x;
    const localY = globalY - this.y;
    return (
      Math.abs(localX) < this.data.size.width / 2 &&
      Math.abs(localY) < this.data.size.height / 2
    );
  }
}
