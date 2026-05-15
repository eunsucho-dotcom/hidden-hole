# GameBakery.ai Workflow

> **Purpose**: Execution guide to reference when starting development work

HTML5 game development process.

---

## Development Order

```
1. Core → 2. Infrastructure → 3. ViewModel → 4. UIEventChannel → 5. TickGenerator → 6. CLI → 7. GUI → 8. Game Editor
```

### Phase 1: Core Implementation
- Primitives layer: Constants, types, errors, **UIEvent DTO type definitions**
- Domain layer: Pure business logic
- Application layer: UseCase + Port definitions
- **TDD**: Unit Test + Integration Test → 100% coverage
- **Deliverable**: `src/primitives/`, `src/domain/`, `src/application/`

### Phase 2: Infrastructure Implementation
- Implement Core's Outgoing Ports (Adapters)
- Load data from Game Editor via HTTP client
- **TDD**: Integration Test → 80%+ coverage
- **Deliverable**: `src/infrastructure/`

### Phase 3: ViewModel Implementation
- Core state → UIEvent projection
- Implement UIEvent Pump (Channel → ViewModel connection)
- **TDD**: Integration Test → 80%+ coverage
- **Deliverable**: `src/view-model/`

### Phase 4: UIEventChannel Implementation
- IUIEventChannel interface implementation
- InputEvent Queue + RenderCommand Buffer
- Complete View ↔ ViewModel communication layer
- **TDD**: Unit Test → 100% coverage
- **Deliverable**: `src/ui-event-channel/`

### Phase 5: TickGenerator Implementation
- BrowserTickGenerator (RAF-based, for GUI)
- ManualTickGenerator (manual tick, for CLI)
- MockTickGenerator (for testing)
- **Details**: [13-gamebakery-ai-tick-time-system.md](13-gamebakery-ai-tick-time-system.md)
- **Deliverable**: `src/tick-generator/`

### Phase 6: CLI Implementation
- Verification CLI client
- Text renderer + command parsing
- **TDD**: E2E Test → 60%+ coverage
- **Deliverable**: `src/cli/`

### Phase 7: GUI Implementation
- PixiJS-based Canvas rendering
- Input handling (keyboard, mouse, touch)
- **Deliverable**: `src/gui/`

### Phase 8: Game Editor Implementation
- Web-based content editing tool (React)
- Edit + Save + Serve integration
- **Deliverable**: `game-editor/`

---

## Core Principles

### 1. Pure Logic Layer Isolation
Core + Infrastructure + ViewModel = Platform-independent pure logic. They have no knowledge of the View.

### 2. UIEventChannel Layer
An **independent communication layer** between View and ViewModel. Direct references between the two are prohibited.

### 3. TickGenerator = Source of Time
The **sole producer** of tick InputEvents. Does not communicate directly with CLI/GUI.

### 4. CLI/GUI Equality
Both are **equal renderers** at the View level. They render the same RenderCommands differently.

### 5. TypeScript Single Language
Both game runtime and editor use TypeScript. Minimizes AI context cost.

---

## Test Strategy

### AI-First TDD Philosophy
> "Code is Black Box, Test is Trust" - AI-generated code is trusted only through tests.

### Coverage Standards

| Layer | Test Type | Coverage | Framework |
|--------|-------------|----------|------------|
| Core (Primitives/Domain/Application) | Unit + Integration | 100% | Vitest |
| Infrastructure | Integration | 80%+ | Vitest |
| ViewModel | Integration | 80%+ | Vitest |
| UIEventChannel | Unit | 100% | Vitest |
| TickGenerator | Unit | 80%+ | Vitest |
| CLI/GUI | E2E | 60%+ | Playwright |

Details: [02-ai-first-tdd.md](02-ai-first-tdd.md)

---

## Related Documents

| Number | Document | Content |
|------|------|------|
| 01 | [01-ai-first-development.md](01-ai-first-development.md) | Layer structure, development philosophy, Scorecard |
| 02 | [02-ai-first-tdd.md](02-ai-first-tdd.md) | Test guidelines, coverage standards |
| 10 | [11-gamebakery-ai-architecture.md](11-gamebakery-ai-architecture.md) | Architecture, tech stack, project structure |
| 12 | [13-gamebakery-ai-tick-time-system.md](13-gamebakery-ai-tick-time-system.md) | Tick/Time system detailed specification |
