import { Container, Graphics, Text, Sprite, Texture, Assets, FederatedWheelEvent } from 'pixi.js';
import {
  LEFT_PANEL_WIDTH,
  GAME_HEIGHT,
  ITEM_SLOT_SIZE,
  ITEM_SLOT_GAP,
  PANEL_SCROLL_TOP,
  SLOT_TOP_PADDING,
  COLORS,
} from '../primitives/constants';

// ====== 사용자 조절 가능한 슬롯 디자인 파라미터 ======
// 아이콘 크기 비율 (0.4 ~ 0.85 추천). 키울수록 카운터 숫자와 가까워짐
const ICON_SIZE_RATIO = 0.66;
// 피자(가로로 긴) 카테고리만 따로 크게
const ICON_SIZE_RATIO_PIZZA = 0.85;
// 카운터 숫자 폰트 사이즈 (이전 18 → 36으로 2배)
const COUNTER_FONT_SIZE = 36;
// 카운터 숫자가 슬롯 하단에서 얼마나 위에 위치할지
const COUNTER_Y_OFFSET = 24;
// 폰트 패밀리 (Google Font 사용 가능 — index.html에 link 추가 후 이름만 변경)
const FONT_FAMILY = 'ARLRDBD, system-ui, sans-serif';
// ====================================================

export interface CategoryInfo {
  category: string;
  label?: string;
  emoji?: string;
  total: number;
  hasHidden: boolean;
  allHidden: boolean;
  texture?: Texture;
}

type SlotState = 'locked' | 'active' | 'complete';

/**
 * 좌측 카테고리 패널 — 흰 배경, 1열, 세로 스크롤
 *
 * 상태 흐름:
 *   [LOCKED] 🔒 → [ACTIVE] 🟠 → [COMPLETE] ✓
 */
export class LeftPanel extends Container {
  private slots = new Map<string, CategorySlot>();
  private orderedCategories: string[] = [];
  private slotsContainer: Container;
  private backgroundPanel: Graphics;
  private scrollMask: Graphics;
  private scrollY = 0;
  private maxScrollY = 0;
  private viewportHeight = 0;
  private onCategoryActivatedCallback?: (category: string) => void;

  constructor(allCategories: CategoryInfo[], bgColor: number = 0xefb63a) {
    super();

    // 패널 배경 — 씬 가장자리 색과 동일 (기본 노란, lv3 = 초록 등)
    this.backgroundPanel = new Graphics()
      .rect(0, 0, LEFT_PANEL_WIDTH, GAME_HEIGHT)
      .fill({ color: bgColor });
    this.addChild(this.backgroundPanel);

    // 슬롯 컨테이너 (스크롤됨)
    this.slotsContainer = new Container();
    // 30px 우측 이동 (panel 폭 240 확보로 1.2x active 슬롯도 잘림 없음)
    this.slotsContainer.position.set(8, PANEL_SCROLL_TOP);
    this.addChild(this.slotsContainer);

    // 슬롯 영역 마스크 — 잘려서 반만 보이는 슬롯이 없도록 정수 슬롯만큼만 표시
    // viewport = SLOT_TOP_PADDING + N * slotRow - GAP + 1.26x active 슬롯 여유(24px)
    const slotRow = ITEM_SLOT_SIZE + ITEM_SLOT_GAP;
    const available = GAME_HEIGHT - PANEL_SCROLL_TOP - SLOT_TOP_PADDING + ITEM_SLOT_GAP;
    const fullSlotsVisible = Math.floor(available / slotRow);
    this.viewportHeight = SLOT_TOP_PADDING + fullSlotsVisible * slotRow - ITEM_SLOT_GAP + 24;
    // 글로우 효과 제거 후 마스크는 패널 폭 그대로
    this.scrollMask = new Graphics()
      .rect(0, PANEL_SCROLL_TOP, LEFT_PANEL_WIDTH, this.viewportHeight)
      .fill({ color: 0xffffff });
    this.addChild(this.scrollMask);
    this.slotsContainer.mask = this.scrollMask;

    // 마우스 휠 스크롤 + 터치 드래그 스크롤
    this.eventMode = 'static';
    this.on('wheel', this.handleWheel, this);
    this.setupTouchScroll();
    // hitArea로 패널 영역에서만 휠/터치 캐치
    this.hitArea = {
      contains: (x: number, y: number) =>
        x >= 0 && x <= LEFT_PANEL_WIDTH && y >= 0 && y <= GAME_HEIGHT,
    };

    // 초기 표시: allHidden이 아닌 카테고리만
    const initialVisible = allCategories.filter((c) => !c.allHidden);
    for (const cat of initialVisible) {
      this.addSlot(cat);
    }

    this.updateMaxScroll();
    this.activateNext();
  }

