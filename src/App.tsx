import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import type { Group } from 'three';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Coins } from './components/Coins';
import { Player } from './components/Player';
import { ForestEnvironment } from './components/ForestEnvironment';
import { Fireflies } from './components/Fireflies';
import type { CoinDescriptor } from './types';

const mulberry32 = (seed: number) => {
  return () => {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const generateCoins = (): CoinDescriptor[] => {
  const rand = mulberry32(2024);
  const coins: CoinDescriptor[] = [];
  const pathCoins: Array<[number, number, number]> = [
    [0.3, 0.6, -2.5],
    [-0.6, 0.62, 1.5],
    [0.8, 0.58, 4.2],
    [-1.1, 0.64, 7.6],
    [0.4, 0.6, 11.3],
  ];

  pathCoins.forEach((position, index) => {
    coins.push({ id: index, position } satisfies CoinDescriptor);
  });

  while (coins.length < 26) {
    const x = rand() * 26 - 13;
    const z = rand() * 28 - 8;
    if (Math.abs(x) < 1.4 && z > -4 && z < 16 && rand() < 0.6) {
      continue;
    }
    const y = 0.55 + rand() * 0.25;
    coins.push({ id: coins.length, position: [x, y, z] } satisfies CoinDescriptor);
  }

  return coins;
};

const App = () => {
  const coins = useMemo(() => generateCoins(), []);
  const [started, setStarted] = useState(false);
  const [collected, setCollected] = useState<Set<number>>(() => new Set());
  const playerGroupRef = useRef<Group | null>(null);
  const handleCollect = useCallback((id: number) => {
    setCollected((previous) => {
      if (previous.has(id)) return previous;
      const next = new Set(previous);
      next.add(id);
      return next;
    });
  }, []);

  if (!started) {
    return (
      <div className="landing">
        <div className="landing__panel">
          <h1>Fairy Forest Drift</h1>
          <p>
            Drift through a twilight grove as a luminous fairy, gather resonant coins, and let your ambient
            soundtrack carry the journey.
          </p>
          <button type="button" onClick={() => setStarted(true)}>
            Play
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="ui-overlay">
        <h1>Fairy Forest Drift</h1>
        <div className="ui-overlay__counter" aria-live="polite">
          <span className="ui-overlay__counter-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" role="presentation" focusable="false">
              <defs>
                <radialGradient id="coinGradient" cx="50%" cy="45%" r="65%">
                  <stop offset="0%" stopColor="#ffe6a3" />
                  <stop offset="45%" stopColor="#ffd46d" />
                  <stop offset="100%" stopColor="#f7a93c" />
                </radialGradient>
              </defs>
              <circle cx="16" cy="16" r="14" fill="url(#coinGradient)" stroke="#fffbcd" strokeWidth="1.6" />
              <path
                d="M16 8c-4.42 0-8 2.58-8 5.76 0 1.96 1.34 3.68 3.42 4.68C10.5 19.92 11.74 23 16 23s5.5-3.08 4.58-4.56c2.08-1 3.42-2.72 3.42-4.68C24 10.58 20.42 8 16 8Zm0 2.2c3.26 0 5.8 1.6 5.8 3.56 0 1.46-1.32 2.78-3.34 3.26l-1.18.28.64 1.04c.28.46-.32 1.48-1.92 1.48s-2.2-1.02-1.92-1.48l.64-1.04-1.18-.28c-2.02-.48-3.34-1.8-3.34-3.26 0-1.96 2.54-3.56 5.8-3.56Z"
                fill="#9b5c13"
                opacity="0.7"
              />
            </svg>
          </span>
          <span className="ui-overlay__counter-text">
            {collected.size}
            <span className="ui-overlay__counter-total">/{coins.length}</span>
          </span>
        </div>
        <p>Glide with WASD or the arrow keys to gather shimmering dusk coins.</p>
      </div>
      <Canvas shadows camera={{ position: [0, 3.5, -7], fov: 50 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ForestEnvironment playerRef={playerGroupRef} />
          <Fireflies count={80} />
          <Player ref={playerGroupRef} coins={coins} collected={collected} onCollect={handleCollect} />
          <Coins coins={coins} collected={collected} />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
};

export default App;
