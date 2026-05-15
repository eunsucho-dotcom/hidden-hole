# GameBakery.ai Philosophy

> **Purpose**: Core philosophy and design principles of the GameBakery.ai project

---

## 1. Mission

**"AI-First"**

GameBakery.ai is an AI-First game development platform.

| AI-First Principle | Description |
|---------------|------|
| **AI generates code** | Developers review and verify through tests |
| **AI generates content** | Levels, balance, and dialogue created via Editor API |
| **AI runs tests** | Deterministic E2E via CLI + TickGenerator |

### Core Design

| Perspective | Description | Why AI-Friendly |
|------|------|----------------|
| **Content = Data** | Separated as JSON | AI can edit directly via API |
| **Runtime = Pure Logic** | Deterministic engine | AI can verify predictable results |
| **CLI = Text I/O** | Text-based verification | AI can generate/verify I/O sequences |

### Core Values

```
Game Editor (React) ← Planners/AI edit content
       │
       │ JSON/Binary
       ▼
Game Runtime (TypeScript) ← Executes pure logic
       │
       │ UIEvent
       ▼
View (CLI/GUI) ← Handles rendering only
```

---

## 2. Architecture Philosophy

### 2.1 Dependency Separation (Dependency Gravity)

```
[Lv.0] Primitives     ← Constants, types, errors (no dependencies)
[Lv.1] Domain         ← Pure business logic (references Lv.0 only)
[Lv.2] Application    ← UseCase, Port definitions (references Lv.0-1)
[Lv.3] Infrastructure ← Adapter implementations (references Lv.0-2)
[Lv.3] ViewModel      ← Core → UIEvent projection (references Lv.0-2)
```

**Principle**: Dependencies always flow from top to bottom only.

### 2.2 Pure Logic

Core (Primitives + Domain + Application) is kept **pure**:
- No external I/O
- No side effects
- Same input → Same output

**Why does this matter?**
- Testability: Unit testing possible without mocks
- Deterministic: Reproducible bugs
- Portability: Platform-independent

### 2.3 View = Empty Shell

View (CLI/GUI) receives RenderCommands and **only draws**:
- 0% business logic
- 0% state management
- 0% decisions/calculations

---

## 3. Testing Philosophy

### 3.1 Pure Logic → High Coverage

Thanks to dependency separation + pure logic, **test coverage maximization** is possible:

| Layer | Test Type | Target Coverage |
|--------|-------------|---------------|
| Primitives | Unit | 100% |
| Domain | Unit | 100% |
| Application | Integration | 100% |
| Infrastructure | Integration | 80%+ |
| ViewModel | Integration | 80%+ |

### 3.2 CLI + TickGenerator = Maximized E2E

**Key Insight**: By leveraging CLI and TickGenerator, E2E tests can also be executed deterministically

```
MockTickGenerator.simulateTick(16.66)  ← Precise time control
ManualTickGenerator.tick(16.66, 60)    ← Simulate 1 second from CLI
```

| Traditional E2E | GameBakery.ai E2E |
|-----------|-------------------|
| Unstable (timing-dependent) | Deterministic (tick-controlled) |
| Slow (actual rendering) | Fast (CLI text output) |
| Hard to debug | Reproducible |

### 3.3 AI-First TDD

> "Code is Black Box, Test is Trust"

AI-generated code is trusted only through tests. Therefore:
- Tests are required for all public APIs
- Tests serve as specifications
- Maximum coverage = Maximum trust

---

## 4. Design Decisions

### Q1: Why an editor, not just a game?

Game content must be **separated as data** so that:
- Planners can edit without code
- AI can generate content via API
- Content can be updated without changing runtime code

### Q2: Why build CLI first?

CLI is the key to test automation:
- Text I/O → Easy to automate
- tick commands → Deterministic time control
- Full logic verification without GUI

### Q3: Why separate TickGenerator?

Time must be controllable for deterministic tests:
- BrowserTickGenerator: RAF-based (production)
- ManualTickGenerator: Manual tick (CLI)
- MockTickGenerator: Deterministic simulation (testing)

---

## 5. Related Documents

| Number | Document | Content |
|------|------|------|
| 01 | [01-ai-first-development.md](01-ai-first-development.md) | AI-First development philosophy, Scorecard |
| 02 | [02-ai-first-tdd.md](02-ai-first-tdd.md) | TDD guidelines, coverage standards |
| 11 | [11-gamebakery-ai-architecture.md](11-gamebakery-ai-architecture.md) | Architecture details |
| 12 | [12-gamebakery-ai-workflow.md](12-gamebakery-ai-workflow.md) | Development workflow |
| 13 | [13-gamebakery-ai-tick-time-system.md](13-gamebakery-ai-tick-time-system.md) | Tick/Time system specification |
