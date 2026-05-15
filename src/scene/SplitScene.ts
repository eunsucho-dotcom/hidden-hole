import { Container, Graphics, Sprite, Text, Texture, Assets } from 'pixi.js';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  LEFT_PANEL_WIDTH,
  SCENE_AREA_WIDTH,
  COLORS,
  SCORING,
  SKILLS,
} from '../primitives/constants';
import { TrashSprite } from './TrashSprite';
import { InteractiveSprite } from './InteractiveSprite';
import { LeftPanel, type CategoryInfo } from './LeftPanel';
import { GameHUD } from './GameHUD';
import { PigCharacter } from './PigCharacter';
import { BlackHoleEffect } from '../effects/BlackHoleEffect';
import { audio } from '../audio/SoundManager';
import { calculateStars } from '../primitives/result-types';
import type { ResultData } from '../primitives/result-types';
import type { SceneData } from '../primitives/types';

/**
 * 메인 씬 — Find & Clean 모드
 *
 * 레이아웃:
 *   [좌측 220px: 아이템 패널] [메인 1700px: 어지러운 방]
 *
 * 진행:
 *   1. 좌측 패널에 찾을 사물 목록 표시 (숨은 건 🔍 돋보기)
 *   2. 메인 화면에서 사물 클릭 → 활성화 + 좌측 패널 체크
 *   3. 인터랙션 (드래그/탭/스와이프) → 숨은 사물 노출 + 좌측 패널 돋보기 → 사물 아이콘 변환
 *   4. 모든 사물 활성화 완료 → 블랙홀 흡입
 *   5. 깨끗한 방 풀스크린 공개 + Perfect!
 */
export class SplitScene extends Container {
  private sceneContainer: Container;
  private leftPanel: LeftPanel;
  private sceneBackground?: Sprite | Graphics;
  private cleanBackgroundTexture?: Texture;
  private messyBackgroundTexture?: Texture;
  private trashSprites: TrashSprite[] = [];
  private interactiveSprites: InteractiveSprite[] = [];
  private blackHole?: BlackHoleEffect;
  private pig?: PigCharacter;
  private hud: GameHUD;
  private startTime = performance.now();
  private lastActivationTime = 0;
  private comboCount = 0;
  private currentScore = 0;
  private totalCategories = 0;
  private suckedCategories = new Set<string>();
  private allCategoryInfos = new Map<string, CategoryInfo>();
  private onCompleteCallback?: (result: ResultData) => void;

  private editMode = false;
  private editModeIndicator?: Container;
  private keyboardHandler?: (e: KeyboardEvent) => void;

  constructor(private sceneData: SceneData) {
    super();

    // 카테고리별 그룹핑하여 좌측 패널 생성 (allHidden 계산 포함)
    const categoryItemsMap = new Map<string, typeof sceneData.trashItems>();
    for (const item of sceneData.trashItems) {
      const list = categoryItemsMap.get(item.category) ?? [];
      list.push(item);
      categoryItemsMap.set(item.category, list);
    }
    const categories: CategoryInfo[] = [];
    for (const [catId, items] of categoryItemsMap) {
      const first = items[0];
      const hiddenCount = items.filter((i) => i.isHidden).length;
      categories.push({
        category: catId,
        label: first.categoryLabel,
        emoji: first.categoryEmoji,
        total: items.length,
        hasHidden: hiddenCount > 0,
        allHidden: hiddenCount === items.length,
      });
    }
    this.totalCategories = categories.length;
    this.leftPanel = new LeftPanel(categories);
    this.addChild(this.leftPanel);

    // 카테고리 데이터 보관 (숨은 카테고리 동적 추가용)
    this.allCategoryInfos = new Map(categories.map((c) => [c.category, c]));

    // 인터랙티브가 reveal할 숨은 카테고리에 대해 처음부터 ? 미스터리 슬롯 표시
    // (인터랙티브는 처음부터 클릭 가능 — 순서 무관, 어디에 뭐가 있는지 힌트)
    for (const obj of sceneData.interactiveObjects) {
      for (const trashId of obj.revealsTrashIds) {
        const hiddenTrash = sceneData.trashItems.find((t) => t.id === trashId);
        if (hiddenTrash) {
          this.leftPanel.addMysterySlot(hiddenTrash.category);
        }
      }
    }
    this.hintsShown = true;
    // ? 슬롯이 맨 아래에 추가되며 자동 스크롤됐으니, 다시 active 카테고리(맨 위)로 스크롤
    this.leftPanel.scrollToActive();

    // 씬 wrapper (좌측 패널 옆에 위치) — 마스크 + 노란 배경 fill
    const sceneWrapper = new Container();
    sceneWrapper.position.set(LEFT_PANEL_WIDTH, 0);
    const sceneMask = new Graphics()
      .rect(0, 0, SCENE_AREA_WIDTH, GAME_HEIGHT)
      .fill(0xffffff);
    sceneWrapper.addChild(sceneMask);
    sceneWrapper.mask = sceneMask;
    // 노란 배경 fill — 콘텐츠 시프트 후 빈공간을 좌측 패널 색과 통일
    const yellowFill = new Graphics()
      .rect(0, 0, SCENE_AREA_WIDTH, GAME_HEIGHT)
      .fill(0xefb63a);
    sceneWrapper.addChild(yellowFill);
    // 실제 콘텐츠 컨테이너 — sceneData.contentShiftX 만큼 좌우 시프트
    this.sceneContainer = new Container();
    this.sceneContainer.x = sceneData.contentShiftX ?? 0;
    sceneWrapper.addChild(this.sceneContainer);
    this.addChild(sceneWrapper);

    // HUD (상단 + 스킬 슬롯)
    this.hud = new GameHUD();
    this.hud.onSkillClick(0, () => this.executeSkillAutoClear(0));
    this.hud.onSkillClick(1, () => this.armSkill1());
    this.addChild(this.hud);

    this.loadAssets();
    this.setupEditModeListener();
  }

