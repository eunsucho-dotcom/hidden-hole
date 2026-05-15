# GameBakery.ai Tick & Time System

> **Purpose**: Technical specification to reference when implementing the Tick/Time system

Detailed specification of the game time and tick system.

---

## 1. Core Concepts

### 1.1 Frame, Update, Tick, DeltaTime

| Concept | Description |
|------|------|
| **Frame** | A unit where the screen is drawn once (rendering unit) |
| **Update** | A behavior/function called every frame (game loop) |
| **Tick** | An event where game logic executes once |
| **DeltaTime** | Elapsed time between ticks (milliseconds) |

### 1.2 Concept Relationship Diagram

```
+----------+  triggers   +----------+  belongsTo  +----------+
|  Update  | ----------> |   Tick   | ----------> |  Frame   |
+----------+             +----------+             +----------+
                              |
                              | hasDuration
                              v
                         +----------+
                         | DeltaTime|
                         +----------+
```

**HTML5/TypeScript terminology mapping:**
- `requestAnimationFrame()` callback → Update (behavior)
- `performance.now()` based calculation → DeltaTime (value)
- Frame → Frame (rendering unit)
- TickGenerator publishes tick InputEvent → Tick (event)

### 1.3 Frame Drops and DeltaTime

In reality, frame drops occur. However, game time must not fall behind.

```
Ideal (60fps):  Frame1(16.66ms) → Frame2(16.66ms) → Frame3(16.66ms)
Reality (drop):  Frame1(16.66ms) → Frame2(50ms) → Frame3(16.66ms)
```

**Principle**: Even if DeltaTime varies, game time must flow accurately.

---

## 2. TickGenerator

### 2.1 Role Definition

**TickGenerator = Source of time + the sole producer of tick InputEvents**

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
│  │  ← RenderCommand[]              tick InputEvent →        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

| Role | Description |
|------|------|
| **Source of time** | Calculates deltaMs and creates tick InputEvents |
| **Loop driver** | Drives the game loop via RAF/setInterval |
| **Tick publisher** | Publishes tick InputEvents to UIEvent Channel |
| **Independent entity** | Does not communicate directly with CLI/GUI (via Channel) |

### 2.2 TickGenerator vs CLI/GUI Relationship

| Category | CLI | GUI | TickGenerator |
|------|-----|-----|---------------|
| **Role** | Text rendering + command input | Graphics rendering + input handling | Tick generation |
| **InputEvent production** | Command parsing → InputEvent | DOM events → InputEvent | tick InputEvent |
| **RenderCommand consumption** | Output as text | Render on Canvas | Does not consume |
| **Tick handling** | Manual (`tick 16.66 60`) | Automatic (RAF) | Only generates |

### 2.3 Implementation Patterns

#### ITickGenerator Interface

```typescript
// src/tick-generator/tick-generator.ts

export interface ITickGenerator {
    start(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    isPaused(): boolean;
    isRunning(): boolean;
}
```

#### BrowserTickGenerator (for GUI)

```typescript
// src/tick-generator/browser-tick-generator.ts

export class BrowserTickGenerator implements ITickGenerator {
    private channel: IUIEventChannel;
    private running = false;
    private paused = false;
    private lastTime = 0;
    private rafId: number | null = null;

    constructor(channel: IUIEventChannel) {
        this.channel = channel;
    }

    start(): void {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    stop(): void {
        this.running = false;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    pause(): void {
        this.paused = true;
    }

    resume(): void {
        if (this.paused) {
            this.paused = false;
            this.lastTime = performance.now();  // Prevent time jump
        }
    }

    private loop(now: number): void {
        if (!this.running) return;

        if (!this.paused) {
            const deltaMs = now - this.lastTime;
            this.lastTime = now;

            // Publish tick InputEvent (sole responsibility)
            this.channel.publishInput({
                type: 'tick',
                deltaMs,
                timestamp: now
            });
        }

        this.rafId = requestAnimationFrame((t) => this.loop(t));
    }

    isPaused(): boolean { return this.paused; }
    isRunning(): boolean { return this.running; }
}
```

#### ManualTickGenerator (for CLI)

```typescript
// src/tick-generator/manual-tick-generator.ts

export class ManualTickGenerator implements ITickGenerator {
    private channel: IUIEventChannel;

    constructor(channel: IUIEventChannel) {
        this.channel = channel;
    }

    // CLI command: tick 16.66 60
    tick(deltaMs: number, count = 1): void {
        for (let i = 0; i < count; i++) {
            this.channel.publishInput({
                type: 'tick',
                deltaMs,
                timestamp: Date.now()
            });
        }
    }

    // ITickGenerator implementation (no-op for CLI)
    start(): void { /* CLI is manual */ }
    stop(): void {}
    pause(): void {}
    resume(): void {}
    isPaused(): boolean { return false; }
    isRunning(): boolean { return false; }
}
```

#### MockTickGenerator (for testing)

