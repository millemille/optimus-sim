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
      color: 0xf3efe6,
      roughness: 0.46,
      metalness: 0.02,
      envMapIntensity: 0.12,
    }),
    skull: new THREE.MeshStandardMaterial({
      color: 0x0c0c0e,
      roughness: 0.28,
      metalness: 0.12,
      envMapIntensity: 0,
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