  private wheelHandler?: (e: WheelEvent) => void;
  private lastPointerPos = { x: 0, y: 0 };
  private pointerMoveHandler?: (e: PointerEvent) => void;

  private setupEditModeListener(): void {
    this.keyboardHandler = (e: KeyboardEvent) => {
      // 한영 키 무관하게 e.code 사용
      const code = e.code;
      if (code === 'KeyE') {
        this.toggleEditMode();
      } else if (code === 'KeyS') {
        this.exportPositions();
      } else if (!this.editMode) {
        return;
      } else if (code === 'KeyD') {
        // 마우스 위 사물 복사
        this.duplicateSpriteAtPointer();
      } else if (code === 'KeyX' || code === 'Delete') {
        // 마우스 위 사물 삭제
        this.deleteSpriteAtPointer();
      } else if (code === 'KeyQ') {
        // 반시계 회전 (-0.1 rad)
        this.rotateSpriteAtPointer(-0.1);
      } else if (code === 'KeyT') {
        // 시계 회전 (+0.1 rad) — E는 편집모드 토글이라 T 사용
        this.rotateSpriteAtPointer(0.1);
      } else if (code === 'KeyR') {
        // 회전 초기화
        this.rotateSpriteAtPointer(0, true);
      }
    };
    window.addEventListener('keydown', this.keyboardHandler);

    // 마우스 위치 추적 (스크롤 리사이즈에 필요)
    this.pointerMoveHandler = (e: PointerEvent) => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = GAME_WIDTH / rect.width;
      const scaleY = GAME_HEIGHT / rect.height;
      // sceneContainer가 좌측 시프트되어 있으면 그만큼 보정 (편집 모드 마우스 좌표가 sceneContainer-local 기준)
      this.lastPointerPos.x = (e.clientX - rect.left) * scaleX - LEFT_PANEL_WIDTH - this.sceneContainer.x;
      this.lastPointerPos.y = (e.clientY - rect.top) * scaleY;
    };
    window.addEventListener('pointermove', this.pointerMoveHandler);

    // 마우스 스크롤로 사이즈 조절 (편집 모드 + 사물 위)
    this.wheelHandler = (e: WheelEvent) => {
      if (!this.editMode) return;
      const factor = e.deltaY > 0 ? 0.95 : 1.05; // 5% per scroll
      const px = this.lastPointerPos.x;
      const py = this.lastPointerPos.y;
      // 인터랙티브 먼저 (z-order 위에 있을 가능성)
      for (let i = this.interactiveSprites.length - 1; i >= 0; i--) {
        const interactive = this.interactiveSprites[i];
        if (interactive.isPointerOver(px, py)) {
          e.preventDefault();
          interactive.resizeBy(factor);
          return;
        }
      }
      // 그 다음 트래시
      for (let i = this.trashSprites.length - 1; i >= 0; i--) {
        const trash = this.trashSprites[i];
        if (trash.isPointerOver(px, py)) {
          e.preventDefault();
          trash.resizeBy(factor);
          return;
        }
      }
    };
    window.addEventListener('wheel', this.wheelHandler, { passive: false });

