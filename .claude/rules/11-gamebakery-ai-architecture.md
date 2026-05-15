# GameBakery.ai Architecture

> **Purpose**: Reference document for designing/reviewing system structure

HTML5 game architecture definition.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HTML5 Game Project                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [Game Editor] ←──── Planners (Web UI) + AI (API)              │
│         │                                                        │
│         │ Edit + Save + Serve                                    │
│         ▼                                                        │
│   [Game Data] (JSON)                                            │
│         │                                                        │
│         │ HTTP Loading                                           │
│         ▼                                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     Pure Logic Layer                        │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  [Lv.2] Core (Domain + Application)                 │  │  │
│  │  │         Pure business logic, UseCase, Port defs      │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                          ▲                                 │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  [Lv.3] Infrastructure (Adapter)                    │  │  │
│  │  │         HTTP Loader, external system integration     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                          ▲                                 │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  [Lv.3] ViewModel                                   │  │  │
│  │  │         Core state → UIEvent projection              │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                             ▲                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    UIEventChannel                          │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │   InputEvent →              ← RenderCommand         │  │  │
│  │  │   (tick, keydown, mouse)    (sprite, text, audio)   │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │           UIEvent Pump (Channel ↔ ViewModel connection)    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                             ▲                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                       View Level                           │  │
│  │  ┌─────────┐    ┌─────────┐    ┌───────────────────┐      │  │
│  │  │   CLI   │    │   GUI   │    │   TickGenerator   │      │  │
│  │  │ (equal) │    │ (equal) │    │    (special)      │      │  │
│  │  │         │    │         │    │                   │      │  │
│  │  │Text out │    │ Canvas  │    │ Source of time    │      │  │
│  │  │Cmd parse│    │ PixiJS  │    │ Tick producer     │      │  │
│  │  └─────────┘    └─────────┘    └───────────────────┘      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Principle | Description |
|------|------|
| **Pure Logic Layer** | Core + Infrastructure + ViewModel = Platform-independent pure logic |
| **UIEventChannel Layer** | An **independent communication layer** between View and ViewModel (direct references between the two are prohibited) |
| **View Level Composition** | CLI (equal) + GUI (equal) + TickGenerator (special) |
| **TickGenerator** | The **sole producer** of tick InputEvents → Details: [13-gamebakery-ai-tick-time-system.md](13-gamebakery-ai-tick-time-system.md) |
| **TypeScript Single Language** | Both game runtime and editor use TypeScript |

---

## Tech Stack

| Layer | Language | Location | Notes |
|--------|------|------|------|
| Primitives | TypeScript | src/primitives/ | Constants, types, errors, UIEvent DTOs |
| Domain | TypeScript | src/domain/ | Pure business logic |
| Application | TypeScript | src/application/ | UseCase, Port definitions |
| Infrastructure | TypeScript | src/infrastructure/ | HTTP Loader, Adapters |
| ViewModel | TypeScript | src/view-model/ | Core state → UIEvent projection |
| **UIEventChannel** | TypeScript | src/ui-event-channel/ | **View ↔ ViewModel communication layer** |
| CLI | TypeScript | src/cli/ | Verification CLI (text renderer) |
| GUI | TypeScript | src/gui/ | Production Canvas rendering (PixiJS) |
| TickGenerator | TypeScript | src/tick-generator/ | Source of time, tick generation |
| Game Editor | React (TypeScript) | game-editor/ | Web-based editing + serving |
| Game Data | JSON | game-data/ | Shared data store |

### Key Points
- **TypeScript unified** - Minimizes AI context cost
- **npm packages** - Module separation per layer

---

## Project Structure

