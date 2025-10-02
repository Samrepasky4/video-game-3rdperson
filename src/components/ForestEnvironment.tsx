
import { forwardRef, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  CanvasTexture,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  RepeatWrapping,
  Vector3,
} from 'three';
import { Sky, Stars, useGLTF } from '@react-three/drei';
import type { MutableRefObject } from 'react';

const matrix = new Matrix4();
const quaternion = new Quaternion();
const scaleVector = new Vector3();
const positionVector = new Vector3();
const cameraPosition = new Vector3();
const playerWorld = new Vector3();
const cameraToPlayer = new Vector3();
const cameraToTree = new Vector3();
const direction = new Vector3();
const treeWorld = new Vector3();
const upVector = new Vector3(0, 1, 0);

const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type TreeVariant = 'pine' | 'oak' | 'birch';

type TreePlacement = {
  position: [number, number, number];
  rotation: number;
  scale: number;
  variant: TreeVariant;
};

type FoliagePlacement = {
  position: [number, number, number];
  rotation: number;
  scale: number;
};

type ForestLayout = {
  trees: TreePlacement[];
  shrubs: FoliagePlacement[];
  grass: FoliagePlacement[];
};

const TREE_VARIANTS: Record<
  TreeVariant,
  { bark: string; leaves: string; minScale: number; maxScale: number }
> = {
  pine: { bark: '#3a2a1a', leaves: '#1f4f33', minScale: 1.8, maxScale: 2.4 },
  oak: { bark: '#3b2d1f', leaves: '#2a6c36', minScale: 1.4, maxScale: 1.9 },
  birch: { bark: '#d8dfe8', leaves: '#35724b', minScale: 1.2, maxScale: 1.6 },
};

const createForestLayout = (): ForestLayout => {
  const rand = mulberry32(2025);
  const trees: TreePlacement[] = [];
  const shrubs: FoliagePlacement[] = [];
  const grass: FoliagePlacement[] = [];
  const placedTreePositions: Vector3[] = [];
  const treeCount = 26;
  const minTreeSpacing = 6.5;
  let attempts = 0;

  while (trees.length < treeCount && attempts < 1600) {
    attempts += 1;
    const x = rand() * 220 - 110;
    const z = rand() * 220 - 110;

    if (Math.abs(x) < 5 && z > -10 && z < 24) {

      continue;
    }

    const candidate = new Vector3(x, 0, z);
    const tooClose = placedTreePositions.some(
      (position) => position.distanceToSquared(candidate) < minTreeSpacing * minTreeSpacing,
    );

    if (tooClose) {
      continue;
    }

    const roll = rand();
    const variant: TreeVariant = roll < 0.45 ? 'pine' : roll < 0.8 ? 'oak' : 'birch';
    const variantConfig = TREE_VARIANTS[variant];
    const scale = variantConfig.minScale + rand() * (variantConfig.maxScale - variantConfig.minScale);
    const rotation = rand() * Math.PI * 2;

    trees.push({ position: [x, 0, z], rotation, scale, variant });
    placedTreePositions.push(candidate);
  }

  const shrubCount = 34;
  for (let index = 0; index < shrubCount; index += 1) {
    const x = rand() * 200 - 100;
    const z = rand() * 200 - 100;
    if (Math.abs(x) < 3 && z > -9 && z < 22) continue;
    shrubs.push({ position: [x, 0, z], rotation: rand() * Math.PI * 2, scale: 0.7 + rand() * 0.8 });
  }

  const grassCount = 140;
  for (let index = 0; index < grassCount; index += 1) {
    const x = rand() * 230 - 115;
    const z = rand() * 220 - 110;
    if (Math.abs(x) < 3 && z > -8 && z < 20 && rand() < 0.6) continue;
    grass.push({ position: [x, 0, z], rotation: rand() * Math.PI * 2, scale: 0.6 + rand() * 0.8 });
  }

  return { trees, shrubs, grass };
};

type TreeAssetProps = {
  scene: Group;
  placement: TreePlacement;
  barkColor: string;
  leafColor: string;
};

