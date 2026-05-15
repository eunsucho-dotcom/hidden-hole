# Hidden Hole (히든홀)

> *The morning after a wild party. Click trash, hear ASMR, watch the pig gulp.*

A cozy ASMR cleaning hybrid of Hidden Folks × Hole.io. Find scattered trash in a messy room — each category gets swallowed whole by a pink pig's black-hole mouth, with category-matched ASMR sounds.

Built for the 2026 May AI Festival Game Jam.

---

## Play

- **Web**: Open `index.html` after running dev server, or open the deployed URL
- **Controls**: Mouse click only (mobile touch supported)
- **Playtime**: ~2 minutes per stage

## Features

- 🍶 **22 trash categories** (soju bottles, beer cans, tissues, pizza, plastic bags, cracker crumbs, etc.)
- 🐷 **Signature pink pig** — opens its mouth into a black-hole vortex
- 🎧 **Per-category ASMR sounds** — glass clinks, can crushes, vinyl rustles, paper crumples, fabric squishes
- ✨ **Sparkle finale** — whole room glows when fully cleaned
- 🔍 **Hidden discoveries** — cushion and flowerpot conceal extra items revealed only after the main cleanup

## Tech Stack

- **TypeScript** + **Vite**
- **PixiJS v8** (`@pixi/react`) — 2D WebGL rendering
- **Howler.js** — audio
- **AI assets** — Gemini Image 3 (textures) + ElevenLabs (SFX, BGM)
- **Claude Code** — AI-assisted development (Anthropic)

## Run Locally

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Build for Production

```bash
npm run build
# Output: dist/
```

Deploy `dist/` to any static host (Vercel, Netlify, GitHub Pages).

## Project Structure

```
src/
├── primitives/      Lv.0  constants, types
├── domain/          Lv.1  pure game logic
├── application/     Lv.2  use-cases, ports
├── infrastructure/  Lv.3  HTTP loader, adapters
├── view-model/      Lv.3  Core → UIEvent projection
├── ui-event-channel Lv.3.5 View ↔ ViewModel
├── tick-generator/  Lv.4  source of time
├── audio/                 Howler sound manager
├── scene/                 PixiJS scenes (Title/Split/Result)
├── effects/               BlackHole, sparkles
└── data/                  Level data (positions, sizes, z-orders)

public/
├── images/          PNG assets (backgrounds, trash, pig, interactives)
└── sounds/          SFX + BGM
```

## Asset Credits

- All visual assets: AI-generated via Gemini Image 3 + manual placement
- All audio: AI-generated via ElevenLabs
- Inspired by *Hidden Folks* (Adriaan de Jongh) and *Hole.io* (Voodoo)

## License

MIT — see [LICENSE](LICENSE) if present.

---

🐷 *Made with love, lots of trash, and one very hungry pig.*