```
repository-root/
├── src/                            # Game Runtime (TypeScript)
│   ├── primitives/                 # Level 0 - Constants, types, errors, UIEvent DTOs
│   │   ├── types.ts
│   │   ├── errors.ts
│   │   ├── input-event.ts          # InputEvent type definitions
│   │   ├── render-command.ts       # RenderCommand type definitions
│   │   └── ui-event-channel.ts     # IUIEventChannel interface
│   ├── domain/                     # Level 1 - Pure business logic
│   ├── application/                # Level 2 - UseCase, Port definitions
│   ├── infrastructure/             # Level 3 - HTTP Loader
│   ├── view-model/                 # Level 3 - Core state → UIEvent projection
│   │   ├── view-model.ts
│   │   └── ui-event-pump.ts        # Channel → ViewModel connection
│   ├── ui-event-channel/           # Level 3.5 - View ↔ ViewModel communication layer
│   │   ├── ui-event-channel.ts     # IUIEventChannel implementation
│   │   ├── input-event-queue.ts    # InputEvent queue
│   │   └── render-command-buffer.ts # RenderCommand buffer
│   ├── tick-generator/             # Level 4 - Source of time
│   │   ├── browser-tick-generator.ts   # RAF-based (for GUI)
│   │   └── manual-tick-generator.ts    # Manual tick (for CLI)
│   ├── cli/                        # Level 4 - Verification CLI
│   │   ├── cli-renderer.ts
│   │   └── cli-main.ts
│   └── gui/                        # Level 4 - Production Canvas rendering
│       ├── pixi-renderer.ts
│       ├── input-handler.ts
│       └── gui-main.ts
│
├── game-editor/                    # Game Editor (React)
│   ├── src/
│   │   ├── components/             # React components
│   │   ├── api/                    # Internal API (edit + save)
│   │   └── server/                 # Serving logic
│   └── package.json
│
├── game-data/                      # Game Data (JSON)
│   ├── levels/                     # Level data
│   ├── balance/                    # Balance data
│   └── assets/                     # Asset metadata
│
├── .codex/                         # Codex configuration
│   ├── rules/                      # AI rules
│   ├── skills/                     # AI skills
│   └── scripts/                    # AI scripts
│
└── docs/                           # Documentation
```

---

## Dependency Rules

```
┌─────────────────────────────────────────────────────────────┐
│                        View Level                             │
│   CLI / GUI / TickGenerator                                 │
│         │                                                    │
└─────────┼───────────────────────────────────────────────────┘
          │ publish/consume
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    UIEventChannel Layer                       │
│   InputEvent Queue ←────────→ RenderCommand Buffer          │
│         │                                                    │
└─────────┼───────────────────────────────────────────────────┘
          │ UIEvent Pump
          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Pure Logic Layer                         │
│   ViewModel                                                  │
│         │                                                    │
│         ▼                                                    │
│   Infrastructure                                             │
│         │                                                    │
│         ▼                                                    │
│   Application                                                │
│         │                                                    │
│         ▼                                                    │
│   Domain                                                     │
│         │                                                    │
│         ▼                                                    │
│   Primitives                                                 │
└─────────────────────────────────────────────────────────────┘
```

**Key Rules:**
1. **Unidirectional dependency**: Upper levels reference only lower levels
2. **UIEventChannel isolation**: Direct references between View and ViewModel are prohibited; communication only through the UIEventChannel layer
3. **Port firewall**: Application Ports expose only Primitives types

---

## UIEvent Communication Pattern

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         View Level                                │
│  ┌─────────┐    ┌─────────┐    ┌───────────────────┐           │
│  │   CLI   │    │   GUI   │    │   TickGenerator   │           │
│  │(Renderer)│    │(Renderer)│    │    (Driver)      │           │
│  └────┬────┘    └────┬────┘    └─────────┬─────────┘           │
│       │ consume      │ consume           │ produce              │
│       ▼              ▼                   ▼                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   UIEvent Channel                         │  │
│  │  ← RenderCommand[]              InputEvent(tick) →       │  │
│  │  ← RenderCommand[]              InputEvent(keydown) →    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ UIEvent Pump
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Pure Logic Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      ViewModel                            │  │
│  │   handleInput(InputEvent) → Core invocation               │  │
│  │   tick(deltaMs) → Core.tick() → RenderCommand[] creation │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Core (Domain + Application)               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Role Assignment

| Component | Role | InputEvent | RenderCommand |
|----------|------|------------|---------------|
| **TickGenerator** | Source of time, loop driver | tick **produces** | - |
| **CLI** | Text renderer + command parsing | keydown etc. **produces** | **consumes** (text output) |
| **GUI** | Canvas renderer + input handling | keydown/mouse etc. **produces** | **consumes** (PixiJS rendering) |
| **ViewModel** | State projection | **consumes** (via Pump) | **produces** |

---

## Related Documents

| Number | Document | Content |
|------|------|------|
| 11 | [12-gamebakery-ai-workflow.md](12-gamebakery-ai-workflow.md) | Development order, core principles, test strategy |
| 12 | [13-gamebakery-ai-tick-time-system.md](13-gamebakery-ai-tick-time-system.md) | Tick/Time system detailed specification |
| 13 | [14-gamebakery-ai-2d-tech-stack.md](14-gamebakery-ai-2d-tech-stack.md) | 2D game tech stack (PixiJS) |
| 14 | [15-gamebakery-ai-3d-tech-stack.md](15-gamebakery-ai-3d-tech-stack.md) | 3D game tech stack (Three.js) |
