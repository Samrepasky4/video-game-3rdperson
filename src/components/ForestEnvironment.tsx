import { useEffect, useMemo, useRef } from 'react';
import { InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';
import { Sky, Stars } from '@react-three/drei';

type TreeInstance = {
  position: Vector3;
  scale: number;
  rotation: number;
};

type ForestLayout = {
  pines: TreeInstance[];
  oaks: TreeInstance[];
  birch: TreeInstance[];
  shrubs: TreeInstance[];
  grass: TreeInstance[];

};

const matrix = new Matrix4();
const quaternion = new Quaternion();
const scaleVector = new Vector3();

const UP = new Vector3(0, 1, 0);

const mulberry32 = (seed: number) => {
  return () => {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const createForestLayout = (): ForestLayout => {
  const rand = mulberry32(1337);
  const pines: TreeInstance[] = [];
  const oaks: TreeInstance[] = [];
  const birch: TreeInstance[] = [];
  const shrubs: TreeInstance[] = [];
  const grass: TreeInstance[] = [];

  const totalTrees = 52;
  while (pines.length + oaks.length + birch.length < totalTrees) {
    const x = rand() * 48 - 24;
    const z = rand() * 48 - 16;

    if (Math.abs(x) < 3.2 && z > -6 && z < 20) {
      continue;
    }

    const rotation = rand() * Math.PI * 2;
    const roll = rand();
    const scaleBase = 1.6 + rand() * 1.4;

    if (roll < 0.42) {
      pines.push({ position: new Vector3(x, 0, z), scale: scaleBase * 1.6, rotation });
    } else if (roll < 0.78) {
      oaks.push({ position: new Vector3(x, 0, z), scale: scaleBase * 1.2, rotation });
    } else {
      birch.push({ position: new Vector3(x, 0, z), scale: scaleBase, rotation });
    }
  }

  const shrubCount = 60;
  for (let index = 0; index < shrubCount; index += 1) {
    const x = rand() * 46 - 23;
    const z = rand() * 46 - 14;
    if (Math.abs(x) < 2.4 && z > -5 && z < 18) continue;
    shrubs.push({ position: new Vector3(x, 0, z), scale: 0.6 + rand() * 0.9, rotation: rand() * Math.PI * 2 });
  }

  const grassCount = 160;
  for (let index = 0; index < grassCount; index += 1) {
    const x = rand() * 50 - 25;
    const z = rand() * 50 - 18;
    if (Math.abs(x) < 1.8 && z > -4 && z < 16 && rand() < 0.5) continue;
    grass.push({ position: new Vector3(x, 0, z), scale: 0.7 + rand() * 0.6, rotation: rand() * Math.PI * 2 });
  }

  return { pines, oaks, birch, shrubs, grass };
};

const applyInstances = (
  mesh: InstancedMesh | null,
  items: TreeInstance[],
  scaleMultiplier: Vector3,
  computeY: (item: TreeInstance, height: number) => number = (item, height) => item.position.y + height / 2,
) => {
  if (!mesh) return;

  items.forEach((item, index) => {
    quaternion.setFromAxisAngle(UP, item.rotation);
    const height = scaleMultiplier.y * item.scale;
    matrix.compose(
      item.position.clone().setY(computeY(item, height)),
      quaternion,
      scaleVector.set(scaleMultiplier.x * item.scale, scaleMultiplier.y * item.scale, scaleMultiplier.z * item.scale),
    );
    mesh.setMatrixAt(index, matrix);
  });

  mesh.instanceMatrix.needsUpdate = true;
};

export const ForestEnvironment = () => {
  const pineTrunksRef = useRef<InstancedMesh>(null);
  const pineCanopyRef = useRef<InstancedMesh>(null);
  const oakTrunksRef = useRef<InstancedMesh>(null);
  const oakCanopyRef = useRef<InstancedMesh>(null);
  const birchTrunksRef = useRef<InstancedMesh>(null);
  const birchLeavesRef = useRef<InstancedMesh>(null);
  const shrubsRef = useRef<InstancedMesh>(null);
  const grassRef = useRef<InstancedMesh>(null);
  const layout = useMemo(() => createForestLayout(), []);

  useEffect(() => {
    applyInstances(pineTrunksRef.current, layout.pines, new Vector3(0.26, 0.9, 0.26));
    applyInstances(
      pineCanopyRef.current,
      layout.pines,
      new Vector3(0.9, 1.6, 0.9),
      (item, height) => item.position.y + item.scale * 0.9 + height / 2,
    );
    applyInstances(oakTrunksRef.current, layout.oaks, new Vector3(0.32, 0.75, 0.32));
    applyInstances(
      oakCanopyRef.current,
      layout.oaks,
      new Vector3(1.3, 1.1, 1.3),
      (item, height) => item.position.y + item.scale * 0.75 + height / 2,
    );
    applyInstances(birchTrunksRef.current, layout.birch, new Vector3(0.18, 1.2, 0.18));
    applyInstances(
      birchLeavesRef.current,
      layout.birch,
      new Vector3(0.9, 0.9, 0.9),
      (item, height) => item.position.y + item.scale * 1.2 + height / 2,
    );
    applyInstances(
      shrubsRef.current,
      layout.shrubs,
      new Vector3(0.9, 0.6, 0.9),
      (item, height) => item.position.y + height / 2,
    );
    applyInstances(
      grassRef.current,
      layout.grass,
      new Vector3(0.35, 0.9, 0.35),
      (item, height) => item.position.y + height / 2,
    );
  }, [layout]);

  return (
    <group>
      <Sky distance={45000} sunPosition={[5, 5, -15]} inclination={0.58} azimuth={0.4} mieCoefficient={0.01} rayleigh={1.9} turbidity={7} />
      <Stars radius={140} depth={60} count={4500} factor={5} saturation={0.5} fade speed={0.4} />
      <color attach="background" args={['#10162c']} />
      <fog attach="fog" args={['#111b33', 18, 80]} />
      <hemisphereLight intensity={0.55} skyColor="#a4b7ff" groundColor="#1a1e36" />
      <directionalLight
        position={[12, 9, 8]}
        intensity={0.9}
        color="#ff9d7a"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={70}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 160, 1, 1]} />
        <meshStandardMaterial color="#0f1b1a" roughness={0.95} metalness={0.03} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[28, 96]} />
        <meshStandardMaterial
          color="#1a2e2a"
          roughness={1}
          metalness={0}
          emissive="#123530"
          emissiveIntensity={0.12}
        />
      </mesh>

      <instancedMesh ref={pineTrunksRef} args={[undefined, undefined, layout.pines.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.45, 1, 8]} />
        <meshStandardMaterial color="#2d1f14" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={pineCanopyRef} args={[undefined, undefined, layout.pines.length]} castShadow>
        <coneGeometry args={[1.2, 2.6, 12]} />
        <meshStandardMaterial color="#2e5c3a" emissive="#1d3d2b" emissiveIntensity={0.35} roughness={0.55} />
      </instancedMesh>

      <instancedMesh ref={oakTrunksRef} args={[undefined, undefined, layout.oaks.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.5, 1, 10]} />
        <meshStandardMaterial color="#3b281c" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={oakCanopyRef} args={[undefined, undefined, layout.oaks.length]} castShadow>
        <sphereGeometry args={[1.4, 16, 16]} />
        <meshStandardMaterial color="#2f6134" emissive="#1d3f24" emissiveIntensity={0.28} roughness={0.6} />
      </instancedMesh>

      <instancedMesh ref={birchTrunksRef} args={[undefined, undefined, layout.birch.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.2, 1, 12]} />
        <meshStandardMaterial color="#d8dfe8" roughness={0.7} emissive="#717a86" emissiveIntensity={0.12} />
      </instancedMesh>
      <instancedMesh ref={birchLeavesRef} args={[undefined, undefined, layout.birch.length]} castShadow>
        <icosahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial color="#3b7a4d" emissive="#224d34" emissiveIntensity={0.3} roughness={0.55} />
      </instancedMesh>

      <instancedMesh ref={shrubsRef} args={[undefined, undefined, layout.shrubs.length]} receiveShadow>
        <icosahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#204f35" emissive="#163728" emissiveIntensity={0.25} roughness={0.8} />
      </instancedMesh>

      <instancedMesh ref={grassRef} args={[undefined, undefined, layout.grass.length]} receiveShadow>
        <coneGeometry args={[0.4, 1.2, 6]} />
        <meshStandardMaterial color="#1f6a3b" emissive="#0f3c24" emissiveIntensity={0.18} roughness={0.9} />

      </instancedMesh>
    </group>
  );
};
