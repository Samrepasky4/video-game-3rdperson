import { useRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import type { CoinDescriptor } from '../types';

type CoinProps = {
  data: CoinDescriptor;
  collected: boolean;
};

export const Coin = ({ data, collected }: CoinProps) => {
  const ref = useRef<Group>(null);

  useFrame((state, delta) => {
    const group = ref.current;
    if (!group) return;
    const spin = collected ? 0 : 1.8;
    group.rotation.y += delta * spin;
    group.position.y = 0.6 + Math.sin(state.clock.elapsedTime * 2 + data.id) * 0.1;
    group.visible = !collected;
  });

  return (
    <group ref={ref} position={data.position}>
      <mesh castShadow receiveShadow>
        <torusGeometry args={[0.18, 0.05, 16, 32]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffb347" emissiveIntensity={0.4} roughness={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
        <meshStandardMaterial color="#ffe29f" emissive="#ffae34" emissiveIntensity={0.25} roughness={0.2} />
      </mesh>
    </group>
  );
};
