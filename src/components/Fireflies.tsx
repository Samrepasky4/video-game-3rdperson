import { useMemo, useRef } from 'react';
import { Color, BufferGeometry, Float32BufferAttribute, PointsMaterial } from 'three';
import { useFrame } from '@react-three/fiber';

type Firefly = {
  baseY: number;
  speed: number;
};

export const Fireflies = ({ count = 60 }: { count?: number }) => {
  const geometryRef = useRef<BufferGeometry>(new BufferGeometry());
  const fireflies = useMemo<Firefly[]>(() => {
    const instances: Firefly[] = [];
    const positions: number[] = [];
    for (let i = 0; i < count; i += 1) {
      const radius = 6 + Math.random() * 14;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = 1.2 + Math.random() * 3;
      const z = Math.sin(angle) * radius;
      positions.push(x, y, z);
      instances.push({ baseY: y, speed: 0.6 + Math.random() * 1.2 });
    }
    geometryRef.current.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return instances;
  }, [count]);

  const materialRef = useRef<PointsMaterial>(null);

  useFrame((state) => {
    const positions = geometryRef.current.getAttribute('position') as Float32BufferAttribute;
    for (let i = 0; i < fireflies.length; i += 1) {
      const y = fireflies[i].baseY + Math.sin(state.clock.elapsedTime * fireflies[i].speed + i) * 0.4;
      positions.setY(i, y);
    }
    positions.needsUpdate = true;
    if (materialRef.current) {
      materialRef.current.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <points args={[geometryRef.current]}>
      <pointsMaterial ref={materialRef} size={0.14} transparent opacity={0.5} color={new Color('#ffe3ff')} depthWrite={false} />
    </points>
  );
};
