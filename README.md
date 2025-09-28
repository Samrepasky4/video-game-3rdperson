# Fairy Forest Drift

A third-person fairy exploration prototype built with React, TypeScript, Vite, and React Three Fiber. Glide through a twilight forest, collect luminous dusk coins, and enjoy an ambient modular-synth-inspired atmosphere.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL to explore the forest. Use `W`, `A`, `S`, `D` or the arrow keys to guide the fairy around the glade and scoop up every shimmering coin.

## Scripts

- `npm run dev` – start the development server with hot reloading.
- `npm run build` – type-check and build the production bundle.
- `npm run preview` – serve the production build locally.

## Project structure

```
├── src
│   ├── App.tsx                 # Main scene composition and UI overlay
│   ├── main.tsx                # React entry point
│   ├── components
│   │   ├── Player.tsx          # Fairy controller and third-person camera follow
│   │   ├── Coins.tsx / Coin.tsx# Collectible coin visuals
│   │   ├── ForestEnvironment.tsx
│   │   │                        # Lighting, trees, and ground composition
│   │   └── Fireflies.tsx       # Floating ambient particles
│   ├── hooks
│   │   └── useKeyboardControls.ts
│   ├── styles
│   │   └── global.css
│   └── types.ts
└── vite.config.ts
```

The scene uses instanced meshes for trees, a smooth-follow camera, and simple collision checks for coin collection to keep the prototype lightweight and easy to extend.
