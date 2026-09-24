"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, OrbitControls, RoundedBox, Text } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function Plc() {
  return (
    <group position={[-2.45, 0.8, 0]}>
      <RoundedBox args={[1.35, 1.25, 0.9]} radius={0.08} smoothness={4}>
        <meshStandardMaterial color="#dfe5eb" roughness={0.62} metalness={0.28} />
      </RoundedBox>
      <mesh position={[0, 0.08, 0.48]}>
        <boxGeometry args={[0.78, 0.26, 0.025]} />
        <meshStandardMaterial color="#17202a" emissive="#0f1720" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-0.38, -0.31, 0.49]}>
        <circleGeometry args={[0.055, 24]} />
        <meshStandardMaterial color="#45b97c" emissive="#45b97c" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[-0.2, -0.31, 0.49]}>
        <circleGeometry args={[0.055, 24]} />
        <meshStandardMaterial color="#f0b44d" emissive="#f0b44d" emissiveIntensity={0.8} />
      </mesh>
      <Text
        position={[0, -0.03, 0.51]}
        fontSize={0.12}
        color="#f7fafc"
        anchorX="center"
        anchorY="middle"
      >
        PLC-01
      </Text>
    </group>
  );
}

function Conveyor() {
  const belt = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (belt.current) belt.current.rotation.z += delta * 0.35;
  });

  return (
    <group position={[1.05, 0.05, 0]}>
      <mesh position={[0, -0.35, 0]}>
        <boxGeometry args={[3.9, 0.18, 1.18]} />
        <meshStandardMaterial color="#313a43" roughness={0.72} metalness={0.2} />
      </mesh>
      <group ref={belt}>
        {Array.from({ length: 11 }).map((_, i) => (
          <mesh key={i} position={[-1.55 + i * 0.31, -0.21, 0]}>
            <boxGeometry args={[0.12, 0.06, 1.05]} />
            <meshStandardMaterial color="#87929e" roughness={0.65} />
          </mesh>
        ))}
      </group>
      {[-1.35, 0, 1.35].map((x) => (
        <group key={x} position={[x, -0.68, 0]}>
          <mesh>
            <cylinderGeometry args={[0.11, 0.11, 0.48, 20]} />
            <meshStandardMaterial color="#9aa4ae" metalness={0.65} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Motor() {
  const rotor = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (rotor.current) rotor.current.rotation.x += delta * 2.1;
  });

  return (
    <group position={[-0.35, 0.1, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.48, 0.48, 0.9, 32]} />
        <meshStandardMaterial color="#596572" metalness={0.72} roughness={0.3} />
      </mesh>
      <mesh ref={rotor} position={[0.46, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.12, 24]} />
        <meshStandardMaterial color="#aab4be" metalness={0.75} roughness={0.22} />
      </mesh>
      <Text
        position={[0, 0.72, 0]}
        fontSize={0.105}
        color="#5e6873"
        anchorX="center"
        anchorY="middle"
      >
        DRIVE / MOTOR
      </Text>
    </group>
  );
}

function Sensor({ position, label, accent }: { position: [number, number, number]; label: string; accent: string }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.7} />
      </mesh>
      <Text position={[0, 0.25, 0]} fontSize={0.075} color="#66727e" anchorX="center">
        {label}
      </Text>
    </group>
  );
}

function DataLink({ from, to, color = "#7e8994" }: { from: [number, number, number]; to: [number, number, number]; color?: string }) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const length = start.distanceTo(end);

  return (
    <mesh position={midpoint} rotation={[0, Math.PI / 2, Math.atan2(end.y - start.y, end.x - start.x)]}>
      <boxGeometry args={[length, 0.018, 0.018]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[4, 7, 6]} intensity={2.2} />
      <directionalLight position={[-4, 2, -4]} intensity={0.8} />
      <Environment preset="city" />

      <Float speed={0.65} rotationIntensity={0.04} floatIntensity={0.06}>
        <group rotation={[-0.02, -0.18, 0]}>
          <mesh position={[0, -0.84, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[7.5, 4.8]} />
            <meshStandardMaterial color="#eef1f4" roughness={0.9} />
          </mesh>

          <Plc />
          <Motor />
          <Conveyor />

          <DataLink from={[-1.75, 0.82, 0]} to={[-0.76, 0.32, 0]} color="#6e7b88" />
          <DataLink from={[0.12, 0.1, 0]} to={[0.9, 0.1, 0]} color="#6e7b88" />

          <Sensor position={[0.6, 0.56, 0.42]} label="SPEED" accent="#4d83d9" />
          <Sensor position={[1.65, 0.55, 0.42]} label="LOAD" accent="#d09a42" />
          <Sensor position={[2.55, 0.55, 0.42]} label="POSITION" accent="#6e9f83" />

          <Text position={[-2.45, 1.58, 0]} fontSize={0.13} color="#4b5661" anchorX="center">
            ENGINEERING / HMI
          </Text>
          <Text position={[1.05, 1.58, 0]} fontSize={0.13} color="#4b5661" anchorX="center">
            PROCESS CELL
          </Text>
        </group>
      </Float>

      <ContactShadows position={[0, -0.84, 0]} opacity={0.2} scale={8} blur={2.5} far={3} />
      <OrbitControls
        enablePan={false}
        minDistance={5.7}
        maxDistance={8}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.05}
        autoRotate
        autoRotateSpeed={0.45}
      />
    </>
  );
}

export function IndustrialCell() {
  return (
    <div className="cell-canvas" aria-label="Interactive 3D virtual industrial cell">
      <Canvas
        camera={{ position: [5.9, 3.9, 6.1], fov: 37 }}
        dpr={[1, 1.7]}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene />
      </Canvas>
      <div className="cell-overlay">
        <div className="cell-live-dot" />
        <span>VIRTUAL INDUSTRIAL CELL</span>
        <span className="cell-divider" />
        <span>MODBUS / PLC-01</span>
      </div>
      <div className="cell-caption">
        <strong>Cyber → process context</strong>
        <span>Control signals become operational evidence.</span>
      </div>
    </div>
  );
}
