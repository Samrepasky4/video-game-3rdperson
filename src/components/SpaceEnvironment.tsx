import { forwardRef, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';
import { Stars } from '@react-three/drei';
import type { MutableRefObject } from 'react';

const matrix = new Matrix4();
const quaternion = new Quaternion();
const scaleVector = new Vector3();
const positionVector = new Vector3();
const cameraPosition = new Vector3();
const playerWorld = new Vector3();
const cameraToPlayer = new Vector3();
const cameraToObject = new Vector3();
const direction = new Vector3();
const objectWorld = new Vector3();
const upVector = new Vector3(0, 1, 0);

const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type PlantPlacement = {
  position: [number, number, number];
  rotation: number;
  stalkScale: number;
  bulbScale: number;
  hue: number;
};

type SproutPlacement = {
  position: [number, number, number];
  rotation: number;
  scale: number;
  hue: number;
};

type AsteroidDescriptor = {
  radius: number;
  offset: number;
  speed: number;
  tilt: number;
  scale: number;
};

type SpaceLayout = {
  plants: PlantPlacement[];
  sprouts: SproutPlacement[];
  asteroids: AsteroidDescriptor[];
};

const createSpaceLayout = (): SpaceLayout => {
  const rand = mulberry32(2077);
  const plants: PlantPlacement[] = [];
  const sprouts: SproutPlacement[] = [];
  const asteroids: AsteroidDescriptor[] = [];
  const positions: Vector3[] = [];
  const plantCount = 18;
  const minSpacing = 7.5;
  let attempts = 0;

  while (plants.length < plantCount && attempts < 2000) {
    attempts += 1;
    const x = rand() * 260 - 130;
    const z = rand() * 260 - 130;

    if (Math.abs(x) < 4 && z > -12 && z < 18) {
      continue;
    }

    const candidate = new Vector3(x, 0, z);
    const tooClose = positions.some((position) => position.distanceToSquared(candidate) < minSpacing * minSpacing);
    if (tooClose) {
      continue;
    }

    const hue = 0.55 + rand() * 0.18;
    const stalkScale = 1.5 + rand() * 2.4;
    const bulbScale = 1 + rand() * 1.6;
    plants.push({
      position: [x, 0, z],
      rotation: rand() * Math.PI * 2,
      stalkScale,
      bulbScale,
      hue,
    });
    positions.push(candidate);
  }

  const sproutCount = 120;
  for (let index = 0; index < sproutCount; index += 1) {
    const x = rand() * 280 - 140;
    const z = rand() * 260 - 130;
    if (Math.abs(x) < 3 && z > -10 && z < 20 && rand() < 0.7) continue;
    const hue = 0.48 + rand() * 0.22;
    sprouts.push({
      position: [x, 0, z],
      rotation: rand() * Math.PI * 2,
      scale: 0.4 + rand() * 1.1,
      hue,
    });
  }

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

  return { plants, sprouts, asteroids };
};

type AlienPlantProps = {
  placement: PlantPlacement;
};

const AlienPlant = forwardRef<Group, AlienPlantProps>(({ placement }, ref) => {
  const { position, rotation, stalkScale, bulbScale, hue } = placement;
  const baseColor = useMemo(() => new Color().setHSL(hue, 0.65, 0.42), [hue]);
  const glowColor = useMemo(() => new Color().setHSL(hue, 0.75, 0.68), [hue]);
  const petalColor = useMemo(() => new Color().setHSL(hue + 0.08, 0.55, 0.62), [hue]);

  return (
    <group ref={ref} position={position} rotation={[0, rotation, 0]} scale={[1, 1, 1]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.35, 2.4 * stalkScale, 10]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor.clone().multiplyScalar(0.18)}
          roughness={0.58}
          metalness={0.12}
        />
      </mesh>
      <mesh position={[0, 1.6 * stalkScale, 0]} castShadow>
        <sphereGeometry args={[0.5 * bulbScale, 24, 24]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor.clone().multiplyScalar(0.8)}
          emissiveIntensity={0.9}
          roughness={0.34}
        />
      </mesh>
      <mesh position={[0, 1.2 * stalkScale, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35 * bulbScale, 0.7 * bulbScale, 12, 1]} />
        <meshStandardMaterial
          color={petalColor}
          emissive={petalColor.clone().multiplyScalar(0.35)}
          transparent
          opacity={0.8}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
});

AlienPlant.displayName = 'AlienPlant';

type SproutFieldProps = {
  sprouts: SproutPlacement[];
};

const SproutField = ({ sprouts }: SproutFieldProps) => {
  const sproutsRef = useRef<InstancedMesh>(null);

  useEffect(() => {
    if (!sproutsRef.current) return;

    sprouts.forEach((sprout, index) => {
      const { position, rotation, scale, hue } = sprout;
      quaternion.setFromAxisAngle(upVector, rotation);
      const color = new Color().setHSL(hue, 0.7, 0.55);
      matrix.compose(
        positionVector.set(position[0], position[1] + scale * 0.3, position[2]),
        quaternion,
        scaleVector.set(scale * 0.35, scale, scale * 0.35),
      );
      sproutsRef.current!.setMatrixAt(index, matrix);
      sproutsRef.current!.setColorAt(index, color);
    });

    sproutsRef.current.instanceMatrix.needsUpdate = true;
    if (sproutsRef.current.instanceColor) {
      sproutsRef.current.instanceColor.needsUpdate = true;
    }
  }, [sprouts]);

  return (
    <instancedMesh ref={sproutsRef} args={[undefined, undefined, sprouts.length]} castShadow receiveShadow>
      <coneGeometry args={[0.6, 1.6, 6]} />
      <meshStandardMaterial vertexColors roughness={0.72} metalness={0.05} emissiveIntensity={0.2} />
    </instancedMesh>
  );
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

export const SpaceEnvironment = ({ playerRef }: SpaceEnvironmentProps) => {
  const layout = useMemo(() => createSpaceLayout(), []);
  const plantRefs = useRef<Array<Group | null>>([]);

  if (plantRefs.current.length !== layout.plants.length) {
    plantRefs.current = new Array(layout.plants.length).fill(null);
  }

  const comets = useMemo<CometDescriptor[]>(
    () => [
      { radius: 32, speed: 0.38, height: 18, offset: 0.2, color: '#6bd8ff' },
      { radius: 46, speed: 0.28, height: 26, offset: 1.1, color: '#ff9bff' },
      { radius: 54, speed: 0.22, height: 34, offset: 2.4, color: '#9bf9ff' },
    ],
    [],
  );

  useFrame(({ camera }) => {
    const player = playerRef.current;
    if (!player) return;

    camera.getWorldPosition(cameraPosition);
    player.getWorldPosition(playerWorld);
    cameraToPlayer.subVectors(playerWorld, cameraPosition);
    const distanceToPlayer = cameraToPlayer.length();

    if (distanceToPlayer < 0.5) {
      plantRefs.current.forEach((plant) => plant && (plant.visible = true));
      return;
    }

    direction.copy(cameraToPlayer).divideScalar(distanceToPlayer);

    plantRefs.current.forEach((plant) => {
      if (!plant) return;
      plant.getWorldPosition(objectWorld);
      cameraToObject.subVectors(objectWorld, cameraPosition);
      const projection = cameraToObject.dot(direction);
      if (projection <= 0 || projection >= distanceToPlayer) {
        plant.visible = true;
        return;
      }
      const distanceSq = cameraToObject.lengthSq();
      const perpendicularSq = Math.max(0, distanceSq - projection * projection);
      plant.visible = perpendicularSq > 1.8;
    });
  });

  return (
    <group>
      <color attach="background" args={['#040b1d']} />
      <fog attach="fog" args={['#040b1d', 38, 220]} />
      <Stars radius={620} depth={220} count={7800} factor={5.2} saturation={0.8} fade speed={0.24} />

      <ambientLight intensity={0.34} color="#5f79ff" />
      <directionalLight
        position={[26, 34, -18]}
        intensity={0.55}
        color="#c1d6ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={260}
      />
      <pointLight position={[-48, 22, 26]} intensity={0.6} distance={200} decay={2.2} color="#ff9ce8" />
      <pointLight position={[54, 18, -42]} intensity={0.5} distance={180} decay={2} color="#78d8ff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[520, 520, 1, 1]} />
        <meshStandardMaterial color="#071022" roughness={0.94} metalness={0.08} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
        <circleGeometry args={[44, 160]} />
        <meshStandardMaterial
          color="#0b1638"
          emissive="#0b2858"
          emissiveIntensity={0.4}
          roughness={0.96}
        />
      </mesh>

      {layout.plants.map((plant, index) => (
        <AlienPlant
          key={`plant-${index}`}
          placement={plant}
          ref={(node) => {
            plantRefs.current[index] = node;
          }}
        />
      ))}

      <SproutField sprouts={layout.sprouts} />
      <AsteroidField descriptors={layout.asteroids} />

      {comets.map((descriptor, index) => (
        <Comet key={`comet-${index}`} descriptor={descriptor} />
      ))}
    </group>
  );
};
