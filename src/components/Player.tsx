import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Color, Group, MathUtils, MeshStandardMaterial, PointLight, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import type { CoinDescriptor } from '../types';

type PlayerProps = {
  coins: CoinDescriptor[];
  collected: Set<number>;
  onCollect: (id: number) => void;
  controlsEnabled: boolean;
};

const WORLD_BOUNDS = 20;
const UP = new Vector3(0, 1, 0);
const MOVE_SPEED = 1.8;
const TURN_SPEED = 2.6;

export const Player = forwardRef<Group, PlayerProps>(({ coins, collected, onCollect, controlsEnabled }, ref) => {
  const controls = useKeyboardControls();

  const groupRef = useRef<Group>(null);
  const bodyMaterialRef = useRef<MeshStandardMaterial>(null);
  const glowRef = useRef<PointLight>(null);
  const velocity = useRef(new Vector3());
  const desiredVelocity = useRef(new Vector3());
  const heading = useRef(0);
  const visualProgress = useRef(0);
  const helpers = useMemo(
    () => ({
      direction: new Vector3(),
      smoothedTarget: new Vector3(),
      offset: new Vector3(0, 2.6, -6.5),
      camera: new Vector3(),
      coin: new Vector3(),
      colors: {
        working: new Color(),
        bodyStart: new Color('#4f5465'),
        bodyEnd: new Color('#59d3ff'),
        bodyEmissiveStart: new Color('#141924'),
        bodyEmissiveEnd: new Color('#2fb6ff'),
      },
    }),
    [],
  );
  const bobOffset = useRef(Math.random() * Math.PI * 2);

  useImperativeHandle(ref, () => groupRef.current as Group, []);

  useFrame(({ camera }, delta) => {
    const player = groupRef.current;
    if (!player) return;

    const { forward, backward, left, right } = controls.state.current;
    const moveInput = controlsEnabled ? Number(forward) - Number(backward) : 0;
    const turnInput = controlsEnabled ? Number(right) - Number(left) : 0;

    if (turnInput !== 0) {
      heading.current += turnInput * TURN_SPEED * delta;
    }

    helpers.direction.set(Math.sin(heading.current), 0, Math.cos(heading.current));

    const targetSpeed = moveInput * MOVE_SPEED;
    desiredVelocity.current.copy(helpers.direction).multiplyScalar(targetSpeed);
    velocity.current.lerp(desiredVelocity.current, 1 - Math.exp(-6 * delta));

    if (!controlsEnabled) {
      velocity.current.multiplyScalar(Math.exp(-8 * delta));
    }

    if (moveInput === 0 && velocity.current.lengthSq() < 0.0002) {
      velocity.current.set(0, 0, 0);
    }

    player.rotation.y = MathUtils.euclideanModulo(heading.current + Math.PI, Math.PI * 2) - Math.PI;

    player.position.addScaledVector(velocity.current, delta);
    player.position.x = Math.max(-WORLD_BOUNDS, Math.min(WORLD_BOUNDS, player.position.x));
    player.position.z = Math.max(-WORLD_BOUNDS, Math.min(WORLD_BOUNDS, player.position.z));

    bobOffset.current += delta * 2.2;
    player.position.y = 0.8 + Math.sin(bobOffset.current) * 0.2;

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
    helpers.smoothedTarget.lerp(player.position, 1 - Math.exp(-5 * delta));
    helpers.camera.add(helpers.smoothedTarget);
    camera.position.lerp(helpers.camera, 1 - Math.exp(-3 * delta));
    camera.lookAt(player.position.x, player.position.y + 0.6, player.position.z);

    const progress = Math.min(1, collected.size / Math.max(1, coins.length));
    const smoothing = 1 - Math.exp(-3.2 * delta);
    visualProgress.current = MathUtils.lerp(visualProgress.current, progress, smoothing);
    if (Math.abs(progress - visualProgress.current) < 0.0001) {
      visualProgress.current = progress;
    }
    const easedProgress = 1 - (1 - visualProgress.current) * (1 - visualProgress.current);
    const intensityLerp = 1 - Math.exp(-6 * delta);

    if (bodyMaterialRef.current) {
      bodyMaterialRef.current.color
        .copy(helpers.colors.bodyStart)
        .lerp(helpers.colors.bodyEnd, easedProgress);
      bodyMaterialRef.current.emissive
        .copy(helpers.colors.bodyEmissiveStart)
        .lerp(helpers.colors.bodyEmissiveEnd, easedProgress);
      const target = MathUtils.lerp(0.08, 1.6, easedProgress);
      bodyMaterialRef.current.emissiveIntensity = MathUtils.lerp(
        bodyMaterialRef.current.emissiveIntensity,
        target,
        intensityLerp,
      );
    }

    if (glowRef.current) {
      const targetIntensity = MathUtils.lerp(0.4, 2.4, easedProgress);
      glowRef.current.intensity = MathUtils.lerp(glowRef.current.intensity, targetIntensity, intensityLerp);
      helpers.colors.working.copy(helpers.colors.bodyEmissiveStart).lerp(helpers.colors.bodyEmissiveEnd, easedProgress);
      glowRef.current.color.copy(helpers.colors.working);
    }
  });

  return (
    <group ref={groupRef} position={[0, 1, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.4, 48, 48]} />
        <meshStandardMaterial
          ref={bodyMaterialRef}
          color="#4f5465"
          emissive="#141924"
          emissiveIntensity={0.08}
          roughness={0.35}
        />
      </mesh>
      <pointLight ref={glowRef} distance={6} intensity={0.6} color="#1f3143" />
    </group>
  );
});

Player.displayName = 'Player';
