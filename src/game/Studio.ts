import * as THREE from "three";
import { CameraRig } from "./CameraRig.ts";

export type StudioView = "front" | "q" | "side";

export function studioViewFromUrl(): StudioView | null {
  const raw = new URLSearchParams(window.location.search).get("studio");
  if (raw === "front" || raw === "q" || raw === "side") return raw;
  return null;
}

export function applyStudioLights(scene: THREE.Scene, origin: THREE.Vector3): void {
  const key = new THREE.DirectionalLight(0xfff6ea, 1.8);
  key.position.set(origin.x + 1.6, origin.y + 2.4, origin.z + 2.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xd8e2f0, 0.7);
  fill.position.set(origin.x - 2.2, origin.y + 1.6, origin.z + 0.8);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xf2f0ea, 0.55);
  rim.position.set(origin.x - 0.4, origin.y + 1.8, origin.z - 2.4);
  scene.add(rim);

  const bounce = new THREE.HemisphereLight(0xe8eef6, 0x6a655c, 0.55);
  scene.add(bounce);
}

export function poseStudioCamera(rig: CameraRig, view: StudioView): void {
  rig.setPortrait(view);
}
