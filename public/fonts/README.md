# 커스텀 폰트 사용법

## 1. 폰트 파일 업로드

이 폴더(`public/fonts/`)에 폰트 파일을 넣으세요.
- 권장 포맷: **`.woff2`** (가장 가벼움) 또는 `.ttf`
- 무료 폰트 사이트:
  - https://fonts.google.com (영문 + 한글)
  - https://noonnu.cc (한글 무료 폰트 모음)
  - https://hangeul.naver.com/font (네이버 한글캠퍼스)

## 2. style.css 에서 폰트 등록

`src/style.css` 상단의 `@font-face` 블록에서 파일명만 본인 폰트로 변경:

```css
@font-face {
  font-family: 'MyCustomFont';   /* ← 원하는 이름 */
  src: url('/fonts/실제파일명.woff2') format('woff2'),
       url('/fonts/실제파일명.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

## 3. 게임 코드에서 사용

`src/scene/LeftPanel.ts` 상단의:

```typescript
const FONT_FAMILY = 'Jua, system-ui, sans-serif';
```

를:

```typescript
const FONT_FAMILY = 'MyCustomFont, system-ui, sans-serif';
```

로 변경. **위에서 정한 `font-family` 이름과 정확히 일치**해야 함.

## 4. 브라우저 새로고침 → 적용

`Ctrl+Shift+R` (강제 새로고침)

## 추천 한글 무료 폰트

| 폰트 | 특징 | 다운로드 |
|---|---|---|
| **Pretendard** | 깔끔하고 가독성 좋은 산세리프 (추천) | https://github.com/orioncactus/pretendard |
| **Cafe24 Ssurround** | 둥글둥글 귀여운 톤 | noonnu.cc 검색 |
| **Maplestory Light** | 메이플스토리 폰트 | noonnu.cc |
| **DungGeunMo** | 도트 픽셀 느낌 | noonnu.cc |
| **TmoneyRoundWind** | 부드러운 라운드 | noonnu.cc |

## 여러 폰트 동시 사용

`@font-face` 블록을 여러 개 추가하면 됩니다:

```css
@font-face {
  font-family: 'Font1';
  src: url('/fonts/font1.woff2') format('woff2');
}
@font-face {
  font-family: 'Font2';
  src: url('/fonts/font2.woff2') format('woff2');
}
```

그러면 코드에서 `'Font1'`, `'Font2'` 둘 다 사용 가능.
