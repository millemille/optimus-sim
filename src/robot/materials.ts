import * as THREE from "three";

export type RobotMaterials = {
  white: THREE.MeshStandardMaterial;
  visor: THREE.MeshStandardMaterial;
  skull: THREE.MeshStandardMaterial;
  joint: THREE.MeshStandardMaterial;
  matte: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  actuator: THREE.MeshStandardMaterial;
};

export function createRobotMaterials(): RobotMaterials {
  return {
    white: new THREE.MeshStandardMaterial({
      color: 0xf2f0e8,
      roughness: 0.68,
      metalness: 0.02,
    }),
    visor: new THREE.MeshStandardMaterial({
      color: 0x050608,
      roughness: 0.06,
      metalness: 0.45,
      envMapIntensity: 1.35,
    }),
    skull: new THREE.MeshStandardMaterial({
      color: 0x0c0c0e,
      roughness: 0.72,
      metalness: 0.08,
    }),
    joint: new THREE.MeshStandardMaterial({
      color: 0x161618,
      roughness: 0.48,
      metalness: 0.32,
    }),
    matte: new THREE.MeshStandardMaterial({
      color: 0x101012,
      roughness: 0.8,
      metalness: 0.06,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: 0x2a2a2e,
      roughness: 0.4,
      metalness: 0.58,
    }),
    actuator: new THREE.MeshStandardMaterial({
      color: 0x1c1c20,
      roughness: 0.38,
      metalness: 0.62,
    }),
  };
}
