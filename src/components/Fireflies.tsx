import { useMemo, useRef } from 'react';
import { Color, BufferGeometry, Float32BufferAttribute, PointsMaterial } from 'three';
import { useFrame } from '@react-three/fiber';

type Firefly = {
  baseX: number;
  baseY: number;
  baseZ: number;
  speed: number;
  sway: number;
};

export const Fireflies = ({ count = 60 }: { count?: number }) => {
  const geometryRef = useRef<BufferGeometry>(new BufferGeometry());
  const fireflies = useMemo<Firefly[]>(() => {
    const instances: Firefly[] = [];
    const positions: number[] = [];
    for (let i = 0; i < count; i += 1) {
      const radius = 8 + Math.random() * 24;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = 2.4 + Math.random() * 18;
      const z = Math.sin(angle) * radius;
      positions.push(x, y, z);
      instances.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        speed: 0.4 + Math.random() * 0.9,
        sway: 0.6 + Math.random() * 1.4,
      });
    }
    geometryRef.current.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return instances;
  }, [count]);

  const materialRef = useRef<PointsMaterial>(null);

  useFrame((state) => {
    const positions = geometryRef.current.getAttribute('position') as Float32BufferAttribute;
    const time = state.clock.elapsedTime;
    for (let i = 0; i < fireflies.length; i += 1) {
      const instance = fireflies[i];
      const orbit = time * instance.sway + i;
      const y = instance.baseY + Math.sin(time * instance.speed + i) * 0.8;
      const x = instance.baseX + Math.cos(orbit) * 0.6;
      const z = instance.baseZ + Math.sin(orbit * 0.9) * 0.6;
      positions.setX(i, x);
      positions.setZ(i, z);
      positions.setY(i, y);
    }
    positions.needsUpdate = true;
    if (materialRef.current) {
      materialRef.current.opacity = 0.32 + Math.sin(state.clock.elapsedTime * 1.6) * 0.18;
      materialRef.current.size = 0.12 + Math.sin(state.clock.elapsedTime * 1.1) * 0.03;
    }
  });

  return (
    <points args={[geometryRef.current]}>
      <pointsMaterial
        ref={materialRef}
        size={0.15}
        transparent
        opacity={0.48}
        color={new Color('#9fd4ff')}
        depthWrite={false}
      />
    </points>
  );
};
