import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Group } from 'three';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Coins } from './components/Coins';
import { Player } from './components/Player';
import { SpaceEnvironment } from './components/SpaceEnvironment';
import { Fireflies } from './components/Fireflies';
import { TouchControls } from './components/TouchControls';
import type { CoinDescriptor } from './types';
import { useKeyboardControls } from './hooks/useKeyboardControls';

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
  const [introComplete, setIntroComplete] = useState(false);
  const [collected, setCollected] = useState<Set<number>>(() => new Set());
  const playerGroupRef = useRef<Group | null>(null);
  const controls = useKeyboardControls();

  const handleCollect = useCallback((id: number) => {
    setCollected((previous) => {
      if (previous.has(id)) return previous;
      const next = new Set(previous);
      next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!introComplete) {
      controls.reset();
    }
  }, [controls, introComplete]);

  const handlePlay = useCallback(() => {
    controls.reset();
    setCollected(() => new Set());
    setStarted(true);
    setIntroComplete(false);
  }, [controls]);

  const handleBegin = useCallback(() => {
    controls.reset();
    setIntroComplete(true);
  }, [controls]);

  if (!started) {
    return (
      <div className="landing">
        <div className="landing__panel">
          <h1>hungry for bubbles</h1>
          <p>
            
          </p>
          <button type="button" onClick={handlePlay}>
            Play
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="">
      
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
       
      </div>
      <Canvas shadows camera={{ position: [0, 3.5, -7], fov: 50 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <SpaceEnvironment playerRef={playerGroupRef} />
          <Fireflies count={120} />
          <Player
            ref={playerGroupRef}
            coins={coins}
            collected={collected}
            onCollect={handleCollect}
            controlsEnabled={introComplete}
          />
          <Coins coins={coins} collected={collected} />
        </Suspense>
      </Canvas>
      <TouchControls controls={controls} disabled={!introComplete} />
      {!introComplete && (
        <div className="intro-overlay" role="dialog" aria-modal="true">
          <div className="intro-overlay__content">
            <div className="intro-overlay__character">
              <div className="intro-overlay__avatar" aria-hidden="true" />
              <div className="intro-overlay__speech" aria-live="polite">
                <p>Need more glow! Have you seen those orbs?</p>
                <div className="intro-overlay__orbs" aria-hidden="true">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <span key={index} className="intro-overlay__orb" />
                  ))}
                </div>
              </div>
            </div>
            <button type="button" onClick={handleBegin} className="intro-overlay__button">
              Let&apos;s snack on starlight
            </button>
          </div>
        </div>
      )}
      <Loader />
    </>
  );
};

export default App;
