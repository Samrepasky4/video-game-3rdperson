import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Color, Group, MathUtils, Mesh, MeshStandardMaterial, PointLight, Vector3 } from 'three';
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
const MOVE_SPEED = 1.8;
const TURN_SPEED = 2.6;

export const Player = forwardRef<Group, PlayerProps>(({ coins, collected, onCollect }, ref) => {
  const controlsRef = useKeyboardControls();

  const groupRef = useRef<Group>(null);
  const leftWingRef = useRef<Mesh>(null);
  const rightWingRef = useRef<Mesh>(null);
  const bodyMaterialRef = useRef<MeshStandardMaterial>(null);
  const tailMaterialRef = useRef<MeshStandardMaterial>(null);
  const leftWingMaterialRef = useRef<MeshStandardMaterial>(null);
  const rightWingMaterialRef = useRef<MeshStandardMaterial>(null);
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
        tailStart: new Color('#5a5f72'),
        tailEnd: new Color('#69ddff'),
        tailEmissiveStart: new Color('#1b1d28'),
        tailEmissiveEnd: new Color('#36c4ff'),
        wingStart: new Color('#8ca2ba'),
        wingEnd: new Color('#b9ecff'),
        wingEmissiveStart: new Color('#1a2d3a'),
        wingEmissiveEnd: new Color('#4fe6ff'),
      },
    }),
    [],
  );
  const bobOffset = useRef(Math.random() * Math.PI * 2);

  useImperativeHandle(ref, () => groupRef.current as Group, []);

  useFrame(({ camera }, delta) => {
    const player = groupRef.current;
    if (!player) return;

    const { forward, backward, left, right } = controlsRef.current;
    const moveInput = Number(forward) - Number(backward);
    const turnInput = Number(right) - Number(left);

    if (turnInput !== 0) {
      heading.current += turnInput * TURN_SPEED * delta;
    }

    helpers.direction.set(Math.sin(heading.current), 0, Math.cos(heading.current));

    const targetSpeed = moveInput * MOVE_SPEED;
    desiredVelocity.current.copy(helpers.direction).multiplyScalar(targetSpeed);
    velocity.current.lerp(desiredVelocity.current, 1 - Math.exp(-6 * delta));

    if (moveInput === 0 && velocity.current.lengthSq() < 0.0002) {
      velocity.current.set(0, 0, 0);
    }

    player.rotation.y = MathUtils.euclideanModulo(heading.current + Math.PI, Math.PI * 2) - Math.PI;

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

    if (tailMaterialRef.current) {
      tailMaterialRef.current.color
        .copy(helpers.colors.tailStart)
        .lerp(helpers.colors.tailEnd, easedProgress);
      tailMaterialRef.current.emissive
        .copy(helpers.colors.tailEmissiveStart)
        .lerp(helpers.colors.tailEmissiveEnd, easedProgress);
      const target = MathUtils.lerp(0.12, 1.8, easedProgress);
      tailMaterialRef.current.emissiveIntensity = MathUtils.lerp(
        tailMaterialRef.current.emissiveIntensity,
        target,
        intensityLerp,
      );
    }

    const updateWingMaterial = (material: MeshStandardMaterial | null) => {
      if (!material) return;
      material.color.copy(helpers.colors.wingStart).lerp(helpers.colors.wingEnd, easedProgress);
      material.emissive
        .copy(helpers.colors.wingEmissiveStart)
        .lerp(helpers.colors.wingEmissiveEnd, easedProgress);
      const target = MathUtils.lerp(0.4, 1.5, easedProgress);
      material.emissiveIntensity = MathUtils.lerp(material.emissiveIntensity, target, intensityLerp);
      material.opacity = MathUtils.lerp(0.45, 0.8, easedProgress);
    };

    updateWingMaterial(leftWingMaterialRef.current);
    updateWingMaterial(rightWingMaterialRef.current);

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
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          ref={bodyMaterialRef}
          color="#4f5465"
          emissive="#141924"
          emissiveIntensity={0.08}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, -0.2, 0]} castShadow>
        <coneGeometry args={[0.12, 0.4, 16]} />
        <meshStandardMaterial
          ref={tailMaterialRef}
          color="#5a5f72"
          emissive="#1b1d28"
          emissiveIntensity={0.12}
          roughness={0.25}
        />
      </mesh>
      <mesh ref={leftWingRef} position={[0.22, 0.05, -0.05]} rotation={[0, 0, 0.8]}>
        <planeGeometry args={[0.45, 0.8]} />
        <meshStandardMaterial
          ref={leftWingMaterialRef}
          color="#8ca2ba"
          transparent
          opacity={0.5}
          emissive="#1a2d3a"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh ref={rightWingRef} position={[-0.22, 0.05, -0.05]} rotation={[0, 0, -0.8]}>
        <planeGeometry args={[0.45, 0.8]} />
        <meshStandardMaterial
          ref={rightWingMaterialRef}
          color="#8ca2ba"
          transparent
          opacity={0.5}
          emissive="#1a2d3a"
          emissiveIntensity={0.4}
        />
      </mesh>
      <pointLight ref={glowRef} distance={6} intensity={0.6} color="#1f3143" />
    </group>
  );
});

Player.displayName = 'Player';
