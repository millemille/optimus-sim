import * as THREE from "three";

export type RobotMaterials = {
  white: THREE.MeshStandardMaterial;
  skull: THREE.MeshPhysicalMaterial;
  joint: THREE.MeshStandardMaterial;
  matte: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  actuator: THREE.MeshStandardMaterial;
};

export function createRobotMaterials(): RobotMaterials {
  return {
    white: new THREE.MeshStandardMaterial({
      color: 0xeeebe3,
      roughness: 0.72,
      metalness: 0.02,
      envMapIntensity: 0.15,
    }),
    skull: new THREE.MeshPhysicalMaterial({
      color: 0x0c0d10,
      roughness: 0.28,
      metalness: 0,
      clearcoat: 0.7,
      clearcoatRoughness: 0.18,
      envMapIntensity: 0,
    }),
    joint: new THREE.MeshStandardMaterial({
      color: 0x161618,
      roughness: 0.52,
      metalness: 0.28,
      envMapIntensity: 0.1,
    }),
    matte: new THREE.MeshStandardMaterial({
      color: 0x121214,
      roughness: 0.82,
      metalness: 0.04,
      envMapIntensity: 0,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: 0x2a2a2e,
      roughness: 0.42,
      metalness: 0.55,
      envMapIntensity: 0.15,
    }),
    actuator: new THREE.MeshStandardMaterial({
      color: 0x1c1c20,
      roughness: 0.4,
      metalness: 0.55,
      envMapIntensity: 0.1,
    }),
  };
}
