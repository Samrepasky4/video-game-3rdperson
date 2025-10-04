import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import type { Group } from 'three';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Coins } from './components/Coins';
import { Player } from './components/Player';
import { SpaceEnvironment } from './components/SpaceEnvironment';
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

  const minDistance = 3.4;
  const minDistanceSq = minDistance * minDistance;

  const isTooClose = (x: number, z: number) =>
    coins.some((coin) => {
      const [existingX, , existingZ] = coin.position;
      const dx = existingX - x;
      const dz = existingZ - z;
      return dx * dx + dz * dz < minDistanceSq;
    });

  while (coins.length < 30) {
    const x = rand() * 48 - 24;
    const z = rand() * 44 - 14;
    if (Math.abs(x) < 1.4 && z > -4 && z < 16) {
      continue;
    }
    if (isTooClose(x, z)) {
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
          <h1>Cosmic Grove Run</h1>
          <p>
            Soar with your fairy through an alien nebula garden, gather luminous orbs, and glide alongside
            drifting asteroids while your ambient soundtrack shimmers.
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
        <h1>Cosmic Grove Run</h1>
        <div className="ui-overlay__counter" aria-live="polite">
          <span className="ui-overlay__counter-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" role="presentation" focusable="false">
              <defs>
                <radialGradient id="orbGradient" cx="50%" cy="40%" r="65%">
                  <stop offset="0%" stopColor="#c9f6ff" />
                  <stop offset="45%" stopColor="#7cfbff" />
                  <stop offset="100%" stopColor="#39d7ff" />
                </radialGradient>
              </defs>
              <circle cx="16" cy="16" r="14" fill="url(#orbGradient)" stroke="#e9ffff" strokeWidth="1.6" />
              <circle cx="16" cy="16" r="6" fill="#ffffff" opacity="0.4" />
            </svg>
          </span>
          <span className="ui-overlay__counter-text">
            {collected.size}
            <span className="ui-overlay__counter-total">/{coins.length}</span>
          </span>
        </div>
        <p>Glide with WASD or the arrow keys to gather drifting starlit orbs among comets and asteroids.</p>
      </div>
      <Canvas shadows camera={{ position: [0, 3.5, -7], fov: 50 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <SpaceEnvironment playerRef={playerGroupRef} />
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
