# 개발 환경 셋업 가이드 (집/새 컴퓨터용)

> 회사 컴퓨터와 동일한 GameBakery.ai 개발 환경을 만드는 절차.
> Claude Code에게 "SETUP.md 보고 셋업해줘"라고 말하면 아래 과정을 대신 진행해준다.

## 사전 준비 (사람이 직접)

1. **Claude Code 설치** — https://claude.com/claude-code
2. **VPN 연결** (사내 패키지 서버 접근이 막혀 있을 경우)
3. **codeb 토큰 발급** — https://aiproxy.backoffice.bagelgames.com/console/tokens
   - 토큰은 기기마다 따로 발급. 발급한 토큰을 Claude에게 전달하면 로그인은 대신 해준다.

## 셋업 절차

### 1. bakery-plugins 마켓플레이스 추가 (터미널, 한 번만)

```bash
claude plugin marketplace add project-bakery/bakery-plugins
```

### 2. GameBakery 도구 셋업 (Claude Code 안에서)

Claude Code를 열고 아래 중 하나를 입력:

```
/gamebakery-init
```

또는 그냥 "도구 셋업해줘"라고 말하기.

이것 하나로 다음이 전부 자동 설치된다:
- **codeb** — AI 에셋 생성 (이미지/3D/사운드/음성)
- **game-eye** — HTML5 게임 QA 도구
- **playforge** — HTML5 → Android APK/AAB 빌드
- **bakery-plugins** — gen-2d, gen-3d, gen-audio, gen-fx, removebg, sam, bakery-viewer, mentor, vision-forge 등
- **글로벌 rules** — `~/.claude/rules/`에 GameBakery 개발 규칙

### 3. codeb 로그인

```bash
codeb login --token <발급받은 토큰>
codeb whoami   # 확인
```

### 4. bakery-viewer 설치 (별도)

```bash
uv tool install git+https://github.com/project-bakery/bakery-viewer.git
```

> SSH 키가 없으면 `git+ssh://` 대신 위처럼 `git+https://` 사용.

## 프로젝트 받기

```bash
git clone https://github.com/eunsucho-dotcom/hidden-hole.git
cd hidden-hole
npm install
```

## 검증

```bash
node --version      # v22+
codeb version
codeb whoami
game-eye --version
playforge --version
playforge doctor    # Android 빌드 환경 점검 (Java 21+ 필요 — 없으면 /playforge-remote로 원격 빌드 가능)
```

## 참고

- **Java 21+ 미설치 시**: 로컬 APK 빌드만 안 되고, `/playforge-remote`(원격 빌드)는 Java 없이 동작.
- **에셋 뷰어 실행**: `bakery-viewer --root <에셋 폴더> --port 7891` → http://localhost:7891/
