import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { Canvas, extend, useThree, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  useTexture,
  Environment,
  Lightformer,
  Text,
  Text3D,
  Center,
  Resize,
  RenderTexture,
  PerspectiveCamera,
} from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import Aurora from "./AuroraBg";
// import { useControls } from "leva";

extend({ MeshLineGeometry, MeshLineMaterial });
// useGLTF.preload(
//   "https://tzkhvlquyavzxlrvujhy.supabase.co/storage/v1/object/public/media/that-sauce-assets/badge.glb"
// );
useTexture.preload(
  "https://tzkhvlquyavzxlrvujhy.supabase.co/storage/v1/object/public/media/that-sauce-assets/band.png"
);

// Sauce colors
const SAUCE_RED = "#e21313";
const SAUCE_GREEN = "#1fe55c";
const SAUCE_YELLOW = "#ff9d00";

export default function BadgeLanyard({ creator }) {
  // const { debug } = useControls({ debug: false });

  return (
    <div className="relative w-full h-full">
      {/* Aurora background */}
      <div className="absolute inset-0 z-0">
        <Aurora
          colorStops={[SAUCE_RED, SAUCE_YELLOW]}
          amplitude={0.9}
          blend={0.7}
        />
      </div>

      {/* 3D Canvas */}
      <div className="relative z-10 w-full h-full">
        <Canvas camera={{ position: [0, 0, 13], fov: 25 }}>
          <ambientLight intensity={Math.PI} />
          <Physics
            // debug={debug}
            interpolate
            gravity={[0, -40, 0]}
            timeStep={1 / 60}
          >
            <Band creator={creator} />
          </Physics>
          <Environment blur={0.9}>
            <Lightformer
              intensity={2}
              color="white"
              position={[0, -1, 5]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={3}
              color="white"
              position={[-1, -1, 1]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={3}
              color="white"
              position={[1, 1, 1]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={10}
              color="white"
              position={[-10, 0, 14]}
              rotation={[0, Math.PI / 2, Math.PI / 3]}
              scale={[100, 10, 1]}
            />
          </Environment>
        </Canvas>
      </div>
    </div>
  );
}

function Band({ maxSpeed = 50, minSpeed = 10, creator }) {
  const band = useRef(), fixed = useRef(), j1 = useRef(), j2 = useRef(), j3 = useRef(), card = useRef() // prettier-ignore
  const vec = new THREE.Vector3(), ang = new THREE.Vector3(), rot = new THREE.Vector3(), dir = new THREE.Vector3() // prettier-ignore
  const segmentProps = {
    type: "dynamic",
    canSleep: true,
    colliders: false,
    angularDamping: 2,
    linearDamping: 2,
  };
  const { nodes, materials } = useGLTF(
    "https://tzkhvlquyavzxlrvujhy.supabase.co/storage/v1/object/public/media/that-sauce-assets/badge.glb"
  );

  // Load the band texture
  const bandTexture = useTexture(
    "https://tzkhvlquyavzxlrvujhy.supabase.co/storage/v1/object/public/media/that-sauce-assets/band.png"
  );

  // Create a new badge texture from our API route
  const username = creator?.username || "username";
  const colorScheme = "black"; // or "white" based on your preference
  const scale = 2; // adjust as needed for quality/performance
  const badgeTexture = useTexture(
    `http://localhost:3000/api/badges/${username}/${colorScheme}/3d?scale=${scale}`
  );

  const { width, height } = useThree((state) => state.size);
  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ])
  );
  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]) // prettier-ignore
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]) // prettier-ignore
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]) // prettier-ignore
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]]) // prettier-ignore

  // Handle errors when loading the badge texture
  useEffect(() => {
    badgeTexture.onError = (err) => {
      console.error("Error loading badge texture:", err);
    };
  }, [badgeTexture]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? "grabbing" : "grab";
      return () => void (document.body.style.cursor = "auto");
    }
  }, [hovered, dragged]);

  // Setup textures
  useEffect(() => {
    // Configure the band texture
    bandTexture.wrapS = bandTexture.wrapT = THREE.RepeatWrapping;

    // Configure the badge texture
    badgeTexture.anisotropy = 16;
    badgeTexture.needsUpdate = true;

    // Replace the material map with our custom badge texture
    if (materials.base && materials.base.map) {
      materials.base.map = badgeTexture;
      materials.base.needsUpdate = true;
    }
  }, [badgeTexture, bandTexture, materials]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }
    if (fixed.current) {
      // Fix most of the jitter when over pulling the card
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped)
          ref.current.lerped = new THREE.Vector3().copy(
            ref.current.translation()
          );
        const clampedDistance = Math.max(
          0.1,
          Math.min(1, ref.current.lerped.distanceTo(ref.current.translation()))
        );
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
        );
      });
      // Calculate catmul curve
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(32));
      // Tilt it back towards the screen
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = "chordal";

  // Creator data defaults
  const defaultValues = {
    username: creator?.username || "username",
    name:
      creator?.first_name && creator?.last_name
        ? `${creator.first_name} ${creator.last_name}`
        : creator?.username || "First Last",
    role: creator?.primary_role?.[0] || "Creative",
    location: creator?.location || "New York, NY",
    joinedDate: creator?.created_at
      ? new Date(creator.created_at)
          .toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "2-digit",
          })
          .replace(/\//g, "/")
      : "06/06/25",
    website: "www.that-sauce.com",
  };

  // Get display name
  const displayName =
    creator?.first_name && creator?.last_name
      ? `${creator.first_name} ${creator.last_name}`
      : defaultValues.name;

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => (
              e.target.releasePointerCapture(e.pointerId), drag(false)
            )}
            onPointerDown={(e) => (
              e.target.setPointerCapture(e.pointerId),
              drag(
                new THREE.Vector3()
                  .copy(e.point)
                  .sub(vec.copy(card.current.translation()))
              )
            )}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={badgeTexture} // Use our custom badge texture directly
                map-anisotropy={16}
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.3}
                metalness={0.5}
              />
            </mesh>
            <mesh
              geometry={nodes.clip.geometry}
              material={materials.metal}
              material-roughness={0.3}
            />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />

            {/* Username text removed since it's now part of the badge texture */}
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={[width, height]}
          useMap
          map={bandTexture}
          repeat={[-3, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}
