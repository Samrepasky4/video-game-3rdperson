import { useEffect, useMemo, useRef } from 'react';
import { Group, Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import type { CoinDescriptor } from '../types';

type PlayerProps = {
  coins: CoinDescriptor[];
  collected: Set<number>;
  onCollect: (id: number) => void;
};

const WORLD_BOUNDS = 20;
const UP = new Vector3(0, 1, 0);

export const Player = ({ coins, collected, onCollect }: PlayerProps) => {
  const controls = useKeyboardControls();
  const controlsRef = useRef(controls);
  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  const groupRef = useRef<Group>(null);
  const leftWingRef = useRef<Mesh>(null);
  const rightWingRef = useRef<Mesh>(null);
  const velocity = useRef(new Vector3());
  const desiredVelocity = useRef(new Vector3());
  const helpers = useMemo(
    () => ({
      direction: new Vector3(),
      smoothedTarget: new Vector3(),
      offset: new Vector3(0, 2.6, 5),
      camera: new Vector3(),
      coin: new Vector3(),
    }),
    [],
  );
  const bobOffset = useRef(Math.random() * Math.PI * 2);

  useFrame(({ camera }, delta) => {
    const player = groupRef.current;
    if (!player) return;

    const { forward, backward, left, right } = controlsRef.current;
    const direction = helpers.direction.set(
      Number(right) - Number(left),
      0,
      Number(backward) - Number(forward),
    );

    const hasInput = direction.lengthSq() > 0;
    if (hasInput) {
      direction.normalize();
      desiredVelocity.current.copy(direction).multiplyScalar(6);
      velocity.current.lerp(desiredVelocity.current, 1 - Math.exp(-12 * delta));
      const heading = Math.atan2(direction.x, direction.z);
      player.rotation.y = heading;
    } else {
      velocity.current.multiplyScalar(Math.exp(-10 * delta));
      if (velocity.current.lengthSq() < 0.0001) {
        velocity.current.set(0, 0, 0);
      }
    }

    player.position.addScaledVector(velocity.current, delta);
    player.position.x = Math.max(-WORLD_BOUNDS, Math.min(WORLD_BOUNDS, player.position.x));
    player.position.z = Math.max(-WORLD_BOUNDS, Math.min(WORLD_BOUNDS, player.position.z));

    bobOffset.current += delta * 2.2;
    player.position.y = 0.8 + Math.sin(bobOffset.current) * 0.2;

    const wingFlap = Math.sin(bobOffset.current * 2.8) * 0.5;
    if (leftWingRef.current && rightWingRef.current) {
      leftWingRef.current.rotation.z = 0.6 + wingFlap;
      rightWingRef.current.rotation.z = -0.6 - wingFlap;
    }

    coins.forEach((coin) => {
      if (collected.has(coin.id)) return;
      helpers.coin.set(coin.position[0], coin.position[1], coin.position[2]);
      if (helpers.coin.distanceToSquared(player.position) < 1.1) {
        onCollect(coin.id);
      }
    });

    if (helpers.smoothedTarget.lengthSq() === 0) {
      helpers.smoothedTarget.copy(player.position);
    }

    helpers.camera.copy(helpers.offset).applyAxisAngle(UP, player.rotation.y);
    helpers.smoothedTarget.lerp(player.position, 1 - Math.exp(-8 * delta));
    helpers.camera.add(helpers.smoothedTarget);
    camera.position.lerp(helpers.camera, 1 - Math.exp(-4 * delta));
    camera.lookAt(player.position.x, player.position.y + 0.6, player.position.z);
  });

  return (
    <group ref={groupRef} position={[0, 1, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#ffd1ff" emissive="#ff80ff" emissiveIntensity={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.2, 0]} castShadow>
        <coneGeometry args={[0.12, 0.4, 16]} />
        <meshStandardMaterial color="#ffd1ff" emissive="#ff80ff" emissiveIntensity={0.6} roughness={0.2} />
      </mesh>
      <mesh ref={leftWingRef} position={[0.22, 0.05, -0.05]} rotation={[0, 0, 0.8]}>
        <planeGeometry args={[0.45, 0.8]} />
        <meshStandardMaterial color="#d0f0ff" transparent opacity={0.6} emissive="#9be7ff" emissiveIntensity={0.5} />
      </mesh>
      <mesh ref={rightWingRef} position={[-0.22, 0.05, -0.05]} rotation={[0, 0, -0.8]}>
        <planeGeometry args={[0.45, 0.8]} />
        <meshStandardMaterial color="#d0f0ff" transparent opacity={0.6} emissive="#9be7ff" emissiveIntensity={0.5} />
      </mesh>
      <pointLight distance={6} intensity={1.5} color="#ffb6ff" />
    </group>
  );
};
