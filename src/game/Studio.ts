import * as THREE from "three";
import { CameraRig } from "./CameraRig.ts";

export type StudioView = "front" | "q" | "side";

export function studioViewFromUrl(): StudioView | null {
  const raw = new URLSearchParams(window.location.search).get("studio");
  if (raw === "front" || raw === "q" || raw === "side") return raw;
  return null;
}

export function applyStudioLights(scene: THREE.Scene, origin: THREE.Vector3): void {
  const hemi = new THREE.HemisphereLight(0xd8dce0, 0x4a4844, 1.05);
  scene.add(hemi);
  scene.add(new THREE.AmbientLight(0xb8bcbe, 0.22));

  const key = new THREE.DirectionalLight(0xfff4e6, 0.48);
  key.position.set(origin.x - 2.6, origin.y + 5.4, origin.z - 2.0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xc8d0dc, 0.32);
  fill.position.set(origin.x + 3.4, origin.y + 2.2, origin.z - 0.6);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xe8e4dc, 0.38);
  rim.position.set(origin.x + 0.2, origin.y + 2.8, origin.z - 3.4);
  scene.add(rim);
}

export function poseStudioCamera(rig: CameraRig, view: StudioView): void {
  rig.setPortrait(view);
}