const TreeAssetInstance = forwardRef<Group, TreeAssetProps>(({ scene, placement, barkColor, leafColor }, ref) => {
  const { position, rotation, scale } = placement;
  const clone = useMemo(() => {
    const cloned = scene.clone(true);
    const bark = new Color(barkColor);
    const leaves = new Color(leafColor);
    const emissiveLeaves = leaves.clone().multiplyScalar(0.18);
    const emissiveBark = bark.clone().multiplyScalar(0.05);
    cloned.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const material = (mesh.material as MeshStandardMaterial).clone();
        const name = mesh.name.toLowerCase();
        if (name.includes('leaf') || name.includes('canopy')) {
          material.color = leaves.clone();
          material.emissive = emissiveLeaves.clone();
          material.roughness = 0.65;
        } else {
          material.color = bark.clone();
          material.emissive = emissiveBark.clone();
          material.roughness = 0.85;
        }
        mesh.material = material;
      }
    });
    return cloned;
  }, [scene, barkColor, leafColor]);

  return (
    <group ref={ref} position={position} rotation={[0, rotation, 0]} scale={scale}>
      <primitive object={clone} />
    </group>
  );
});

TreeAssetInstance.displayName = 'TreeAssetInstance';

type ForestEnvironmentProps = {
  playerRef: MutableRefObject<Group | null>;
};

