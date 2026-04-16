'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { AvatarParams } from '@/types';

interface Props {
  params: AvatarParams;
  height?: number;
}

interface MeshProps {
  params: AvatarParams;
}

function HumanFigure({ params }: MeshProps) {
  const {
    heightScale,
    shoulderWidth,
    chestDepth,
    waistWidth,
    hipWidth,
    armGirth,
    thighGirth,
    muscleDefinition,
    bodyFatLayer,
  } = params;

  const material = useMemo(() => {
    const hue = 0.55 - muscleDefinition * 0.1 + bodyFatLayer * 0.05;
    const color = new THREE.Color().setHSL(hue, 0.55, 0.55);
    return new THREE.MeshStandardMaterial({
      color,
      metalness: 0.25 + muscleDefinition * 0.15,
      roughness: 0.6 - muscleDefinition * 0.25,
      emissive: color.clone().multiplyScalar(0.08),
    });
  }, [muscleDefinition, bodyFatLayer]);

  const sh = 0.32 * shoulderWidth;
  const ch = 0.27 * chestDepth;
  const wa = 0.22 * waistWidth;
  const hp = 0.30 * hipWidth;
  const arm = 0.07 * armGirth;
  const thigh = 0.13 * thighGirth;

  return (
    <group scale={[heightScale, heightScale, heightScale]} position={[0, -0.9, 0]}>
      <mesh position={[0, 1.78, 0]} material={material}>
        <sphereGeometry args={[0.12, 32, 32]} />
      </mesh>

      <mesh position={[0, 1.62, 0]} material={material}>
        <cylinderGeometry args={[0.06, 0.07, 0.08, 16]} />
      </mesh>

      <mesh position={[0, 1.40, 0]} material={material}>
        <cylinderGeometry args={[ch, sh, 0.25, 32]} />
      </mesh>
      <mesh position={[0, 1.18, 0]} material={material}>
        <cylinderGeometry args={[wa, ch, 0.20, 32]} />
      </mesh>
      <mesh position={[0, 0.97, 0]} material={material}>
        <cylinderGeometry args={[hp, wa, 0.18, 32]} />
      </mesh>

      {[-1, 1].map((sign) => (
        <group key={`arm-${sign}`}>
          <mesh
            position={[sign * (sh + arm * 0.6), 1.40, 0]}
            rotation={[0, 0, sign * 0.08]}
            material={material}
          >
            <cylinderGeometry args={[arm, arm * 1.1, 0.32, 16]} />
          </mesh>
          <mesh
            position={[sign * (sh + arm * 0.7), 1.05, 0]}
            rotation={[0, 0, sign * 0.05]}
            material={material}
          >
            <cylinderGeometry args={[arm * 0.85, arm * 0.95, 0.32, 16]} />
          </mesh>
          <mesh position={[sign * (sh + arm * 0.7), 0.85, 0]} material={material}>
            <sphereGeometry args={[arm * 0.85, 16, 16]} />
          </mesh>
        </group>
      ))}

      {[-1, 1].map((sign) => (
        <group key={`leg-${sign}`}>
          <mesh
            position={[sign * (hp * 0.55), 0.65, 0]}
            material={material}
          >
            <cylinderGeometry args={[thigh, thigh * 1.1, 0.45, 16]} />
          </mesh>
          <mesh
            position={[sign * (hp * 0.55), 0.20, 0]}
            material={material}
          >
            <cylinderGeometry args={[thigh * 0.65, thigh * 0.85, 0.42, 16]} />
          </mesh>
          <mesh position={[sign * (hp * 0.55), -0.02, 0.04]} material={material}>
            <boxGeometry args={[thigh * 1.2, 0.06, thigh * 2]} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[0.5, 0.55, 64]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function Avatar3D({ params, height = 480 }: Props) {
  return (
    <div style={{ width: '100%', height }} className="rounded-lg bg-gradient-to-b from-slate-950 to-slate-800">
      <Canvas
        shadows
        camera={{ position: [0, 1.2, 3.2], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[3, 5, 4]} intensity={1.1} castShadow />
          <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#93c5fd" />
          <pointLight position={[0, 2, 2]} intensity={0.5} color="#60a5fa" />

          <HumanFigure params={params} />

          <Environment preset="city" />
          <OrbitControls
            enablePan={false}
            minDistance={2}
            maxDistance={6}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.7}
            target={[0, 0.4, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