```typescript
// src/tick-generator/mock-tick-generator.ts

export class MockTickGenerator implements ITickGenerator {
    public tickHistory: { deltaMs: number; timestamp: number }[] = [];
    private channel: IUIEventChannel;

    constructor(channel: IUIEventChannel) {
        this.channel = channel;
    }

    // Called directly in tests
    simulateTick(deltaMs: number): void {
        const timestamp = this.tickHistory.length * deltaMs;
        this.tickHistory.push({ deltaMs, timestamp });
        this.channel.publishInput({ type: 'tick', deltaMs, timestamp });
    }

    // Simulate 1 second (60fps)
    simulate1Second(): void {
        for (let i = 0; i < 60; i++) {
            this.simulateTick(16.66);
        }
    }

    start(): void {}
    stop(): void {}
    pause(): void {}
    resume(): void {}
    isPaused(): boolean { return false; }
    isRunning(): boolean { return false; }
}
```

---

## 3. Tick & Time System

### 3.1 Tick Delivery Path

View and ViewModel communicate **only through UIEvent Channel**.

```
TickGenerator ──(tick InputEvent)──► UIEvent Channel
                                           │
                                           │ UIEvent Pump
                                           ▼
                                      ViewModel.tick(deltaMs)
                                           │
                                           ▼
                                      Core.tick(deltaMs)
```

### 3.2 Tick Supply Pattern per Client

| Client | TickGenerator | Description |
|------------|---------------|------|
| **GUI (Canvas)** | BrowserTickGenerator | RAF-based automatic tick |
| **CLI Client** | ManualTickGenerator | Manual tick command |
| **Testing** | MockTickGenerator | Deterministic tick simulation |

```
GUI:  BrowserTickGenerator.start() → RAF → tick InputEvent → Channel
CLI:  ManualTickGenerator.tick(16.66, 60) → tick InputEvent × 60 → Channel
Test: MockTickGenerator.simulate1Second() → tick InputEvent × 60 → Channel
```

### 3.3 TickConfig (Primitives)

```typescript
// src/primitives/tick-config.ts

/**
 * Game speed control configuration
 */
export interface TickConfig {
    timeScale: number;      // 0.0 ~ 10.0 (1.0 = normal speed)
    paused: boolean;        // if true, delta=0
    useFixedDelta: boolean; // if true, use fixedDelta
    fixedDelta: number;     // Fixed delta (for E2E testing, ms)
}

export const DEFAULT_TICK_CONFIG: TickConfig = {
    timeScale: 1.0,
    paused: false,
    useFixedDelta: false,
    fixedDelta: 16.66,
};
```

**Usage:**
- `timeScale`: Game speed control (slow motion, fast forward)
- `paused`: Pause
- `fixedDelta`: Guarantees deterministic results in E2E testing

---

## 4. Design Principles

### 4.1 Core Does Not Know Time

Core **only receives delta**. It has no need for current time, frame rate, or actual elapsed time.

```
❌ Core calls Date.now()
✅ Core receives delta as a parameter
```

### 4.2 TickGenerator = The Sole Source of Time

tick InputEvents are **produced only by TickGenerator**. CLI/GUI do not create ticks.

```
✅ TickGenerator publishes tick InputEvent → Channel → Pump → ViewModel
❌ GUI directly calls ViewModel.tick()
```

### 4.3 No Direct References Between View ↔ ViewModel

View (CLI/GUI) and ViewModel communicate **only through UIEvent Channel**.

```
✅ View → InputEvent → Channel → Pump → ViewModel → RenderCommand → Channel → View
❌ View directly references ViewModel
```

### 4.4 TimeScale is Applied by Core

Multiplying delta by TimeScale is handled **inside Core**.

```typescript
const scaledDelta = deltaMs * this.config.timeScale;
```

### 4.5 E2E Tests Use MockTickGenerator

Use MockTickGenerator to guarantee **deterministic results**:

```typescript
const mockTick = new MockTickGenerator(channel);
mockTick.simulateTick(16.66);  // Exactly 16.66ms
mockTick.simulateTick(16.66);  // Exactly 16.66ms
// → Always guarantees identical results
```

---

## 5. Checklist

### When Designing Core
- [ ] Is ViewModel's `tick(delta)` the sole time input path?
- [ ] Is the TimeScale application logic inside Core?
- [ ] Is TickConfig defined in Primitives?

### When Implementing TickGenerator
- [ ] Does it implement the ITickGenerator interface?
- [ ] Is BrowserTickGenerator RAF-based?
- [ ] Does ManualTickGenerator support manual ticks?
- [ ] Does MockTickGenerator support deterministic simulation?
- [ ] Does it only produce tick InputEvents? (no other roles)

### When Implementing CLI Client
- [ ] Does the `tick <deltaTime>` command call ManualTickGenerator.tick()?
- [ ] Can multiple ticks be executed with `tick <deltaTime> <count>` format?
- [ ] Is frame drop simulation possible? (various deltaTime values)

### When Implementing GUI Client
- [ ] Does it use BrowserTickGenerator?
- [ ] When TickGenerator starts, are tick InputEvents published to the Channel?
- [ ] Do pause/resume work correctly?

### When Testing
- [ ] Is deterministic testing possible using MockTickGenerator?
- [ ] Are there helper methods like simulate1Second()?
- [ ] Can published ticks be verified via tickHistory?
