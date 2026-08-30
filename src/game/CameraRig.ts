import * as THREE from "three";

const SENSITIVITY = 0.0022;
const MIN_PITCH = -0.35;
const MAX_PITCH = 0.72;
const DISTANCE = 3.35;
const LOOK_HEIGHT = 1.42;

export class CameraRig {
  yaw = 0;
  pitch = 0.22;
  private readonly offset = new THREE.Vector3();
  private readonly target = new THREE.Vector3();

  constructor(readonly camera: THREE.PerspectiveCamera) {}

  applyLook(dx: number, dy: number): void {
    this.yaw -= dx * SENSITIVITY;
    this.pitch = THREE.MathUtils.clamp(
      this.pitch - dy * SENSITIVITY,
      MIN_PITCH,
      MAX_PITCH,
    );
  }

  update(origin: THREE.Vector3): void {
    const cosPitch = Math.cos(this.pitch);
    this.offset.set(
      Math.sin(this.yaw) * cosPitch * DISTANCE,
      Math.sin(this.pitch) * DISTANCE + 0.28,
      Math.cos(this.yaw) * cosPitch * DISTANCE,
    );
    this.camera.position.copy(origin).add(this.offset);
    this.camera.position.y = Math.max(0.35, this.camera.position.y);
    this.target.set(origin.x, origin.y + LOOK_HEIGHT, origin.z);
    this.camera.lookAt(this.target);
  }
}
