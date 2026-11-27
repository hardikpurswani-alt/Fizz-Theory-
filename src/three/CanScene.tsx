import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Flavour } from "../data/flavours";
import { MIX } from "../data/flavours";
import { footerCan, heroCan } from "./canState";
import { SodaCan } from "./SodaCan";

function Environment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.95;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

export default function CanScene({ flavour }: { flavour: Flavour }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-30" aria-hidden="true" data-testid="can-canvas">
      <Canvas
        style={{ pointerEvents: "none" }}
        events={undefined}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 10], fov: 30, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.domElement.dataset.ready = "1";
        }}
      >
        <Environment />
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} />
        <pointLight position={[-4, 2, -2]} intensity={40} color="#ffb98a" />
        <pointLight position={[4, -2, 3]} intensity={18} color="#9cc7ff" />
        <SodaCan state={heroCan} flavour={flavour} />
        <SodaCan state={footerCan} flavour={MIX} />
      </Canvas>
    </div>
  );
}
