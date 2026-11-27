import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Flavour } from "../data/flavours";
import { getLabelCanvas } from "../lib/labelTexture";
import { motion, pointer, type CanState } from "./canState";

const CAN_UNITS = 3.46; // model height in world units

const textureCache = new Map<string, THREE.CanvasTexture>();
function labelTexture(f: Flavour, maxAniso: number) {
  let t = textureCache.get(f.id);
  if (!t) {
    t = new THREE.CanvasTexture(getLabelCanvas(f));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    textureCache.set(f.id, t);
  }
  return t;
}

export function refreshLabelTextures() {
  textureCache.forEach((t) => (t.needsUpdate = true));
}

function useCanGeometry() {
  return useMemo(() => {
    const V = (r: number, y: number) => new THREE.Vector2(r, y);

    const shoulderBottom = new THREE.LatheGeometry(
      [V(0, -1.5), V(0.5, -1.5), V(0.56, -1.56), V(0.6, -1.62), V(0.66, -1.645), V(0.72, -1.6), V(0.78, -1.52), V(0.86, -1.42), V(0.9, -1.35)],
      96,
    );
    const shoulderTop = new THREE.LatheGeometry(
      [
        V(0.9, 1.35), V(0.9, 1.38), V(0.86, 1.5), V(0.79, 1.58), V(0.745, 1.61), V(0.745, 1.66),
        V(0.78, 1.685), V(0.8, 1.71), V(0.77, 1.735), V(0.72, 1.7), V(0.7, 1.64), V(0.66, 1.62), V(0, 1.62),
      ],
      96,
    );
    const body = new THREE.CylinderGeometry(0.9, 0.9, 2.7, 128, 1, true);

    // pull tab
    const tabShape = new THREE.Shape();
    tabShape.absellipse(0, 0, 0.36, 0.2, 0, Math.PI * 2, false, 0);
    const hole = new THREE.Path();
    hole.absellipse(0.14, 0, 0.1, 0.07, 0, Math.PI * 2, true, 0);
    tabShape.holes.push(hole);
    const tab = new THREE.ExtrudeGeometry(tabShape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelSize: 0.015,
      bevelThickness: 0.012,
      bevelSegments: 3,
      curveSegments: 32,
    });

    // opening slot
    const slotShape = new THREE.Shape();
    slotShape.absellipse(0, 0, 0.3, 0.17, 0, Math.PI * 2, false, 0);
    const slot = new THREE.ShapeGeometry(slotShape, 32);

    const rivet = new THREE.CylinderGeometry(0.075, 0.085, 0.05, 32);

    return { shoulderBottom, shoulderTop, body, tab, slot, rivet };
  }, []);
}

export function SodaCan({ state, flavour }: { state: CanState; flavour: Flavour }) {
  const root = useRef<THREE.Group>(null!);
  const idle = useRef<THREE.Group>(null!);
  const labelMat = useRef<THREE.MeshPhysicalMaterial>(null!);
  const geo = useCanGeometry();
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const tex = useMemo(() => labelTexture(flavour, maxAniso), [flavour, maxAniso]);

  useEffect(() => {
    if (labelMat.current) {
      labelMat.current.map = tex;
      labelMat.current.needsUpdate = true;
    }
  }, [tex]);

  const tilt = useRef({ x: 0, y: 0 });

  useFrame((rs, dt) => {
    const cam = rs.camera as THREE.PerspectiveCamera;
    const viewH = 2 * cam.position.z * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const viewW = viewH * (rs.size.width / rs.size.height);
    const s = (state.h * viewH) / CAN_UNITS;

    root.current.position.set((state.x * viewW) / 2, ((state.y + state.dy) * viewH) / 2, 0);
    root.current.scale.setScalar(s);
    root.current.rotation.set(state.rx, state.ry + state.spin, state.rz, "YXZ");

    // idle float + pointer parallax live on a child so they never fight the scroll rotation
    const t = rs.clock.elapsedTime;
    const live = !motion.reduced;
    const tx = live ? pointer.y * 0.18 : 0;
    const ty = live ? pointer.x * 0.35 : 0;
    const k = 1 - Math.pow(0.001, dt);
    tilt.current.x += (tx - tilt.current.x) * k;
    tilt.current.y += (ty - tilt.current.y) * k;
    idle.current.position.y = live ? Math.sin(t * 1.4) * 0.07 : 0;
    idle.current.rotation.set(tilt.current.x + (live ? Math.sin(t * 0.9) * 0.025 : 0), tilt.current.y, 0);
  });

  return (
    <group ref={root}>
      <group ref={idle}>
        {/* printed aluminium body, label wraps the curve (front art sits on +Z) */}
        <mesh geometry={geo.body} rotation={[0, Math.PI, 0]}>
          <meshPhysicalMaterial
            ref={labelMat}
            map={tex}
            metalness={0.55}
            roughness={0.28}
            clearcoat={1}
            clearcoatRoughness={0.12}
            envMapIntensity={1.15}
          />
        </mesh>
        <mesh geometry={geo.shoulderBottom}>
          <meshStandardMaterial color="#d7dbe0" metalness={1} roughness={0.22} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={geo.shoulderTop}>
          <meshStandardMaterial color="#e1e4e8" metalness={1} roughness={0.2} side={THREE.DoubleSide} />
        </mesh>
        {/* lid details */}
        <group position={[0, 1.625, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh geometry={geo.slot} position={[0.3, 0.02, 0.003]} rotation={[0, 0, 0]}>
            <meshStandardMaterial color="#3a3f47" metalness={0.8} roughness={0.5} />
          </mesh>
          <mesh geometry={geo.tab} position={[-0.12, 0, 0.006]}>
            <meshStandardMaterial color="#f0f2f4" metalness={1} roughness={0.18} />
          </mesh>
          <mesh geometry={geo.rivet} rotation={[Math.PI / 2, 0, 0]} position={[-0.2, 0, 0.03]}>
            <meshStandardMaterial color="#cfd3d8" metalness={1} roughness={0.25} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
