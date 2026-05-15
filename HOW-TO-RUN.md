# 🚀 치워홀 게임 실행 가이드

## 매번 게임 켤 때 (가장 빠른 방법)

### 1. PowerShell 또는 터미널 열기
- **Windows + R** → `powershell` 입력 → Enter
- 또는 시작 메뉴에서 "PowerShell" 검색

### 2. 프로젝트 폴더로 이동
```powershell
cd c:\Users\ckdms\OneDrive\Desktop\bakery-test
```

### 3. dev 서버 실행
```powershell
npm run dev
```

### 4. 메시지 확인
화면에 다음과 같이 나오면 성공:
```
  VITE v5.4.21  ready in 677 ms

  Local:   http://localhost:5173/
```

### 5. 브라우저에서 접속
- 자동으로 열림 (대부분의 경우)
- 안 열리면 → 브라우저에서 직접 입력: **http://localhost:5173**

---

## 게임 중 코드/에셋 수정하면?

- 파일 저장하면 → **자동 새로고침** (HMR — Hot Module Replacement)
- `public/images/` 또는 `public/sounds/` 에 파일 추가 → 자동 반영
- 코드 수정 후 안 반영되면 → 브라우저에서 **Ctrl + Shift + R** (강력 새로고침)

---

## 서버 끄는 법

터미널에서 **Ctrl + C**

---

## 자주 발생하는 문제

### "npm: command not found"
→ Node.js가 PATH에 안 잡힘. 컴퓨터 재부팅 또는 새 터미널 열기.

### "Port 5173 is already in use"
→ 이미 다른 dev 서버가 켜져있음. 기존 터미널 찾아서 Ctrl+C로 끄고 다시 실행.

### 브라우저 새로고침했는데 변화 없음
→ `Ctrl + Shift + R` (강력 새로고침) 시도
→ 또는 브라우저 캐시 비우기

### 화면이 너무 작거나 큼
→ 브라우저 줌 100%로 (Ctrl + 0)
→ 게임은 1920×1080 기준으로 자동 스케일됨

---

## 단축키 정리

| 단축키 | 기능 |
|---|---|
| Ctrl + C (터미널) | 서버 끄기 |
| Ctrl + Shift + R (브라우저) | 강력 새로고침 |
| F12 (브라우저) | 개발자 도구 (콘솔 보기) |
| Ctrl + 0 (브라우저) | 줌 100% |

---

## 폴더 단축 접근

자주 쓸 폴더 바탕화면에 바로가기 만들면 편함:
- **프로젝트 폴더**: `c:\Users\ckdms\OneDrive\Desktop\bakery-test`
- **이미지 폴더**: `c:\Users\ckdms\OneDrive\Desktop\bakery-test\public\images`
- **사운드 폴더**: `c:\Users\ckdms\OneDrive\Desktop\bakery-test\public\sounds`