  private addSlot(info: CategoryInfo): void {
    const idx = this.orderedCategories.length;
    const slot = new CategorySlot(info);

    // pivot을 중앙으로 → 1.2x 스케일이 가운데 기준으로 커짐 (좌우 잘림 방지)
    slot.pivot.set(ITEM_SLOT_SIZE / 2, ITEM_SLOT_SIZE / 2);
    const cx = LEFT_PANEL_WIDTH / 2;
    const cy = SLOT_TOP_PADDING + idx * (ITEM_SLOT_SIZE + ITEM_SLOT_GAP) + ITEM_SLOT_SIZE / 2;
    slot.position.set(cx, cy);

    this.slotsContainer.addChild(slot);
    this.slots.set(info.category, slot);
    this.orderedCategories.push(info.category);
  }

  private updateMaxScroll(): void {
    const slotRow = ITEM_SLOT_SIZE + ITEM_SLOT_GAP;
    const contentHeight = SLOT_TOP_PADDING + this.orderedCategories.length * slotRow;
    this.maxScrollY = Math.max(0, contentHeight - this.viewportHeight);
  }

  private handleWheel(e: FederatedWheelEvent): void {
    // 슬롯 단위 스냅 — 휠 1틱당 1개 슬롯씩 이동 (잘림 방지)
    const slotRow = ITEM_SLOT_SIZE + ITEM_SLOT_GAP;
    const direction = e.deltaY > 0 ? 1 : -1;
    const target = Math.round(this.scrollY / slotRow) + direction;
    this.scrollY = Math.max(0, Math.min(this.maxScrollY, target * slotRow));
    this.slotsContainer.y = PANEL_SCROLL_TOP - this.scrollY;
    e.preventDefault?.();
  }