export const ForestEnvironment = ({ playerRef }: ForestEnvironmentProps) => {
  const layout = useMemo(() => createForestLayout(), []);
  const treeModel = useGLTF('/assets/tree.gltf');
  const shrubModel = useGLTF('/assets/shrub.gltf');
  const groundTexture = useMemo<CanvasTexture | null>(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }

    const gradient = context.createRadialGradient(128, 128, 12, 128, 128, 150);
    gradient.addColorStop(0, '#2d3820');
    gradient.addColorStop(0.4, '#242f18');
    gradient.addColorStop(1, '#1a2411');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const noise = context.createImageData(canvas.width, canvas.height);
    for (let index = 0; index < noise.data.length; index += 4) {
      const shade = 18 + Math.random() * 30;
      noise.data[index] = shade + Math.random() * 18;
      noise.data[index + 1] = shade + Math.random() * 10;
      noise.data[index + 2] = shade;
      noise.data[index + 3] = 36 + Math.random() * 48;
    }
    context.putImageData(noise, 0, 0);

    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(24, 24);
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }, []);
  const shrubMesh = useMemo(() => {
    let mesh: Mesh | null = null;
    shrubModel.scene.traverse((child) => {
      if (!mesh && (child as Mesh).isMesh) {
        mesh = child as Mesh;
      }
    });
    return mesh;
  }, [shrubModel.scene]);

  const shrubsRef = useRef<InstancedMesh>(null);
  const grassRef = useRef<InstancedMesh>(null);
  const treeRefs = useRef<Array<Group | null>>([]);

  if (treeRefs.current.length !== layout.trees.length) {
    treeRefs.current = new Array(layout.trees.length).fill(null);
  }

  useEffect(() => {
    if (!shrubsRef.current || !shrubMesh) return;

    layout.shrubs.forEach((item, index) => {
      quaternion.setFromAxisAngle(upVector, item.rotation);
      matrix.compose(
        positionVector.set(item.position[0], item.position[1] + item.scale * 0.45, item.position[2]),
        quaternion,
        scaleVector.setScalar(item.scale),
      );
      shrubsRef.current!.setMatrixAt(index, matrix);
    });
    shrubsRef.current.instanceMatrix.needsUpdate = true;
  }, [layout.shrubs, shrubMesh]);

  useEffect(() => {
    if (!grassRef.current) return;

    layout.grass.forEach((item, index) => {
      quaternion.setFromAxisAngle(upVector, item.rotation);
      matrix.compose(
        positionVector.set(item.position[0], item.position[1] + item.scale * 0.3, item.position[2]),
        quaternion,
        scaleVector.set(item.scale * 0.35, item.scale, item.scale * 0.35),
      );
      grassRef.current!.setMatrixAt(index, matrix);
    });
    grassRef.current.instanceMatrix.needsUpdate = true;
  }, [layout.grass]);


  useFrame(({ camera }) => {
    const player = playerRef.current;
    if (!player) return;

    camera.getWorldPosition(cameraPosition);
    player.getWorldPosition(playerWorld);
    cameraToPlayer.subVectors(playerWorld, cameraPosition);
    const distanceToPlayer = cameraToPlayer.length();

    if (distanceToPlayer < 0.5) {
      treeRefs.current.forEach((tree) => tree && (tree.visible = true));
      return;
    }

    direction.copy(cameraToPlayer).divideScalar(distanceToPlayer);

    treeRefs.current.forEach((tree) => {
      if (!tree) return;
      tree.getWorldPosition(treeWorld);
      cameraToTree.subVectors(treeWorld, cameraPosition);
      const projection = cameraToTree.dot(direction);
      if (projection <= 0 || projection >= distanceToPlayer) {
        tree.visible = true;
        return;
      }
      const distanceSq = cameraToTree.lengthSq();
      const perpendicularSq = Math.max(0, distanceSq - projection * projection);
      tree.visible = perpendicularSq > 1.6;
    });
  });

  const shrubMaterial = useMemo(() => {
    if (!shrubMesh) return undefined;
    return (shrubMesh.material as MeshStandardMaterial).clone();
  }, [shrubMesh]);

  return (
    <group>
      <Sky
        distance={42000}
        sunPosition={[-24, -10, -36]}
        inclination={0.92}
        azimuth={0.3}
        mieCoefficient={0.0022}
        mieDirectionalG={0.96}
        rayleigh={0.22}
        turbidity={1.4}
        exposure={0.18}
      />
      <Stars radius={520} depth={180} count={6200} factor={4.4} saturation={0.8} fade speed={0.22} />
      <color attach="background" args={['#030a27']} />
      <fog attach="fog" args={['#081226', 24, 160]} />
      <hemisphereLight intensity={0.38} skyColor="#1b2f6a" groundColor="#05090f" />
      <directionalLight
        position={[22, 18, -12]}
        intensity={0.4}
        color="#f9c6ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={180}
      />
      <pointLight position={[-34, 26, -42]} intensity={0.62} color="#ffe0c8" distance={120} decay={2.4} />

      <ambientLight intensity={0.3} color="#6a7fe2" />

      <mesh position={[-34, 26, -42]} castShadow>
        <sphereGeometry args={[3.6, 64, 64]} />
        <meshStandardMaterial
          color="#f7f5e9"
          emissive="#f0e7c0"
          emissiveIntensity={0.75}
          roughness={0.4}
          metalness={0}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[420, 420, 1, 1]} />
        <meshStandardMaterial map={groundTexture ?? undefined} roughness={0.92} metalness={0.02} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <circleGeometry args={[36, 140]} />
        <meshStandardMaterial
          color="#11251c"
          roughness={1}
          metalness={0}
          emissive="#0d2c22"
          emissiveIntensity={0.16}
        />
      </mesh>

      {layout.trees.map((tree, index) => {
        const variant = TREE_VARIANTS[tree.variant];
        return (
          <TreeAssetInstance
            key={`tree-${index}`}
            ref={(node) => {
              treeRefs.current[index] = node;
            }}
            scene={treeModel.scene}
            placement={tree}
            barkColor={variant.bark}
            leafColor={variant.leaves}
          />
        );
      })}

      {shrubMesh && shrubMaterial && (
        <instancedMesh
          ref={shrubsRef}
          args={[shrubMesh.geometry, shrubMaterial, layout.shrubs.length]}
          castShadow
          receiveShadow
        />
      )}

      <instancedMesh ref={grassRef} args={[undefined, undefined, layout.grass.length]} receiveShadow>
        <coneGeometry args={[0.5, 1.4, 6]} />

        <meshStandardMaterial color="#1f6a3b" emissive="#0f3c24" emissiveIntensity={0.18} roughness={0.9} />
      </instancedMesh>
    </group>
  );
};

useGLTF.preload('/assets/tree.gltf');
useGLTF.preload('/assets/shrub.gltf');

