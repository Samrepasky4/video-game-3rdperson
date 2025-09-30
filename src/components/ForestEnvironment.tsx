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

  const totalTrees = 34;
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

  const shrubCount = 42;
  for (let index = 0; index < shrubCount; index += 1) {
    const x = rand() * 46 - 23;
    const z = rand() * 46 - 14;
    if (Math.abs(x) < 2.4 && z > -5 && z < 18) continue;
    shrubs.push({ position: new Vector3(x, 0, z), scale: 0.6 + rand() * 0.9, rotation: rand() * Math.PI * 2 });
  }

  const grassCount = 110;
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

  mesh.frustumCulled = false;

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
      <Sky
        distance={45000}
        sunPosition={[-18, -6, -24]}
        inclination={0.95}
        azimuth={0.34}
        mieCoefficient={0.001}
        mieDirectionalG={0.97}
        rayleigh={0.3}
        turbidity={1.8}
        exposure={0.25}
      />
      <Stars radius={240} depth={80} count={3200} factor={3} saturation={0.6} fade speed={0.18} />
      <color attach="background" args={['#07102c']} />
      <fog attach="fog" args={['#0d1b3a', 18, 70]} />
      <hemisphereLight intensity={0.4} skyColor="#1a2c63" groundColor="#0d141f" />
      <directionalLight
        position={[14, 12, -6]}
        intensity={0.45}
        color="#a7b5ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={70}
      />
      <pointLight position={[-24, 18, -32]} intensity={0.55} color="#f6f2d9" distance={80} decay={2.5} />

      <ambientLight intensity={0.25} color="#6475c7" />

      <mesh position={[-24, 18, -32]} castShadow>
        <sphereGeometry args={[2.8, 48, 48]} />
        <meshStandardMaterial
          color="#f7f5e9"
          emissive="#f0e7c0"
          emissiveIntensity={0.9}
          roughness={0.4}
          metalness={0}
        />
      </mesh>

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
