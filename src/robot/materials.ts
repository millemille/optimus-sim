import * as THREE from "three";

export type RobotMaterials = {
  white: THREE.MeshStandardMaterial;
  visor: THREE.MeshStandardMaterial;
  joint: THREE.MeshStandardMaterial;
  matte: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  eye: THREE.MeshStandardMaterial;
};

export function createRobotMaterials(): RobotMaterials {
  return {
    white: new THREE.MeshStandardMaterial({
      color: 0xf7f6f2,
      roughness: 0.28,
      metalness: 0.06,
    }),
    visor: new THREE.MeshStandardMaterial({
      color: 0x07080a,
      roughness: 0.07,
      metalness: 0.42,
    }),
    joint: new THREE.MeshStandardMaterial({
      color: 0x161618,
      roughness: 0.48,
      metalness: 0.52,
    }),
    matte: new THREE.MeshStandardMaterial({
      color: 0x121214,
      roughness: 0.74,
      metalness: 0.12,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: 0x2c2c32,
      roughness: 0.38,
      metalness: 0.72,
    }),
    eye: new THREE.MeshStandardMaterial({
      color: 0xd5dde6,
      emissive: 0x8b9aab,
      emissiveIntensity: 0.85,
      roughness: 0.22,
      metalness: 0.1,
    }),
  };
}
