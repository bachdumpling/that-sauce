"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Box, OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { motion, MotionValue } from "framer-motion";

function Cube() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const textures = useTexture([
    "/cube-images/cube-1.png",
    "/cube-images/cube-2.png",
    "/cube-images/cube-3.png",
    "/cube-images/cube-4.png",
    "/cube-images/cube-5.png",
    "/cube-images/cube-6.png",
  ]);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <Box ref={meshRef} args={[2.5, 2.5, 2.5]}>
      <meshStandardMaterial map={textures[0]} attach="material-0" />
      <meshStandardMaterial map={textures[1]} attach="material-1" />
      <meshStandardMaterial map={textures[2]} attach="material-2" />
      <meshStandardMaterial map={textures[3]} attach="material-3" />
      <meshStandardMaterial map={textures[4]} attach="material-4" />
      <meshStandardMaterial map={textures[5]} attach="material-5" />
    </Box>
  );
}

export default function RotatingCube({
  heroParallaxY,
}: {
  heroParallaxY?: MotionValue<string>;
}) {
  return (
    <motion.div className="absolute inset-0 z-10" style={{ y: heroParallaxY }}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Cube />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </motion.div>
  );
}
