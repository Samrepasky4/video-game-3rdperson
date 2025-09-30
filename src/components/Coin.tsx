import { useMemo, useRef } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import type { CoinDescriptor } from '../types';

type CoinProps = {
  data: CoinDescriptor;
  collected: boolean;
};

export const Coin = ({ data, collected }: CoinProps) => {
  const ref = useRef<Group>(null);
  const basePosition = useMemo(() => new Vector3(...data.position), [data.position]);


  useFrame((state, delta) => {
    const group = ref.current;
    if (!group) return;
    const spin = collected ? 0 : 1.8;
    group.rotation.y += delta * spin * 0.4;

    const time = state.clock.elapsedTime;
    const swayRadius = 0.4;
    const swaySpeed = 0.8;
    const verticalBob = Math.sin(time * 2 + data.id) * 0.18;

    group.position.set(
      basePosition.x + Math.cos(time * swaySpeed + data.id) * swayRadius,
      basePosition.y + 0.6 + verticalBob,
      basePosition.z + Math.sin(time * (swaySpeed * 0.87) + data.id) * swayRadius,
    );
    group.visible = !collected;
  });

  return (
    <group ref={ref} position={data.position}>
      <mesh castShadow>
        <sphereGeometry args={[0.24, 24, 24]} />
        <meshStandardMaterial
          color="#5dffb1"
          emissive="#2aff70"
          emissiveIntensity={1.25}
          roughness={0.25}
          metalness={0.05}
        />
      </mesh>
      <pointLight intensity={1.4} distance={3.6} decay={2.5} color="#61ffbf" />

    </group>
  );
};
