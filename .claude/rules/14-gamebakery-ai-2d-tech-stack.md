# GameBakery.ai 2D Tech Stack

## Core Tech Stack

| Layer | Technology | Purpose |
|--------|------|------|
| Rendering | **PixiJS + @pixi/react** | 2D graphics rendering (WebGL/Canvas) |
| UI | React | Component-based UI |
| Language | TypeScript | Type safety, AI-friendly |
| Build | Vite | Fast dev server, bundling |
| Testing | Vitest | Unit/integration tests |

## Why @pixi/react?
1. **React Ecosystem**: Declaratively compose 2D scenes as React components.
2. **Performance**: Leverages PixiJS's WebGL performance as-is.
3. **Consistency**: Same paradigm as the 3D stack (React Three Fiber).
4. **AI-Friendly**: Clear component structure makes it easy for AI to generate code.

## PixiJS Rules
1. **@pixi/react First**: Use PixiJS through React components.
2. **Latest Version**: Use PixiJS v8 or higher.
3. **No Other Renderers**: Do not use other 2D rendering libraries (Phaser, etc.).

## Setup
```bash
npm create vite@latest -- --template react-ts
npm install pixi.js @pixi/react
npm install -D vitest
```
