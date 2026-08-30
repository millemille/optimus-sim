import { Optimus } from "../src/robot/Optimus.ts";
import * as THREE from "three";

const robot = new Optimus();
const head = robot.root.getObjectByName("head");
if (!head) throw new Error("head group missing");

const headMeshes: THREE.Mesh[] = [];
head.traverse((obj) => {
  if (obj instanceof THREE.Mesh) headMeshes.push(obj);
});

if (headMeshes.length !== 1) {
  throw new Error(`head must be one mesh, found ${headMeshes.length}`);
}

const skull = headMeshes[0];
if (skull.name !== "visorSkull") throw new Error(`expected visorSkull, got ${skull.name}`);

const mat = skull.material as THREE.MeshStandardMaterial;
const color = mat.color.getHex();
if (color > 0x222228) {
  throw new Error(`visor must stay black, got 0x${color.toString(16)}`);
}

if (!robot.root.getObjectByName("neckColumn")) {
  throw new Error("neck column missing");
}

if (!robot.root.getObjectByName("pecShell")) {
  throw new Error("pec shell missing");
}

console.log("head assert ok: single black visor, neck, pec shell");
