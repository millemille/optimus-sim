import * as THREE from "three";
import { Optimus } from "../robot/Optimus.ts";
import { resolveCircle, type Box } from "../world/collision.ts";
import { Input } from "./Input.ts";

const WALK = 1.55;
const SPRINT = 2.55;
const RADIUS = 0.28;
const TURN = 10;

export class Player {
  readonly robot = new Optimus();
  readonly position = this.robot.root.position;
  carrying = false;
  private readonly wish = { x: 0, z: 0 };
  private readonly move = new THREE.Vector3();
  private speed = 0;
  private facing = 0;

  constructor() {
    this.position.set(-0.2, 0, 0.15);
    this.facing = 0;
    this.robot.setFacing(this.facing);
  }

  update(dt: number, input: Input, cameraYaw: number, obstacles: readonly Box[]): void {
    input.wish(this.wish);
    const hasWish = this.wish.x !== 0 || this.wish.z !== 0;
    const targetSpeed = hasWish ? (input.sprinting() ? SPRINT : WALK) : 0;
    this.speed = THREE.MathUtils.damp(this.speed, targetSpeed, 8, dt);

    if (hasWish) {
      const fwdX = -Math.sin(cameraYaw);
      const fwdZ = -Math.cos(cameraYaw);
      const fx = -Math.cos(cameraYaw) * this.wish.x + fwdX * this.wish.z;
      const fz = Math.sin(cameraYaw) * this.wish.x + fwdZ * this.wish.z;
      this.move.set(fx, 0, fz);
      this.facing = Math.atan2(fx, fz);
    }

    const yaw = this.robot.facingYaw();
    this.robot.setFacing(yaw + angleDelta(yaw, this.facing) * Math.min(1, dt * TURN));

    if (this.speed > 0.01) {
      const nextX = this.position.x + this.move.x * this.speed * dt;
      const nextZ = this.position.z + this.move.z * this.speed * dt;
      const resolved = resolveCircle(nextX, nextZ, RADIUS, obstacles);
      this.position.x = resolved.x;
      this.position.z = resolved.z;
    }

    const blend = THREE.MathUtils.clamp(this.speed / WALK, 0, 1.4);
    this.robot.update(dt, hasWish, blend, this.carrying);
  }
}

function angleDelta(from: number, to: number): number {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
