import { Suspense, useCallback, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Coins } from './components/Coins';
import { Player } from './components/Player';
import { ForestEnvironment } from './components/ForestEnvironment';
import { Fireflies } from './components/Fireflies';
import type { CoinDescriptor } from './types';

const generateCoins = (): CoinDescriptor[] =>
  Array.from({ length: 18 }, (_, index) => {
    const angle = (index / 18) * Math.PI * 2;
    const radius = 6 + (index % 4) * 2 + Math.sin(index * 1.4) * 1.5;
    const height = 0.6 + Math.sin(index * 2.3) * 0.1;
    return {
      id: index,
      position: [Math.cos(angle) * radius, height, Math.sin(angle) * radius],
    } satisfies CoinDescriptor;
  });

const App = () => {
  const coins = useMemo(() => generateCoins(), []);
  const [collected, setCollected] = useState<Set<number>>(() => new Set());

  const handleCollect = useCallback((id: number) => {
    setCollected((previous) => {
      if (previous.has(id)) return previous;
      const next = new Set(previous);
      next.add(id);
      return next;
    });
  }, []);

  return (
    <>
      <div className="ui-overlay">
        <h1>Fairy Forest Drift</h1>
        <p>Coins collected: {collected.size} / {coins.length}</p>
        <p>Glide with WASD or the arrow keys to gather shimmering dusk coins.</p>
      </div>
      <Canvas shadows camera={{ position: [0, 3.5, -7], fov: 50 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ForestEnvironment />
          <Fireflies count={80} />
          <Player coins={coins} collected={collected} onCollect={handleCollect} />
          <Coins coins={coins} collected={collected} />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
};

export default App;