    console.log('%c⌨️ 키: E = 편집 모드 / S = 위치 저장(클립보드)',
      'background: #2c3e50; color: #ff9f68; padding: 6px; font-weight: bold;');
    console.log('%c🖱️ 편집 모드에서 사물 위 스크롤 → 사이즈 조절',
      'background: #2c3e50; color: #ff9f68; padding: 6px; font-weight: bold;');
  }

  /**
   * 편집 모드 — 마우스 위 사물을 회전
   */
  private rotateSpriteAtPointer(deltaRad: number, reset: boolean = false): void {
    const px = this.lastPointerPos.x;
    const py = this.lastPointerPos.y;
    // 인터랙티브 먼저
    for (let i = this.interactiveSprites.length - 1; i >= 0; i--) {
      const sprite = this.interactiveSprites[i];
      if (sprite.isPointerOver(px, py)) {
        sprite.rotation = reset ? 0 : sprite.rotation + deltaRad;
        return;
      }
    }
    // 트래시
    for (let i = this.trashSprites.length - 1; i >= 0; i--) {
      const sprite = this.trashSprites[i];
      if (sprite.isPointerOver(px, py)) {
        sprite.rotation = reset ? 0 : sprite.rotation + deltaRad;
        sprite.data.rotation = sprite.rotation;
        return;
      }
    }
  }

  /**
   * 편집 모드 — 마우스 위 사물 삭제
   */
  private deleteSpriteAtPointer(): void {
    const px = this.lastPointerPos.x;
    const py = this.lastPointerPos.y;
    for (let i = this.trashSprites.length - 1; i >= 0; i--) {
      const sprite = this.trashSprites[i];
      if (sprite.isPointerOver(px, py)) {
        this.sceneContainer.removeChild(sprite);
        sprite.destroy({ children: true });
        this.trashSprites.splice(i, 1);
        console.log(`[Edit] 삭제: ${sprite.data.id}`);
        return;
      }
    }
  }

  /**
   * 편집 모드 — 마우스 위 사물을 복사 (살짝 오프셋해서)
   */
  private duplicateSpriteAtPointer(): void {
    const px = this.lastPointerPos.x;
    const py = this.lastPointerPos.y;
    for (let i = this.trashSprites.length - 1; i >= 0; i--) {
      const original = this.trashSprites[i];
      if (original.isPointerOver(px, py)) {
        // 새 ID 생성 (같은 카테고리 다음 번호)
        const sameCat = this.trashSprites.filter((t) => t.data.category === original.data.category);
        const newId = `${original.data.category}_${sameCat.length + 1}`;
        // 데이터 깊은 복사 + 위치 오프셋
        const newData = {
          ...original.data,
          id: newId,
          position: { x: original.x + 30, y: original.y + 30 },
          size: { ...original.data.size },
          isActivated: false,
        };
        const sprite = new TrashSprite(newData, original.getTexture());
        sprite.onActivated(() => this.handleTrashActivated(newData.id));
        sprite.setEditMode(true);
        this.trashSprites.push(sprite);
        this.sceneContainer.addChild(sprite);
        console.log(`[Edit] 복사: ${newId} @ (${newData.position.x}, ${newData.position.y})`);
        return;
      }
    }
  }

  private toggleEditMode(): void {
    this.editMode = !this.editMode;
    for (const trash of this.trashSprites) {
      trash.setEditMode(this.editMode);
    }
    for (const interactive of this.interactiveSprites) {
      interactive.setEditMode(this.editMode);
    }
    // 좌측 패널 숨김 (편집 시)
    this.leftPanel.visible = !this.editMode;

    // 배경 텍스처 스왑 (편집 ON: messy 시안 보임 / 편집 OFF: clean)
    if (this.sceneBackground instanceof Sprite) {
      if (this.editMode && this.messyBackgroundTexture) {
        this.sceneBackground.texture = this.messyBackgroundTexture;
      } else if (this.cleanBackgroundTexture) {
        this.sceneBackground.texture = this.cleanBackgroundTexture;
      }
    }

    // 인디케이터 표시/숨김
    if (this.editMode) {
      this.showEditModeIndicator();
    } else {
      this.hideEditModeIndicator();
    }
    console.log(`%c[EDIT MODE: ${this.editMode ? 'ON' : 'OFF'}]`,
      `background: ${this.editMode ? '#FF9F68' : '#444'}; color: white; padding: 4px; font-weight: bold;`);
    if (this.editMode) {
      console.log('💡 편집 모드: messy 배경 표시. 사물 드래그/D복사/X삭제/Q,T회전 가능.');
      console.log('S 키 = 클립보드에 위치 자동 복사');
    }
  }

  private showEditModeIndicator(): void {
    if (this.editModeIndicator) return;
    this.editModeIndicator = new Container();

    // 보더
    const border = new Graphics()
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .stroke({ color: 0xff9f68, width: 8 });
    this.editModeIndicator.addChild(border);

    // 상단 안내 텍스트
    const text = new Text({
      text: '🛠️ EDIT MODE  |  사물 드래그로 위치 조정',
      style: { fontSize: 24, fill: 0xff9f68, fontWeight: 'bold' },
    });
    text.anchor.set(0.5, 0);
    text.position.set(GAME_WIDTH / 2, 10);
    this.editModeIndicator.addChild(text);

    // 📋 SAVE 버튼 (상단 우측)
    const saveBtn = new Container();
    saveBtn.position.set(GAME_WIDTH - 300, 50);
    const btnBg = new Graphics()
      .roundRect(0, 0, 260, 70, 12)
      .fill({ color: 0x4caf50 })
      .stroke({ color: 0xffffff, width: 3 });
    const btnLabel = new Text({
      text: '📋 SAVE & COPY',
      style: { fontSize: 26, fill: 0xffffff, fontWeight: 'bold' },
    });
    btnLabel.anchor.set(0.5);
    btnLabel.position.set(130, 35);
    saveBtn.addChild(btnBg);
    saveBtn.addChild(btnLabel);
    saveBtn.eventMode = 'static';
    saveBtn.cursor = 'pointer';
    saveBtn.on('pointerover', () => (btnBg.tint = 0xffffff));
    saveBtn.on('pointerout', () => (btnBg.tint = 0x4caf50));
    saveBtn.on('pointertap', () => this.exportPositions());
    this.editModeIndicator.addChild(saveBtn);

    // ❌ EXIT 버튼 (상단 좌측)
    const exitBtn = new Container();
    exitBtn.position.set(30, 50);
    const exitBg = new Graphics()
      .roundRect(0, 0, 200, 70, 12)
      .fill({ color: 0xe74c3c })
      .stroke({ color: 0xffffff, width: 3 });
    const exitLabel = new Text({
      text: '❌ EXIT EDIT',
      style: { fontSize: 24, fill: 0xffffff, fontWeight: 'bold' },
    });
    exitLabel.anchor.set(0.5);
    exitLabel.position.set(100, 35);
    exitBtn.addChild(exitBg);
    exitBtn.addChild(exitLabel);
    exitBtn.eventMode = 'static';
    exitBtn.cursor = 'pointer';
    exitBtn.on('pointerover', () => (exitBg.tint = 0xffffff));
    exitBtn.on('pointerout', () => (exitBg.tint = 0xe74c3c));
    exitBtn.on('pointertap', () => this.toggleEditMode());
    this.editModeIndicator.addChild(exitBtn);

    this.addChild(this.editModeIndicator);
  }

  private hideEditModeIndicator(): void {
    if (this.editModeIndicator) {
      this.removeChild(this.editModeIndicator);
      this.editModeIndicator.destroy({ children: true });
      this.editModeIndicator = undefined;
    }
  }

  /**
   * 모든 사물 현재 위치를 TypeScript 형식으로 콘솔 출력
   * 복붙해서 lv1-demo.ts 의 instances 배열에 붙여넣으면 됨
   */
  private exportPositions(): void {
    const byCategory = new Map<string, TrashSprite[]>();
    for (const t of this.trashSprites) {
      const list = byCategory.get(t.data.category) ?? [];
      list.push(t);
      byCategory.set(t.data.category, list);
    }
    // 각 사물의 현재 z-order 계산 (sceneContainer 의 childIndex 기준)
    const allInteractables: Array<any> = [...this.trashSprites, ...this.interactiveSprites];
    allInteractables.sort((a, b) =>
      this.sceneContainer.getChildIndex(a) - this.sceneContainer.getChildIndex(b)
    );
    const zMap = new Map<any, number>();
    allInteractables.forEach((s, idx) => zMap.set(s, idx));

    // 클립보드 + 콘솔 출력
    let output = '=== POSITION EXPORT ===\n\n';
    for (const [cat, sprites] of byCategory) {
      output += `// ${cat}\ninstances: [\n`;
      for (const s of sprites) {
        const x = Math.round(s.data.position.x);
        const y = Math.round(s.data.position.y);
        const w = Math.round(s.data.size.width);
        const h = Math.round(s.data.size.height);
        const z = zMap.get(s) ?? 0;
        const r = s.data.rotation ? `, r: ${s.data.rotation.toFixed(2)}` : '';
        // Lv1: trash_lv1_<cat><N>.png, Lv2: trash_lv2_<cat>_<N>.png
        const texName = s.data.texture
          .replace(/^\/images\/trash_lv\d+_/, '')
          .replace('.png', '');
        const variantSuffix = texName.startsWith(s.data.category) ? texName.substring(s.data.category.length) : '';
        // Lv1: "1" / Lv2: "_1" 둘 다 인식
        const m = variantSuffix.match(/^_?(\d+)$/);
        const v = m ? `, v: ${m[1]}` : '';
        output += `  { x: ${x}, y: ${y}, w: ${w}, h: ${h}, z: ${z}${r}${v} },\n`;
      }
      output += `],\n\n`;
    }
    // 인터랙티브 오브젝트도 출력
    output += `// === INTERACTIVES ===\n`;
    for (const s of this.interactiveSprites) {
      const z = zMap.get(s) ?? 0;
      output += `// ${s.data.id}\n`;
      output += `position: { x: ${Math.round(s.data.position.x)}, y: ${Math.round(s.data.position.y)} },\n`;
      output += `size: { width: ${Math.round(s.data.size.width)}, height: ${Math.round(s.data.size.height)} },\n`;
      output += `z: ${z},\n\n`;
    }
    // 돼지 위치
    if (this.pig) {
      output += `// === PIG ===\n`;
      output += `pig: { position: { x: ${Math.round(this.pig.x)}, y: ${Math.round(this.pig.y)} }, size: 200 },\n`;
    }

    console.log('%c=== 위치 EXPORT (클립보드 자동 복사 시도) ===',
      'background: #2c3e50; color: #ff9f68; padding: 8px; font-weight: bold;');
    console.log(output);

    // 클립보드 자동 복사
    if (navigator.clipboard) {
      navigator.clipboard.writeText(output).then(() => {
        console.log('%c✅ 클립보드 복사 완료! 채팅창에서 Ctrl+V 하세요',
          'background: #4CAF50; color: white; padding: 8px; font-weight: bold; font-size: 14px;');
      }).catch((err) => {
        console.warn('클립보드 복사 실패 — 콘솔 출력 수동 복사하세요:', err);
      });
    }
  }

  destroy(options?: any): void {
    if (this.keyboardHandler) {
      window.removeEventListener('keydown', this.keyboardHandler);
    }
    if (this.wheelHandler) {
      window.removeEventListener('wheel', this.wheelHandler);
    }
    if (this.pointerMoveHandler) {
      window.removeEventListener('pointermove', this.pointerMoveHandler);
    }
    super.destroy(options);
  }

  private async loadAssets(): Promise<void> {
    let messyTex: Texture | undefined;
    let cleanTex: Texture | undefined;

    try {
      messyTex = await Assets.load(this.sceneData.backgroundMessy);
    } catch {}
    try {
      cleanTex = await Assets.load(this.sceneData.backgroundClean);
    } catch {}

    // 모든 트래시 + 인터랙티브 텍스처 일괄 로드
    const texturePaths = new Set<string>();
    for (const item of this.sceneData.trashItems) {
      texturePaths.add(item.texture);
    }
    for (const obj of this.sceneData.interactiveObjects) {
      texturePaths.add(obj.textureBefore);
      texturePaths.add(obj.textureAfter);
    }

    const textureMap = new Map<string, Texture>();
    const failedPaths: string[] = [];
    for (const path of texturePaths) {
      try {
        const tex = await Assets.load(path);
        textureMap.set(path, tex);
      } catch (e) {
        failedPaths.push(path);
      }
    }
    if (failedPaths.length > 0) {
      console.warn(
        `⚠️ ${failedPaths.length}개 텍스처 로드 실패 (placeholder로 대체):\n` +
        failedPaths.map((p) => `  - ${p}`).join('\n') +
        `\n→ 파일이 public/images/에 있는지, OneDrive 동기화가 완료됐는지 확인하세요.`
      );
    }

    this.setupBackground(messyTex);
    if (cleanTex) this.cleanBackgroundTexture = cleanTex;
    // 편집 모드용 messy 텍스처 — 데이터의 backgroundMessy 사용
    // (Lv2는 clean과 동일하지만 그래도 같은 경로로 로드)
    try {
      this.messyBackgroundTexture = await Assets.load(this.sceneData.backgroundMessy);
    } catch {}
    this.setupPig();
    this.setupTrash(textureMap);
    this.setupInteractive(textureMap);

    // 좌측 패널 슬롯 아이콘을 실제 PNG로 교체
    const seenCategories = new Set<string>();
    for (const item of this.sceneData.trashItems) {
      if (seenCategories.has(item.category)) continue;
      seenCategories.add(item.category);
      const tex = textureMap.get(item.texture);
      if (tex) {
        this.leftPanel.setSlotTexture(item.category, tex);
      }
    }

    // z-order 적용 — 데이터에 z 가 있으면 그 순서대로 재배치
    this.applyZOrder();
  }

  /**
   * 데이터의 z 필드를 사용해서 렌더 순서 재배치
   */
  private applyZOrder(): void {
    // 모든 인터랙티브(스프라이트 + 트래시스프라이트) 모음
    const allSprites: Array<{ sprite: any; z: number }> = [];
    for (const sprite of this.trashSprites) {
      allSprites.push({ sprite, z: sprite.data.z ?? 0 });
    }
    for (const sprite of this.interactiveSprites) {
      allSprites.push({ sprite, z: sprite.data.z ?? 0 });
    }
    // z 가 정의된 게 있을 때만 정렬 적용
    if (allSprites.some((x) => x.z !== 0)) {
      allSprites.sort((a, b) => a.z - b.z);
      // 낮은 z 부터 다시 addChild → 뒤에서부터 위로 쌓임
      for (const item of allSprites) {
        this.sceneContainer.addChild(item.sprite);
      }
    }
  }

  private setupPig(): void {
    if (!this.sceneData.pig) return;
    this.pig = new PigCharacter(this.sceneData.pig.size);
    this.pig.setOriginalPosition(this.sceneData.pig.position.x, this.sceneData.pig.position.y);
    this.sceneContainer.addChild(this.pig);
  }

  private setupBackground(messyTex?: Texture): void {
    if (messyTex) {
      this.sceneBackground = new Sprite(messyTex);
      (this.sceneBackground as Sprite).width = SCENE_AREA_WIDTH;
      (this.sceneBackground as Sprite).height = GAME_HEIGHT;
      this.sceneContainer.addChildAt(this.sceneBackground, 0);
    } else {
      // 플레이스홀더 배경 (어두운 네이비)
      this.sceneBackground = new Graphics()
        .rect(0, 0, SCENE_AREA_WIDTH, GAME_HEIGHT)
        .fill({ color: COLORS.LV1_NAVY });
      this.sceneContainer.addChildAt(this.sceneBackground, 0);
    }
  }

  private setupTrash(textureMap: Map<string, Texture>): void {
    for (const data of this.sceneData.trashItems) {
      const texture = textureMap.get(data.texture);
      const sprite = new TrashSprite(data, texture);
      sprite.onActivated(() => this.handleTrashActivated(data.id));
      this.trashSprites.push(sprite);
      this.sceneContainer.addChild(sprite);
    }
    this.updateStatus();
    this.applyActiveCategoryFilter();
  }

  /**
   * 현재 active 카테고리의 트래시만 클릭 가능, 나머지는 비활성
   */
  private applyActiveCategoryFilter(): void {
    const activeCat = this.leftPanel.getActiveCategory();
    for (const trash of this.trashSprites) {
      if (trash.data.isActivated) {
        trash.eventMode = 'none';
        continue;
      }
      const isCurrentActive = trash.data.category === activeCat;
      trash.eventMode = isCurrentActive ? 'static' : 'none';
      trash.cursor = isCurrentActive ? 'pointer' : 'default';
    }
  }

  private setupInteractive(textureMap: Map<string, Texture>): void {
    for (const data of this.sceneData.interactiveObjects) {
      const beforeTex = textureMap.get(data.textureBefore);
      const afterTex = textureMap.get(data.textureAfter);
      const sprite = new InteractiveSprite(data, beforeTex, afterTex);
      sprite.onInteracted(() => {
        this.handleInteractionComplete(data.revealsTrashIds);
      });
      this.interactiveSprites.push(sprite);
      this.sceneContainer.addChild(sprite);
    }
  }

  private handleTrashActivated(trashId: string): void {
    this.updateScore();
    this.updateStatus();

    const trash = this.trashSprites.find((t) => t.data.id === trashId);
    if (!trash) return;

    // 즉시 클리어 ARMED 상태면: 같은 카테고리 나머지 사물 자동 활성화 (1회용)
    if (this.skill1Armed) {
      this.skill1Armed = false;
      this.skill1Used = true;
      this.hud.updateSkillStatus(1, 'USED');
      const cat = trash.data.category;
      const remaining = this.trashSprites.filter(
        (t) => t.data.category === cat && !t.data.isActivated
      );
      remaining.forEach((t, i) => {
        setTimeout(() => t.activate(), (i + 1) * 60);
      });
    }

    const justCompleted = this.leftPanel.incrementCategory(trash.data.category);
    if (justCompleted) {
      // ASMR 클릭 사운드 먼저 들리도록 350ms 딜레이 후 체크 사운드 재생
      // (좌측 패널 슬롯이 'complete' 상태로 전환되며 체크마크 등장하는 타이밍과 맞춤)
      setTimeout(() => audio.play('category_complete'), 350);
      // 카테고리 완료 시각 차감 후 미니 흡입 발동 (사용자가 "✓ 3/3" 잠시 본 후)
      setTimeout(() => this.suckCategory(trash.data.category), 600);
    }
  }

  /**
   * 카테고리 미니 흡입 — 해당 카테고리의 활성화된 아이템들이 돼지인형 입으로 빨려감
   * 흡입 완료 후 다음 카테고리 ACTIVE 전환
   */
  private suckCategory(category: string): void {
    const categoryItems = this.trashSprites.filter(
      (t) => t.data.category === category && t.data.isActivated
    );
    if (categoryItems.length === 0) return;

    // 돼지 입 위치를 흡입 타겟으로
    const mouthPos = this.pig
      ? this.pig.getMouthPosition()
      : { x: SCENE_AREA_WIDTH / 2, y: GAME_HEIGHT / 2 };

    // 돼지 입 벌리기
    this.pig?.openMouth();

    const miniHole = new BlackHoleEffect(mouthPos.x, mouthPos.y);
    miniHole.alpha = 0; // 보이지 않게 — 돼지 입이 시각적 타겟
    this.sceneContainer.addChild(miniHole);
    miniHole.start(categoryItems);
    miniHole.onComplete(() => {
      this.suckedCategories.add(category);
      this.pig?.closeMouth();
      this.maybeUnlockSkills();

      // 다음 카테고리 ACTIVE 전환
      const nextCat = this.leftPanel.activateNext();
      if (nextCat) {
        this.applyActiveCategoryFilter();
      } else {
        if (this.suckedCategories.size === this.totalCategories) {
          setTimeout(() => this.finalWrapUp(), 500);
        } else {
          // 보이는 카테고리 다 끝났지만 숨은 카테고리(frame/ring) 남음
          // → 인터랙티브에 ? 힌트 표시
          this.showInteractiveHints();
        }
      }
    });
  }

  // ====== 스킬 시스템 ======
  private skill0Used = false; // 오기 발동 (5장)
  private skill1Used = false; // 즉시 클리어 (10장 + 제한시간 내)
  private skill1Armed = false; // 즉시 클리어 ARM 상태

  /**
   * 카테고리 흡입 완료 후 호출 — 스킬 잠금 해제 체크
   */
  private maybeUnlockSkills(): void {
    const cleared = this.suckedCategories.size;
    if (!this.skill0Used && cleared >= SKILLS.EOK_UNLOCK_ROUNDS) {
      this.hud.updateSkillStatus(0, 'READY');
    }
    // 즉시 클리어: 10장 + 제한시간(timeLimit) 내에 도달했을 때만
    if (!this.skill1Used && !this.skill1Armed && cleared >= SKILLS.CLEAR_UNLOCK_ROUNDS) {
      const elapsedSec = (performance.now() - this.startTime) / 1000;
      const timeLimit = this.sceneData.timeLimit ?? 120;
      if (elapsedSec <= timeLimit) {
        this.hud.updateSkillStatus(1, 'READY');
      }
    }
  }

  /**
   * 오기 발동: 클릭 즉시 현재 active 카테고리 자동 클리어 (1회용)
   */
  private executeSkillAutoClear(slotIndex: 0 | 1): void {
    if (slotIndex === 0 && this.skill0Used) return;

    const activeCat = this.leftPanel.getActiveCategory();
    if (!activeCat) return;

    const remaining = this.trashSprites.filter(
      (t) => t.data.category === activeCat && !t.data.isActivated
    );
    if (remaining.length === 0) return;

    remaining.forEach((trash, i) => {
      setTimeout(() => trash.activate(), i * 80);
    });

    this.skill0Used = true;
    this.hud.updateSkillStatus(0, 'USED');
  }

  /**
   * 즉시 클리어 ARM: 클릭 시 ARMED 상태 → 다음 사물 1번 클릭에 카테고리 전체 활성화
   */
  private armSkill1(): void {
    if (this.skill1Used || this.skill1Armed) return;
    this.skill1Armed = true;
    this.hud.updateSkillStatus(1, 'ARMED');
  }

  /**
   * (구) 보이는 카테고리 다 끝났을 때 ? 슬롯 표시 트리거
   * → 이제 처음부터 ? 슬롯이 표시되므로 no-op (호환성 위해 유지)
   */
  private hintsShown = false;
  private showInteractiveHints(): void {
    /* no-op: 초기화 시점에 이미 ? 슬롯 추가됨 */
  }

  /**
   * 최종 마무리 — 남은 인터랙티브 오브젝트 흡입 + 클린 공개
   */
  private finalWrapUp(): void {
    // 좌측 패널 페이드 아웃
    const panelFadeStart = performance.now();
    const fadePanel = () => {
      const t = Math.min((performance.now() - panelFadeStart) / 400, 1);
      this.leftPanel.alpha = 1 - t;
      if (t < 1) requestAnimationFrame(fadePanel);
      else this.leftPanel.visible = false;
    };
    fadePanel();

    // 남은 인터랙티브 오브젝트 (베개 등) 흡입 — 돼지 입으로
    const remaining = this.interactiveSprites.filter((s) => s.visible && s.alpha > 0.01);

    if (remaining.length > 0) {
      setTimeout(() => {
        const mouthPos = this.pig
          ? this.pig.getMouthPosition()
          : { x: SCENE_AREA_WIDTH / 2, y: GAME_HEIGHT / 2 };

        this.pig?.openMouth();
        const finalHole = new BlackHoleEffect(mouthPos.x, mouthPos.y);
        finalHole.alpha = 0;
        this.sceneContainer.addChild(finalHole);
        finalHole.start(remaining);
        finalHole.onComplete(() => {
          this.pig?.closeMouth();
          setTimeout(() => this.revealClean(), 400);
        });
      }, 400);
    } else {
      setTimeout(() => this.revealClean(), 400);
    }
  }

  private handleInteractionComplete(revealsTrashIds: string[]): void {
    // 숨은 쓰레기 노출 (씬에서)
    for (const id of revealsTrashIds) {
      const trash = this.trashSprites.find((t) => t.data.id === id);
      if (trash) {
        trash.reveal();
        // z-order 최상위로
        this.sceneContainer.setChildIndex(trash, this.sceneContainer.children.length - 1);

        // 좌측 패널: 숨은 카테고리 노출 (allHidden이었던 경우 새로 등장)
        const catInfo = this.allCategoryInfos.get(trash.data.category);
        if (catInfo && catInfo.allHidden) {
          this.leftPanel.revealHiddenCategory(catInfo);
        } else {
          // 부분 숨김 카테고리: 🔍 배지 깜빡임만
          this.leftPanel.flashCategory(trash.data.category);
        }
      }
    }

    // 새 카테고리 추가됐을 수 있으므로 active 갱신
    this.leftPanel.activateNext();
    this.applyActiveCategoryFilter();
  }

  private updateStatus(): void {
    const total = this.trashSprites.length;
    const activated = this.trashSprites.filter((t) => t.data.isActivated).length;
    this.hud.updateStatus(activated, total);
  }

  private updateScore(): void {
    const now = performance.now();
    if (now - this.lastActivationTime < SCORING.COMBO_WINDOW_MS) {
      this.comboCount += 1;
    } else {
      this.comboCount = 0;
    }
    this.lastActivationTime = now;

    const baseAdd = SCORING.PER_TRASH;
    const comboAdd = this.comboCount > 0 ? baseAdd * (SCORING.COMBO_MULTIPLIER - 1) : 0;
    this.currentScore += Math.floor(baseAdd + comboAdd);
    this.hud.updateScore(this.currentScore);
  }

  private revealClean(): void {
    // 분할 모드 모든 요소 숨김
    this.sceneContainer.visible = false;
    this.hud.visible = false;
    this.leftPanel.visible = false;

    // 풀스크린 깨끗한 방 배경
    let fullScreenBg: Sprite | Graphics;
    if (this.cleanBackgroundTexture) {
      fullScreenBg = new Sprite(this.cleanBackgroundTexture);
      (fullScreenBg as Sprite).width = GAME_WIDTH;
      (fullScreenBg as Sprite).height = GAME_HEIGHT;
    } else {
      fullScreenBg = new Graphics()
        .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
        .fill({ color: COLORS.MINT_GREEN });
    }
    fullScreenBg.alpha = 0;
    this.addChildAt(fullScreenBg, 0);

    // 페이드인
    const fadeStart = performance.now();
    const fadeAnimate = () => {
      const t = Math.min((performance.now() - fadeStart) / 400, 1);
      fullScreenBg.alpha = t;
      if (t < 1) requestAnimationFrame(fadeAnimate);
    };
    fadeAnimate();

    // 화면 전체 화이트 플래시 (집이 빤짝 — 한순간 환해짐)
    const flash = new Graphics()
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .fill({ color: 0xffffff });
    flash.alpha = 0;
    this.addChild(flash);
    const flashStart = performance.now();
    const flashAnimate = () => {
      const elapsed = performance.now() - flashStart;
      const t = Math.min(elapsed / 600, 1);
      // 0~0.25: 페이드인, 0.25~1: 페이드아웃
      flash.alpha = t < 0.25 ? (t / 0.25) * 0.85 : 0.85 * (1 - (t - 0.25) / 0.75);
      if (t < 1) requestAnimationFrame(flashAnimate);
      else {
        this.removeChild(flash);
        flash.destroy();
      }
    };
    flashAnimate();

    // 클린 공개 사운드
    audio.play('clean_reveal');
    setTimeout(() => audio.play('perfect'), 600);

    // 반짝 ✨ 스파클 — 화면 전체에 별 모양 반짝거림
    this.spawnSparkles();

    // 결과 콜백
    setTimeout(() => {
      const result = this.calculateResult();
      this.onCompleteCallback?.(result);
    }, 1800);

    // Perfect! 표시
    const perfectText = new Text({
      text: 'Perfect!',
      style: {
        fontSize: 144,
        fill: 0xffd700,
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 8 },
      },
    });
    perfectText.anchor.set(0.5);
    perfectText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    perfectText.scale.set(0);
    this.addChild(perfectText);

    const startTime = performance.now() + 300;
    const animate = () => {
      const now = performance.now();
      if (now < startTime) {
        requestAnimationFrame(animate);
        return;
      }
      const elapsed = now - startTime;
      const t = Math.min(elapsed / 500, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      const overshoot = t < 1 ? 1.2 - 0.2 * eased : 1;
      perfectText.scale.set(eased * overshoot);
      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * 화면 전체에 부드러운 캐주얼한 빛 — 파스텔 동그란 글로우들이 둥실둥실
   */
  private spawnSparkles(): void {
    const COUNT = 80;
    // 캐주얼 파스텔 팔레트
    const COLORS_PALETTE = [
      0xfff4b0, // 연한 노랑
      0xffd6a5, // 살구
      0xfdbed1, // 베이비 핑크
      0xc6e8d4, // 민트
      0xc7ddff, // 라벤더 블루
      0xffffff, // 화이트
    ];

    for (let i = 0; i < COUNT; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const size = 12 + Math.random() * 30;
      const color = COLORS_PALETTE[Math.floor(Math.random() * COLORS_PALETTE.length)];
      const delay = Math.random() * 1600;
      const lifeMs = 900 + Math.random() * 700;
      const driftX = (Math.random() - 0.5) * 30;
      const driftY = -20 - Math.random() * 30;

      const sparkle = this.makeSoftLight(size, color);
      sparkle.position.set(x, y);
      sparkle.alpha = 0;
      this.addChild(sparkle);

      const startTime = performance.now() + delay;
      const startX = x;
      const startY = y;
      const animate = () => {
        const now = performance.now();
        if (now < startTime) {
          requestAnimationFrame(animate);
          return;
        }
        const elapsed = now - startTime;
        const t = Math.min(elapsed / lifeMs, 1);
        // 부드러운 sin 파 페이드 인-아웃 (살짝 길게 머무름)
        sparkle.alpha = Math.sin(t * Math.PI) * 0.85;
        // 위쪽으로 둥실둥실
        sparkle.x = startX + driftX * t;
        sparkle.y = startY + driftY * t;
        // 살짝 부풀어 오르고 줄어듦
        const scaleT = Math.sin(t * Math.PI);
        sparkle.scale.set(0.7 + scaleT * 0.5);

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          this.removeChild(sparkle);
          sparkle.destroy({ children: true });
        }
      };
      animate();
    }
  }

  /**
   * 부드러운 동그란 빛 — 그라데이션 효과를 위해 여러 레이어
   */
  private makeSoftLight(size: number, color: number): Container {
    const c = new Container();
    // 외곽 큰 글로우 (옅게)
    const outer = new Graphics()
      .circle(0, 0, size)
      .fill({ color, alpha: 0.25 });
    c.addChild(outer);
    // 중간 레이어
    const mid = new Graphics()
      .circle(0, 0, size * 0.6)
      .fill({ color, alpha: 0.5 });
    c.addChild(mid);
    // 코어 (밝게)
    const core = new Graphics()
      .circle(0, 0, size * 0.3)
      .fill({ color: 0xffffff, alpha: 0.95 });
    c.addChild(core);
    return c;
  }

  update(deltaMs: number): void {
    for (const interactive of this.interactiveSprites) {
      interactive.updateIdle(deltaMs);
    }
    this.pig?.updateIdle(deltaMs);
    const elapsed = performance.now() - this.startTime;
    this.hud.updateTimer(elapsed);
  }

  private calculateResult(): ResultData {
    const elapsedMs = performance.now() - this.startTime;
    const elapsedSec = elapsedMs / 1000;
    const trashCount = this.trashSprites.length;
    const baseScore = trashCount * SCORING.PER_TRASH;
    const timeBonus = Math.max(0, SCORING.TIME_BONUS_MAX_SECONDS - Math.floor(elapsedSec)) * SCORING.TIME_BONUS_PER_SECOND;
    const comboBonus = Math.max(0, this.currentScore - baseScore);
    const perfectBonus = SCORING.PERFECT_BONUS;
    const totalScore = baseScore + timeBonus + comboBonus + perfectBonus;
    const stars = calculateStars(totalScore);

    return {
      sceneId: this.sceneData.id,
      sceneTitle: this.sceneData.title,
      trashCount,
      elapsedMs,
      baseScore,
      timeBonus,
      comboBonus,
      perfectBonus,
      totalScore,
      stars,
    };
  }

  onComplete(callback: (result: ResultData) => void): void {
    this.onCompleteCallback = callback;
  }
}
