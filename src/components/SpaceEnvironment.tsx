import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { Stars } from '@react-three/drei';
import type { MutableRefObject } from 'react';

const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type AsteroidDescriptor = {
  radius: number;
  offset: number;
  speed: number;
  tilt: number;
  scale: number;
};

const createAsteroidDescriptors = (): AsteroidDescriptor[] => {
  const rand = mulberry32(2077);
  const asteroids: AsteroidDescriptor[] = [];
  const asteroidCount = 26;
  for (let index = 0; index < asteroidCount; index += 1) {
    asteroids.push({
      radius: 24 + rand() * 52,
      offset: rand() * Math.PI * 2,
      speed: 0.08 + rand() * 0.18,
      tilt: rand() * Math.PI * 0.7,
      scale: 0.6 + rand() * 2.2,
    });
  }

  return asteroids;
};
type AsteroidFieldProps = {
  descriptors: AsteroidDescriptor[];
};

const AsteroidField = ({ descriptors }: AsteroidFieldProps) => {
  return (
    <group>
      {descriptors.map((asteroid, index) => (
        <Asteroid key={`asteroid-${index}`} descriptor={asteroid} />
      ))}
    </group>
  );
};

type AsteroidProps = {
  descriptor: AsteroidDescriptor;
};

const Asteroid = ({ descriptor }: AsteroidProps) => {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const { radius, offset, speed, tilt, scale } = descriptor;
    const t = clock.elapsedTime * speed + offset;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    const y = 8 + Math.sin(t * 0.7 + offset) * 6 + Math.cos(t * 1.3) * 2;
    group.position.set(x, y, z);
    group.rotation.set(Math.sin(t * 0.6) * 0.8 + tilt, t * 0.4, Math.cos(t * 0.5) * 0.6);
    group.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#5e6a88"
          roughness={0.85}
          metalness={0.3}
          emissive="#1d2234"
          emissiveIntensity={0.25}
        />
      </mesh>
    </group>
  );
};

type CometDescriptor = {
  radius: number;
  speed: number;
  height: number;
  offset: number;
  color: string;
};

const Comet = ({ descriptor }: { descriptor: CometDescriptor }) => {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const { radius, speed, height, offset } = descriptor;
    const t = clock.elapsedTime * speed + offset;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    const y = height + Math.sin(t * 1.2) * 1.4;
    group.position.set(x, y, z);
    group.rotation.set(0, -t + Math.PI / 2, 0);
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow>
        <capsuleGeometry args={[0.12, 1.4, 4, 12]} />
        <meshStandardMaterial
          color={descriptor.color}
          emissive={descriptor.color}
          emissiveIntensity={1.6}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0, 0, -0.8]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.2, 1.6, 12]} />
        <meshStandardMaterial
          color={descriptor.color}
          emissive={descriptor.color}
          emissiveIntensity={0.9}
          transparent
          opacity={0.4}
        />
      </mesh>
      <pointLight intensity={1.3} distance={7} decay={2.4} color={descriptor.color} />
    </group>
  );
};

type SpaceEnvironmentProps = {
  playerRef: MutableRefObject<Group | null>;
};

export const SpaceEnvironment = ({ playerRef: _playerRef }: SpaceEnvironmentProps) => {
  void _playerRef;
  const asteroids = useMemo(() => createAsteroidDescriptors(), []);

  const comets = useMemo<CometDescriptor[]>(
    () => [
      { radius: 32, speed: 0.38, height: 18, offset: 0.2, color: '#6bd8ff' },
      { radius: 46, speed: 0.28, height: 26, offset: 1.1, color: '#ff9bff' },
      { radius: 54, speed: 0.22, height: 34, offset: 2.4, color: '#9bf9ff' },
    ],
    [],
  );

  return (
    <group>
      <color attach="background" args={['#000000']} />
      <Stars radius={620} depth={220} count={8200} factor={4.6} saturation={0.6} fade speed={0.2} />

      <ambientLight intensity={0.2} color="#6fa6ff" />
      <directionalLight position={[22, 30, -16]} intensity={0.45} color="#9cc6ff" castShadow />
      <pointLight position={[-32, 18, 22]} intensity={0.4} distance={160} decay={2} color="#ff9ce8" />
      <pointLight position={[38, 16, -36]} intensity={0.35} distance={140} decay={1.9} color="#78d8ff" />

      <AsteroidField descriptors={asteroids} />

      {comets.map((descriptor, index) => (
        <Comet key={`comet-${index}`} descriptor={descriptor} />
      ))}
    </group>
  );
};
