import * as THREE from "three";

export type RobotMaterials = {
  white: THREE.MeshStandardMaterial;
  skull: THREE.MeshStandardMaterial;
  joint: THREE.MeshStandardMaterial;
  matte: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  actuator: THREE.MeshStandardMaterial;
};

export function createRobotMaterials(): RobotMaterials {
  return {
    white: new THREE.MeshStandardMaterial({
      color: 0xe6e4de,
      roughness: 0.4,
      metalness: 0.16,
      envMapIntensity: 0.18,
    }),
    skull: new THREE.MeshStandardMaterial({
      color: 0x0a0a0c,
      roughness: 0.16,
      metalness: 0.22,
      envMapIntensity: 0.04,
    }),
    joint: new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.55,
      metalness: 0.22,
      envMapIntensity: 0.08,
    }),
    matte: new THREE.MeshStandardMaterial({
      color: 0x101012,
      roughness: 0.84,
      metalness: 0.03,
      envMapIntensity: 0,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: 0x2a2a2e,
      roughness: 0.42,
      metalness: 0.55,
      envMapIntensity: 0.12,
    }),
    actuator: new THREE.MeshStandardMaterial({
      color: 0x1c1c20,
      roughness: 0.4,
      metalness: 0.5,
      envMapIntensity: 0.08,
    }),
  };
}
