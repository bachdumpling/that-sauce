"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { motion, MotionValue, useScroll } from "framer-motion";

/**
 * A single face of the cube that slides in from an initial offset (relative to its final resting place) until it reaches its final position.
 */
function CubeFace({
  texture,
  normal,
  rotation,
  startDelay = 0,
  duration = 0.6,
  startOffset,
}: {
  texture: THREE.Texture;
  /** Normalised vector representing the outward normal of the face */
  normal: THREE.Vector3;
  /** Euler rotation (in radians) to orient the face */
  rotation: [number, number, number];
  /** Delay before the slide-in animation starts (seconds) */
  startDelay?: number;
  /** Duration of the slide-in animation (seconds) */
  duration?: number;
  /** Offset from which the face starts its slide-in (units in scene) */
  startOffset: THREE.Vector3;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);

  // Pre-compute positions to avoid allocation inside the render loop
  const finalPosition = normal.clone().multiplyScalar(1.25); // half of cube size (2.5 / 2)
  const startPosition = finalPosition.clone().add(startOffset);

  const startTimeRef = useRef<number>(-1);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    // Record the start time on the first frame this face is rendered
    if (startTimeRef.current === -1) {
      startTimeRef.current = clock.getElapsedTime();
    }

    const elapsed =
      clock.getElapsedTime() - (startTimeRef.current + startDelay);
    const progress = THREE.MathUtils.clamp(elapsed / duration, 0, 1);

    // Interpolate between start and final positions
    meshRef.current.position.lerpVectors(
      startPosition,
      finalPosition,
      progress
    );
  });

  return (
    <mesh ref={meshRef} rotation={rotation} position={startPosition}>
      <boxGeometry args={[2.5, 2.5, 0.01]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

/**
 * The assembled cube comprised of six `CubeFace`s which animate into place on mount.
 */
function Cube({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const groupRef = useRef<THREE.Group>(null!);
  // Base orientation: vertical tilt 30°, horizontal yaw 45°
  const baseRotation = useMemo(
    () =>
      new THREE.Euler(
        THREE.MathUtils.degToRad(30),
        THREE.MathUtils.degToRad(-45),
        0
      ),
    []
  );

  // Load textures in order: [front, back, right, left, top, bottom]
  const textures = useTexture([
    "/cube-images/cube-1.png",
    "/cube-images/cube-2.png",
    "/cube-images/cube-3.png",
    "/cube-images/cube-4.png",
    "/cube-images/cube-5.png",
    "/cube-images/cube-6.png",
  ]);

  // Ensure each texture behaves like CSS `object-fit: cover` (center-cropped)
  useEffect(() => {
    textures.forEach((tex) => {
      // Texture may not be loaded immediately
      const img: any = tex.image;
      if (!img?.width || !img?.height) return;

      const { width, height } = img;

      // Default repeat/offset (no cropping)
      let repeatX = 1;
      let repeatY = 1;
      let offsetX = 0;
      let offsetY = 0;

      if (width > height) {
        // Landscape → scale height to fit, crop sides
        repeatX = height / width;
        offsetX = (1 - repeatX) / 2;
      } else if (height > width) {
        // Portrait → scale width to fit, crop top/bottom
        repeatY = width / height;
        offsetY = (1 - repeatY) / 2;
      }

      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.center.set(0.5, 0.5);
      tex.repeat.set(repeatX, repeatY);
      tex.offset.set(offsetX, offsetY);
      tex.needsUpdate = true;
    });
  }, [textures]);

  // Range (in scene units) that the cube will travel vertically for the parallax effect
  const parallaxRange = 20;

  // Rotate cube according to scroll progress and apply a subtle continuous spin (left→right)
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const progress = scrollProgress.get();
      const spin = progress * Math.PI * 2; // full revolution based on scroll

      // Time-driven spin: ~0.2 rad/sec (≈11°/s) around the Y-axis
      const timeSpin = clock.getElapsedTime() * 0.2;

      groupRef.current.rotation.set(
        baseRotation.x + spin * 4,
        baseRotation.y + spin * 2 + timeSpin,
        baseRotation.z
      );

      // Parallax translation: move cube up/down in scene space
      groupRef.current.position.y = -progress * parallaxRange; // 0 → 0, 1 → -parallaxRange
    }
  });

  return (
    <group ref={groupRef}>
      {/* BACK (-Z) – slides in first */}
      <CubeFace
        texture={textures[1]}
        normal={new THREE.Vector3(0, 0, -1)}
        rotation={[0, Math.PI, 0]}
        startDelay={0.6}
        startOffset={new THREE.Vector3(0, -50, 0)}
      />

      {/* LEFT (-X) – slides in second (with right) */}
      <CubeFace
        texture={textures[3]}
        normal={new THREE.Vector3(-1, 0, 0)}
        rotation={[0, Math.PI / 2, 0]}
        startDelay={1}
        startOffset={new THREE.Vector3(-50, 0, 0)}
      />

      {/* BOTTOM (-Y) – slides in third */}
      <CubeFace
        texture={textures[5]}
        normal={new THREE.Vector3(0, -1, 0)}
        rotation={[-Math.PI / 2, 0, 0]}
        startDelay={1.4}
        startOffset={new THREE.Vector3(0, -50, 0)}
      />

      {/* FRONT (+Z) – slides in fourth */}
      <CubeFace
        texture={textures[0]}
        normal={new THREE.Vector3(0, 0, 1)}
        rotation={[0, 0, 0]}
        startDelay={1.8}
        startOffset={new THREE.Vector3(0, 50, 0)}
      />

      {/* RIGHT (+X) – slides in fifth */}
      <CubeFace
        texture={textures[2]}
        normal={new THREE.Vector3(1, 0, 0)}
        rotation={[0, -Math.PI / 2, 0]}
        startDelay={2.2}
        startOffset={new THREE.Vector3(50, 0, 0)}
      />

      {/* TOP (+Y) – slides in last */}
      <CubeFace
        texture={textures[4]}
        normal={new THREE.Vector3(0, 1, 0)}
        rotation={[Math.PI / 2, 0, 0]}
        startDelay={2.6}
        startOffset={new THREE.Vector3(0, 50, 0)}
      />
    </group>
  );
}

export default function RotatingCube({
  heroParallaxY,
}: {
  heroParallaxY?: MotionValue<string>;
}) {
  // Track page scroll progress
  const { scrollYProgress } = useScroll();

  return (
    <motion.div className="absolute inset-0 z-10" style={{ y: heroParallaxY }}>
      <Canvas>
        <ambientLight intensity={1.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Cube scrollProgress={scrollYProgress} />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </motion.div>
  );
}
