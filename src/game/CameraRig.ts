import * as THREE from "three";

const SENSITIVITY = 0.0022;
const MIN_PITCH = -0.35;
const MAX_PITCH = 0.72;
const LOOK_HEIGHT = 1.42;

export class CameraRig {
  yaw = 0;
  pitch = 0.22;
  distance = 3.35;
  lookHeight = LOOK_HEIGHT;
  private readonly offset = new THREE.Vector3();
  private readonly target = new THREE.Vector3();

  constructor(readonly camera: THREE.PerspectiveCamera) {}

  applyLook(dx: number, dy: number): void {
    const mx = THREE.MathUtils.clamp(dx, -48, 48);
    const my = THREE.MathUtils.clamp(dy, -48, 48);
    this.yaw -= mx * SENSITIVITY;
    this.pitch = THREE.MathUtils.clamp(this.pitch - my * SENSITIVITY, MIN_PITCH, MAX_PITCH);
  }

  applyHeldLook(dt: number, yaw: number, pitch: number): void {
    this.yaw += yaw * 1.7 * dt;
    this.pitch = THREE.MathUtils.clamp(this.pitch + pitch * 1.3 * dt, MIN_PITCH, MAX_PITCH);
  }

  setPortrait(view: "front" | "q" | "side"): void {
    this.distance = 2.35;
    this.lookHeight = 0.9;
    this.pitch = 0.04;
    if (view === "front") this.yaw = 0;
    else if (view === "q") this.yaw = 0.7;
    else this.yaw = Math.PI / 2;
  }

  update(origin: THREE.Vector3): void {
    const cosPitch = Math.cos(this.pitch);
    this.offset.set(
      Math.sin(this.yaw) * cosPitch * this.distance,
      Math.sin(this.pitch) * this.distance + 0.28,
      Math.cos(this.yaw) * cosPitch * this.distance,
    );
    this.camera.position.copy(origin).add(this.offset);
    this.camera.position.y = Math.max(0.35, this.camera.position.y);
    this.target.set(origin.x, origin.y + this.lookHeight, origin.z);
    this.camera.lookAt(this.target);
  }
}
