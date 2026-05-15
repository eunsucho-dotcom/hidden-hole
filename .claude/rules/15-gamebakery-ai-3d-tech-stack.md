# GameBakery.ai 3D Tech Stack

## Core Tech Stack

| Layer | Technology | Purpose |
|--------|------|------|
| Rendering | **Three.js + React Three Fiber** | 3D graphics rendering (WebGL) |
| Language | TypeScript | Type safety, AI-friendly |
| Build | Vite | Fast dev server, bundling |
| Testing | Vitest | Unit/integration tests |

## Why React Three Fiber?
1. **React Ecosystem**: Declaratively compose 3D scenes as React components.
2. **Performance**: Leverages Three.js performance as-is.
3. **DX**: State management, hooks, and event handling are unified the React way.
4. **AI-Friendly**: Clear component structure makes it easy for AI to generate code.

## Three.js Rules
1. **R3F First**: Use React Three Fiber as the default.
2. **Latest Version**: Use Three.js r150 or higher.
3. **Drei**: Leverage the `@react-three/drei` helper library.

## Setup
```bash
npm create vite@latest -- --template react-ts
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three vitest
```
