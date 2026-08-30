import * as THREE from "three";

export type RobotMaterials = {
  white: THREE.MeshStandardMaterial;
  visor: THREE.MeshStandardMaterial;
  joint: THREE.MeshStandardMaterial;
  matte: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  actuator: THREE.MeshStandardMaterial;
  status: THREE.MeshStandardMaterial;
};

export function createRobotMaterials(): RobotMaterials {
  return {
    white: new THREE.MeshStandardMaterial({
      color: 0xf3f1ea,
      roughness: 0.62,
      metalness: 0.03,
    }),
    visor: new THREE.MeshStandardMaterial({
      color: 0x08090b,
      roughness: 0.14,
      metalness: 0.28,
      envMapIntensity: 1.1,
    }),
    joint: new THREE.MeshStandardMaterial({
      color: 0x17171a,
      roughness: 0.5,
      metalness: 0.38,
    }),
    matte: new THREE.MeshStandardMaterial({
      color: 0x101012,
      roughness: 0.78,
      metalness: 0.08,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: 0x2a2a30,
      roughness: 0.42,
      metalness: 0.62,
    }),
    actuator: new THREE.MeshStandardMaterial({
      color: 0x222226,
      roughness: 0.35,
      metalness: 0.7,
    }),
    status: new THREE.MeshStandardMaterial({
      color: 0x6a727a,
      emissive: 0x3a4248,
      emissiveIntensity: 0.22,
      roughness: 0.4,
      metalness: 0.1,
    }),
  };
}
