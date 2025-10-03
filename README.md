# Fairy Forest Drift

A third-person fairy exploration prototype built with React, TypeScript, Vite, and React Three Fiber. Glide through a twilight forest, collect luminous dusk coins, and enjoy an ambient modular-synth-inspired atmosphere.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL to explore the forest. Use `W`, `A`, `S`, `D` or the arrow keys to guide the fairy around the glade and scoop up every shimmering coin.

## Testing the project

The prototype does not ship with automated unit tests yet, so testing is a manual process:

1. **Type-check and build**

   ```bash
   npm run build
   ```

   Vite will run the TypeScript compiler and emit an optimized production bundle. If the command finishes without errors the build passed.

2. **Smoke-test the build locally**

   ```bash
   npm run preview
   ```

   Open the logged preview URL in your browser, confirm the scene loads, collect a few coins, and verify the counter updates. This is the best way to check everything end-to-end until automated coverage is added.

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

The scene blends imported glTF foliage assets with instanced shrubs/grass, a smooth-follow camera, and simple collision checks for coin collection to keep the prototype lightweight and easy to extend.

## Art assets

- **Tree model** – `public/assets/tree.gltf` is a handcrafted low-poly tree exported directly into the repository so no external downloads are required.
- **Shrub model** – `public/assets/shrub.gltf` supplies a stylised hemisphere shrub used for undergrowth instancing.
- **Procedural ground texture** – the ground material is generated at runtime inside `ForestEnvironment.tsx` using a canvas-based
  gradient and noise pass so no external texture downloads are required.

Feel free to replace these with higher fidelity assets; just update the references under `ForestEnvironment.tsx` to point to the new files.

## Troubleshooting

- **"ReactSharedInternals is undefined" in the browser console** – reinstall dependencies so that `react-reconciler@^0.29.0` is present:

  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

  The updated reconciler runtime restores compatibility between React 18 and the React Three Fiber renderer that drives the scene. If you see `ERESOLVE unable to resolve dependency tree`, clear any old lockfile and reinstall so that `@react-three/fiber@8.15.12` and `@react-three/drei@9.86.7` are pulled in alongside React 18.
