import * as THREE from "three";
import { CameraRig } from "./CameraRig.ts";

export type StudioView = "front" | "q" | "side";

export function studioViewFromUrl(): StudioView | null {
  const raw = new URLSearchParams(window.location.search).get("studio");
  if (raw === "front" || raw === "q" || raw === "side") return raw;
  return null;
}

export function applyStudioLights(scene: THREE.Scene, origin: THREE.Vector3): void {
  const key = new THREE.DirectionalLight(0xfff4e6, 0.95);
  key.position.set(origin.x - 1.8, origin.y + 3.2, origin.z + 1.1);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xc8d0dc, 0.28);
  fill.position.set(origin.x + 2.4, origin.y + 1.4, origin.z + 0.4);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xe8e4dc, 0.22);
  rim.position.set(origin.x + 0.2, origin.y + 2.0, origin.z - 2.6);
  scene.add(rim);

  const hemi = new THREE.HemisphereLight(0xb8c0c8, 0x4a4640, 0.32);
  scene.add(hemi);
}

export function poseStudioCamera(rig: CameraRig, view: StudioView): void {
  rig.setPortrait(view);
}