  /** 터치/마우스 드래그 스크롤 — 모바일 대응 */
  private setupTouchScroll(): void {
    let dragging = false;
    let dragStartY = 0;
    let scrollStartY = 0;

    this.on('pointerdown', (e) => {
      // 슬롯 클릭이면 스크롤 시작 안 함 (slot 의 click 처리 우선)
      dragging = true;
      dragStartY = e.global.y;
      scrollStartY = this.scrollY;
    });

    this.on('globalpointermove', (e) => {
      if (!dragging) return;
      const deltaY = dragStartY - e.global.y;
      this.scrollY = Math.max(0, Math.min(this.maxScrollY, scrollStartY + deltaY));
      this.slotsContainer.y = PANEL_SCROLL_TOP - this.scrollY;
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      // 슬롯 단위로 스냅
      const slotRow = ITEM_SLOT_SIZE + ITEM_SLOT_GAP;
      const snapped = Math.round(this.scrollY / slotRow) * slotRow;
      const target = Math.max(0, Math.min(this.maxScrollY, snapped));
      this.animateScrollTo(target);
    };
    this.on('pointerup', endDrag);
    this.on('pointerupoutside', endDrag);
  }

  /**
   * 숨은 카테고리 노출 — ? 슬롯이 있으면 변환, 없으면 새로 추가
   */
  revealHiddenCategory(info: CategoryInfo): void {
    const existing = this.slots.get(info.category);
    if (existing && existing.isMystery()) {
      // ? 슬롯을 실제 카테고리로 변환
      existing.unmystify(info);
      this.activateNext();
      return;
    }
    if (existing) return;

    this.addSlot(info);
    this.updateMaxScroll();

    const slot = this.slots.get(info.category)!;
    slot.scale.set(0);
    const startTime = performance.now();
    const animate = () => {
      const t = Math.min((performance.now() - startTime) / 400, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      slot.scale.set(eased * 1.15 - eased * eased * 0.15);
      if (t < 1) requestAnimationFrame(animate);
      else slot.scale.set(1);
    };
    animate();
  }

  /**
   * ? mystery 슬롯 추가 — "여기 뭔가 더 있어, 찾아봐"
   * categoryId는 이후 revealHiddenCategory가 호출될 때 매칭됨
   * 자동으로 해당 슬롯 위치로 스크롤
   */
  addMysterySlot(categoryId: string): void {
    if (this.slots.has(categoryId)) return;
    const idx = this.orderedCategories.length;
    const info: CategoryInfo = {
      category: categoryId,
      total: 1,
      hasHidden: false,
      allHidden: false,
    };
    const slot = new CategorySlot(info, true);

    slot.pivot.set(ITEM_SLOT_SIZE / 2, ITEM_SLOT_SIZE / 2);
    const cx = LEFT_PANEL_WIDTH / 2;
    const cy = SLOT_TOP_PADDING + idx * (ITEM_SLOT_SIZE + ITEM_SLOT_GAP) + ITEM_SLOT_SIZE / 2;
    slot.position.set(cx, cy);
    this.slotsContainer.addChild(slot);
    this.slots.set(categoryId, slot);
    this.orderedCategories.push(categoryId);

    this.updateMaxScroll();

    // 새 ? 슬롯이 화면에 보이도록 자동 스크롤
    this.scrollToSlot(slot);

    // 등장 + 진동(살랑살랑) 애니메이션
    slot.scale.set(0);
    const startTime = performance.now();
    const animate = () => {
      const t = Math.min((performance.now() - startTime) / 400, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      slot.scale.set(eased * 1.15 - eased * eased * 0.15);
      if (t < 1) requestAnimationFrame(animate);
      else slot.scale.set(1);
    };
    animate();
  }

  incrementCategory(category: string): boolean {
    const slot = this.slots.get(category);
    if (slot) return slot.increment();
    return false;
  }

  setSlotTexture(category: string, texture: Texture): void {
    const slot = this.slots.get(category);
    if (slot) slot.setIconTexture(texture);
  }

  activateNext(): string | null {
    for (const [catId, slot] of this.slots) {
      if (slot.getState() === 'active') return catId;
    }
    for (const catId of this.orderedCategories) {
      const slot = this.slots.get(catId);
      if (slot && slot.getState() === 'locked') {
        slot.setActive();
        this.onCategoryActivatedCallback?.(catId);
        this.scrollToSlot(slot);
        return catId;
      }
    }
    return null;
  }

  /**
   * 활성 슬롯이 뷰포트에 보이도록 자동 스크롤
   */
  private scrollToSlot(slot: CategorySlot): void {
    // 슬롯 단위 스냅으로 스크롤 — 잘림 방지
    const slotRow = ITEM_SLOT_SIZE + ITEM_SLOT_GAP;
    const slotTopY = slot.y - ITEM_SLOT_SIZE / 2;
    // 화면 안에 이미 보이면 스크롤 안 함
    const visibleStart = this.scrollY + SLOT_TOP_PADDING;
    const visibleEnd = this.scrollY + this.viewportHeight - 24;
    if (slotTopY >= visibleStart && slotTopY + ITEM_SLOT_SIZE <= visibleEnd) return;
    // 슬롯 단위로 스냅된 스크롤 위치 계산
    const desired = slotTopY - SLOT_TOP_PADDING;
    const snapped = Math.round(desired / slotRow) * slotRow;
    const target = Math.max(0, Math.min(this.maxScrollY, snapped));
    this.animateScrollTo(target);
  }

  private animateScrollTo(target: number): void {
    const start = this.scrollY;
    const startTime = performance.now();
    const duration = 350;
    const animate = () => {
      const t = Math.min((performance.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      this.scrollY = start + (target - start) * eased;
      this.slotsContainer.y = PANEL_SCROLL_TOP - this.scrollY;
      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }

  getActiveCategory(): string | null {
    for (const [catId, slot] of this.slots) {
      if (slot.getState() === 'active') return catId;
    }
    return null;
  }

  /**
   * 현재 active 카테고리로 스크롤 (없으면 맨 위)
   */
  scrollToActive(): void {
    for (const [, slot] of this.slots) {
      if (slot.getState() === 'active') {
        this.scrollToSlot(slot);
        return;
      }
    }
    // active 없으면 맨 위로
    this.animateScrollTo(0);
  }

  flashCategory(category: string): void {
    const slot = this.slots.get(category);
    if (slot) slot.flashReveal();
  }

  onCategoryActivated(cb: (category: string) => void): void {
    this.onCategoryActivatedCallback = cb;
  }

}

/**
 * 카테고리 슬롯 (흰 카드 스타일)
 */
class CategorySlot extends Container {
  private bg: Graphics;
  private bgSprite?: Sprite;
  private activeRing?: Graphics;
  private iconContainer: Container;
  private icon: Text | Sprite;
  private counterText: Text;
  private lockBadge: Container;
  private hiddenBadge?: Text;
  private checkmark: Text;
  private mysteryMark?: Text;
  private info: CategoryInfo;
  private currentCount = 0;
  private state: SlotState = 'locked';
  private mystery: boolean = false;
  private mysteryPulseTime = 0;

  constructor(info: CategoryInfo, mystery: boolean = false) {
    super();
    this.info = info;
    this.mystery = mystery;

    // 슬롯 배경 — Graphics fallback + PNG sprite (비동기 로드)
    this.bg = new Graphics();
    this.addChild(this.bg);
    Assets.load('./images/icon_panel.png').then((tex: Texture) => {
      const sprite = new Sprite(tex);
      sprite.width = ITEM_SLOT_SIZE;
      sprite.height = ITEM_SLOT_SIZE;
      sprite.position.set(0, 0);
      this.bgSprite = sprite;
      // Graphics 대신 PNG 깔기 — 가장 아래로
      this.addChildAt(sprite, 0);
      this.bg.visible = false;
      this.applyStateVisual();
    }).catch(() => {});

    // 아이콘 컨테이너 (슬롯 정중앙)
    this.iconContainer = new Container();
    this.iconContainer.position.set(ITEM_SLOT_SIZE / 2, ITEM_SLOT_SIZE / 2);
    this.addChild(this.iconContainer);

    // 아이콘 — ICON_SIZE_RATIO 기반 크기 (피자만 별도)
    const ratio = info.category === 'pizza' ? ICON_SIZE_RATIO_PIZZA : ICON_SIZE_RATIO;
    const iconBox = ITEM_SLOT_SIZE * ratio;
    if (info.texture) {
      this.icon = new Sprite(info.texture);
      (this.icon as Sprite).anchor.set(0.5);
      const tex = info.texture;
      const naturalMax = Math.max(tex.width, tex.height);
      const scale = iconBox / naturalMax;
      (this.icon as Sprite).width = tex.width * scale;
      (this.icon as Sprite).height = tex.height * scale;
    } else {
      this.icon = new Text({
        text: info.emoji ?? '📦',
        style: { fontSize: iconBox * 0.7, fontFamily: FONT_FAMILY },
      });
      this.icon.anchor.set(0.5);
      // setIconTexture 가 곧 호출되면 그때까지 이모지 placeholder 숨김
      // (실제 PNG 가 들어오기 전 이모지가 잠깐 보였다가 바뀌는 깜빡임 방지)
      if (!mystery) this.iconContainer.alpha = 0;
    }
    this.iconContainer.addChild(this.icon);

    // 카운터 — 흰 텍스트 + 검정 1px stroke
    this.counterText = new Text({
      text: `0/${info.total}`,
      style: {
        fontSize: COUNTER_FONT_SIZE,
        fill: 0xffffff,
        fontWeight: 'normal',
        fontFamily: FONT_FAMILY,
        stroke: { color: 0x000000, width: 1 },
      },
    });
    this.counterText.anchor.set(0.5);
    this.counterText.position.set(ITEM_SLOT_SIZE / 2, ITEM_SLOT_SIZE - COUNTER_Y_OFFSET);
    this.addChild(this.counterText);

    // 잠금 배지 — 자물쇠 PNG (이모지 fallback)
    this.lockBadge = new Container();
    this.lockBadge.position.set(ITEM_SLOT_SIZE - 6, 6);
    const lockFallback = new Text({
      text: '🔒',
      style: { fontSize: 32 },
    });
    lockFallback.anchor.set(1, 0);
    this.lockBadge.addChild(lockFallback);
    Assets.load('./images/icon_lock.png').then((tex: Texture) => {
      this.lockBadge.removeChild(lockFallback);
      lockFallback.destroy();
      const lockSprite = new Sprite(tex);
      lockSprite.anchor.set(1, 0);
      const SIZE = 44;
      const scale = SIZE / Math.max(tex.width, tex.height);
      lockSprite.width = tex.width * scale;
      lockSprite.height = tex.height * scale;
      this.lockBadge.addChild(lockSprite);
    }).catch(() => {});
    this.addChild(this.lockBadge);

    // 숨은 아이템 배지
    if (info.hasHidden) {
      this.hiddenBadge = new Text({
        text: '🔍',
        style: { fontSize: 18 },
      });
      this.hiddenBadge.position.set(4, 4);
      this.addChild(this.hiddenBadge);
    }

    // 체크마크 (완료 시)
    this.checkmark = new Text({
      text: '✓',
      style: {
        fontSize: 70,
        fill: COLORS.SUNSET_ORANGE,
        fontWeight: 'bold',
        stroke: { color: 0xffffff, width: 4 },
      },
    });
    this.checkmark.anchor.set(0.5);
    this.checkmark.position.set(ITEM_SLOT_SIZE / 2, ITEM_SLOT_SIZE / 2);
    this.checkmark.visible = false;
    this.addChild(this.checkmark);

    // ? 미스터리 마크 (mystery 모드 전용)
    if (this.mystery) {
      this.mysteryMark = new Text({
        text: '?',
        style: {
          fontSize: 80,
          fill: COLORS.SUNSET_ORANGE,
          fontWeight: 'bold',
          stroke: { color: 0xffffff, width: 6 },
        },
      });
      this.mysteryMark.anchor.set(0.5);
      this.mysteryMark.position.set(ITEM_SLOT_SIZE / 2, ITEM_SLOT_SIZE / 2);
      this.addChild(this.mysteryMark);
      // 미스터리 모드 동안 아이콘·카운터·잠금 숨김
      this.iconContainer.visible = false;
      this.counterText.visible = false;
      this.lockBadge.visible = false;
      // 펄스 시작
      this.startMysteryPulse();
    }

    this.applyStateVisual();
  }

  isMystery(): boolean {
    return this.mystery;
  }

  /**
   * ? 마크 펄스 애니메이션 — RAF 루프
   */
  private startMysteryPulse(): void {
    const baseTime = performance.now();
    const pulse = () => {
      if (!this.mystery || !this.mysteryMark) return;
      const elapsed = performance.now() - baseTime;
      const phase = (elapsed / 700) * Math.PI * 2;
      const scale = 1 + Math.sin(phase) * 0.12;
      this.mysteryMark.scale.set(scale);
      requestAnimationFrame(pulse);
    };
    pulse();
  }

  /**
   * ? 미스터리 슬롯을 실제 카테고리 슬롯으로 변환
   */
  unmystify(newInfo: CategoryInfo): void {
    if (!this.mystery) return;
    this.mystery = false;
    this.info = newInfo;

    // ? 마크 제거
    if (this.mysteryMark) {
      this.removeChild(this.mysteryMark);
      this.mysteryMark.destroy();
      this.mysteryMark = undefined;
    }

    // 아이콘 갱신
    const iconBox = ITEM_SLOT_SIZE - 50;
    if (newInfo.texture) {
      this.iconContainer.removeChild(this.icon as Container);
      (this.icon as Container).destroy({ children: true });
      const sprite = new Sprite(newInfo.texture);
      sprite.anchor.set(0.5);
      const naturalMax = Math.max(newInfo.texture.width, newInfo.texture.height);
      const scale = iconBox / naturalMax;
      sprite.width = newInfo.texture.width * scale;
      sprite.height = newInfo.texture.height * scale;
      this.icon = sprite;
      this.iconContainer.addChild(this.icon);
    } else if (this.icon instanceof Text) {
      this.icon.text = newInfo.emoji ?? '📦';
    }

    // 카운터 갱신
    this.counterText.text = `0/${newInfo.total}`;

    this.iconContainer.visible = true;
    this.counterText.visible = true;
    this.state = 'locked';
    this.applyStateVisual();

    // 등장 펄스
    this.animatePump(1.25, 400);
  }

  /**
   * 슬롯의 평상시 스케일 — active만 1.26배로 강조
   */
  private get restScale(): number {
    return this.state === 'active' && !this.mystery ? 1.26 : 1.0;
  }

  private applyStateVisual(): void {
    const hasPng = !!this.bgSprite;

    // active 링 정리 (active 상태에서만 다시 그림)
    if (this.activeRing) {
      this.removeChild(this.activeRing);
      this.activeRing.destroy();
      this.activeRing = undefined;
    }

    if (!hasPng) {
      // PNG 로드 실패 시 fallback — Graphics로 직접 그리기
      this.bg.clear();
      this.bg.visible = true;
      const fill = this.mystery ? 0xffffff
        : this.state === 'locked' ? 0xfff8e8
        : this.state === 'active' ? 0xffffff
        : 0xffe8c8;
      const stroke = this.mystery ? COLORS.SUNSET_ORANGE
        : this.state === 'locked' ? 0xc99544
        : this.state === 'active' ? COLORS.SUNSET_ORANGE
        : COLORS.SUNSET_ORANGE;
      const strokeW = this.state === 'active' ? 6 : 3;
      this.bg.roundRect(0, 0, ITEM_SLOT_SIZE, ITEM_SLOT_SIZE, 18)
        .fill({ color: fill })
        .stroke({ color: stroke, width: strokeW });
    } else {
      // PNG bg — tint으로 상태 표현
      if (this.mystery) {
        this.bgSprite!.tint = 0xffffff;
      } else if (this.state === 'locked') {
        this.bgSprite!.tint = 0xb8b8b8; // 회색조 (꺼진 느낌)
      } else if (this.state === 'active') {
        // 글로우 효과 제거 — tint 만 (원본 색)
        this.bgSprite!.tint = 0xffffff;
      } else {
        this.bgSprite!.tint = 0xffd8a8; // 오렌지 틴트 (완료)
      }
    }

    // 상태별 공통 UI (badge/icon/counter)
    if (this.mystery) {
      // mystery는 ?를 표시하고 아이콘·카운터·잠금 숨김 (생성자에서 이미 처리됨)
      return;
    }
    // 카운터는 모든 상태에서 흰색 + 검정 stroke (active/locked 동일)
    this.counterText.style.fill = 0xffffff;
    if (this.state === 'locked') {
      this.iconContainer.alpha = 0.55;
      this.lockBadge.visible = true;
      this.checkmark.visible = false;
    } else if (this.state === 'active') {
      this.iconContainer.alpha = 1;
      this.lockBadge.visible = false;
      this.counterText.text = `${this.currentCount}/${this.info.total}`;
      this.checkmark.visible = false;
    } else {
      this.iconContainer.alpha = 0.4;
      // complete도 흰색 유지 (통일감)
      this.lockBadge.visible = false;
      this.checkmark.visible = true;
    }

    // 마지막에 restScale 적용 (active=1.2배, 나머지=1.0)
    this.scale.set(this.restScale);
  }

  getState(): SlotState {
    return this.state;
  }

  setActive(): void {
    if (this.state === 'complete') return;
    this.state = 'active';
    this.applyStateVisual();
    // 1.2x 확대 시 인접 슬롯과 살짝 겹치는 영역이 active 위로 올라오도록 z-order 최상위
    if (this.parent) {
      this.parent.setChildIndex(this, this.parent.children.length - 1);
    }
    this.animatePump(1.15, 350);
  }

  increment(): boolean {
    if (this.state !== 'active') return false;
    this.currentCount += 1;
    this.counterText.text = `${this.currentCount}/${this.info.total}`;

    if (this.currentCount >= this.info.total) {
      this.markComplete();
      return true;
    } else {
      this.animatePump();
      return false;
    }
  }

  private markComplete(): void {
    this.state = 'complete';
    this.applyStateVisual();
    this.animatePump(1.2, 400);
  }

  private animatePump(peakMul: number = 1.08, duration: number = 200): void {
    const base = this.restScale;
    const peak = base * peakMul;
    const startTime = performance.now();
    const animate = () => {
      const t = Math.min((performance.now() - startTime) / duration, 1);
      const wave = Math.sin(t * Math.PI);
      this.scale.set(base + (peak - base) * wave);
      if (t < 1) requestAnimationFrame(animate);
      else this.scale.set(base);
    };
    animate();
  }

  flashReveal(): void {
    if (!this.hiddenBadge) return;
    const startTime = performance.now();
    const animate = () => {
      const t = Math.min((performance.now() - startTime) / 800, 1);
      const flash = Math.abs(Math.sin(t * Math.PI * 3));
      this.hiddenBadge!.scale.set(1 + flash * 0.5);
      if (t < 1) requestAnimationFrame(animate);
      else this.hiddenBadge!.scale.set(1);
    };
    animate();
  }

  /**
   * 아이콘을 텍스처(PNG)로 교체 — 이모지 placeholder 대신
   * 피자처럼 가로로 긴 카테고리는 더 크게 표시
   */
  setIconTexture(texture: Texture): void {
    this.iconContainer.removeChild(this.icon as Container);
    (this.icon as Container).destroy({ children: true });

    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);

    // 상단 ICON_SIZE_RATIO 상수 사용
    const ratio = this.info.category === 'pizza' ? ICON_SIZE_RATIO_PIZZA : ICON_SIZE_RATIO;
    const iconBox = ITEM_SLOT_SIZE * ratio;

    const naturalMax = Math.max(texture.width, texture.height);
    const scale = iconBox / naturalMax;
    sprite.width = texture.width * scale;
    sprite.height = texture.height * scale;
    this.icon = sprite;
    this.iconContainer.addChild(this.icon);
    // 텍스처 들어왔으므로 컨테이너 보이게 (이모지 placeholder 숨김 해제)
    this.iconContainer.alpha = 1;
  }
}
