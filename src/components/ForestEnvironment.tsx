import { useEffect, useMemo, useRef } from 'react';
import { InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';
import { Sky, Stars } from '@react-three/drei';

type TreeInstance = {
  position: Vector3;
  scale: number;
};

const matrix = new Matrix4();
const quaternion = new Quaternion();
const scaleVector = new Vector3();

const wrapAngle = (value: number) => {
  let result = ((value + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (result < -Math.PI) result += Math.PI * 2;
  return result;
};

const createTreeDistribution = (count: number) => {
  const walkwayCenter = -Math.PI / 2;
  const walkwayHalfWidth = 0.7;
  const trees: TreeInstance[] = [];
  let index = 0;

  while (trees.length < count) {
    const angle = (index / (count * 1.2)) * Math.PI * 2;
    index += 1;

    if (Math.abs(wrapAngle(angle - walkwayCenter)) < walkwayHalfWidth) {
      continue;
    }

    const radius = 9 + (index % 7) * 0.9 + Math.sin(index * 0.9) * 1.1;
    const height = 2.4 + ((index * 1.3) % 1.1);

    trees.push({
      position: new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius),
      scale: height,
    });
  }

  return trees;
};

export const ForestEnvironment = () => {
  const trunksRef = useRef<InstancedMesh>(null);
  const canopyRef = useRef<InstancedMesh>(null);
  const trees = useMemo(() => createTreeDistribution(24), []);

  useEffect(() => {
    const trunks = trunksRef.current;
    const canopy = canopyRef.current;
    if (!trunks || !canopy) return;

    trees.forEach((tree, index) => {
      matrix.compose(tree.position.clone().setY(tree.scale / 2), quaternion, scaleVector.set(1, tree.scale, 1));
      trunks.setMatrixAt(index, matrix);

      matrix.compose(
        tree.position.clone().setY(tree.scale + 0.8),
        quaternion,
        scaleVector.set(tree.scale * 0.8, tree.scale * 0.8, tree.scale * 0.8),
      );
      canopy.setMatrixAt(index, matrix);
    });

    trunks.instanceMatrix.needsUpdate = true;
    canopy.instanceMatrix.needsUpdate = true;
  }, [trees]);

  return (
    <group>
      <Sky distance={45000} sunPosition={[0, 8, -20]} inclination={0.62} azimuth={0.35} mieCoefficient={0.005} rayleigh={2.4} turbidity={6} />
      <Stars radius={120} depth={60} count={4000} factor={4} saturation={0.4} fade speed={0.6} />
      <color attach="background" args={['#0d1120']} />
      <fog attach="fog" args={['#0d1120', 12, 70]} />
      <hemisphereLight intensity={0.45} skyColor="#8090ff" groundColor="#1c1d2f" />
      <directionalLight
        position={[10, 12, 6]}
        intensity={1.1}
        color="#ffb38d"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={60}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120, 1, 1]} />
        <meshStandardMaterial color="#122027" roughness={0.9} metalness={0.05} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[24, 64]} />
        <meshStandardMaterial
          color="#182e2f"
          roughness={1}
          metalness={0}
          emissive="#1f3e3f"
          emissiveIntensity={0.08}
        />
      </mesh>

      <instancedMesh ref={trunksRef} args={[undefined, undefined, trees.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.4, 1, 8]} />
        <meshStandardMaterial color="#2a1e15" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, trees.length]} castShadow>
        <coneGeometry args={[1.2, 2.4, 12]} />
        <meshStandardMaterial color="#2f5f41" emissive="#193a2c" emissiveIntensity={0.3} roughness={0.6} />
      </instancedMesh>
    </group>
  );
};
