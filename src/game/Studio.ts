import * as THREE from "three";
import { CameraRig } from "./CameraRig.ts";

export type StudioView = "front" | "q" | "side";

export function studioViewFromUrl(): StudioView | null {
  const raw = new URLSearchParams(window.location.search).get("studio");
  if (raw === "front" || raw === "q" || raw === "side") return raw;
  return null;
}

export function applyStudioLights(scene: THREE.Scene, origin: THREE.Vector3): void {
  const hemi = new THREE.HemisphereLight(0xc8ccd0, 0x3a3834, 0.62);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff4e6, 0.55);
  key.position.set(origin.x - 2.4, origin.y + 5.2, origin.z - 1.8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xc8d0dc, 0.2);
  fill.position.set(origin.x + 3.2, origin.y + 1.8, origin.z - 0.4);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xe8e4dc, 0.4);
  rim.position.set(origin.x + 0.3, origin.y + 2.6, origin.z - 3.2);
  scene.add(rim);
}

export function poseStudioCamera(rig: CameraRig, view: StudioView): void {
  rig.setPortrait(view);
}
