import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  createKneeCap,
  createLimbShell,
  createMidriff,
  createPecShell,
  createShinShell,
  createThighShell,
  createVisorSkull,
} from "./geometries.ts";
import { createRobotMaterials, type RobotMaterials } from "./materials.ts";

const HIP_Y = 0.92;

export class Optimus {
  readonly root = new THREE.Group();
  readonly carryAnchor = new THREE.Group();
  readonly height = 1.73;

  private readonly mats: RobotMaterials;
  private readonly hips: THREE.Group;
  private readonly chest: THREE.Group;
  private readonly lShoulder: THREE.Group;
  private readonly rShoulder: THREE.Group;
  private readonly lElbow: THREE.Group;
  private readonly rElbow: THREE.Group;
  private readonly lHip: THREE.Group;
  private readonly rHip: THREE.Group;
  private readonly lKnee: THREE.Group;
  private readonly rKnee: THREE.Group;
  private readonly lAnkle: THREE.Group;
  private readonly rAnkle: THREE.Group;
  private phase = 0;
  private bob = 0;

  constructor() {
    this.mats = createRobotMaterials();
    this.root.name = "optimus";

    this.hips = new THREE.Group();
    this.hips.position.y = HIP_Y;
    this.root.add(this.hips);

    this.buildPelvis();

    this.chest = new THREE.Group();
    this.chest.position.y = 0.14;
    this.hips.add(this.chest);
    this.buildTorso();
    this.buildNeck();
    this.buildHead();

    this.lShoulder = this.arm(-1);
    this.rShoulder = this.arm(1);
    this.lElbow = this.lShoulder.userData.elbow as THREE.Group;
    this.rElbow = this.rShoulder.userData.elbow as THREE.Group;

    this.lHip = this.leg(-1);
    this.rHip = this.leg(1);
    this.lKnee = this.lHip.userData.knee as THREE.Group;
    this.rKnee = this.rHip.userData.knee as THREE.Group;
    this.lAnkle = this.lHip.userData.ankle as THREE.Group;
    this.rAnkle = this.rHip.userData.ankle as THREE.Group;

    this.carryAnchor.position.set(0, 1.08, 0.24);
    this.root.add(this.carryAnchor);

    this.poseIdle(1);
  }

  facingYaw(): number {
    return this.root.rotation.y;
  }

  setFacing(yaw: number): void {
    this.root.rotation.y = yaw;
  }

  update(dt: number, moving: boolean, speedBlend: number, carrying: boolean): void {
    const cadence = THREE.MathUtils.lerp(0, 8.4, speedBlend);
    if (moving) this.phase += dt * cadence;
    else this.phase *= 1 - Math.min(1, dt * 8);

    const walk = moving ? speedBlend : 0;
    this.poseIdle(1 - walk);
    this.poseWalk(walk);
    if (carrying) this.poseCarry(1);

    this.bob = THREE.MathUtils.damp(this.bob, moving ? 1 : 0, 8, dt);
    this.hips.position.y = HIP_Y + Math.abs(Math.sin(this.phase)) * 0.024 * this.bob;
  }

  private poseIdle(w: number): void {
    if (w <= 0.001) return;
    this.chest.rotation.x = THREE.MathUtils.lerp(this.chest.rotation.x, 0.015, w);
    this.lShoulder.rotation.set(
      THREE.MathUtils.lerp(this.lShoulder.rotation.x, 0.04, w),
      0,
      THREE.MathUtils.lerp(this.lShoulder.rotation.z, 0.04, w),
    );
    this.rShoulder.rotation.set(
      THREE.MathUtils.lerp(this.rShoulder.rotation.x, 0.04, w),
      0,
      THREE.MathUtils.lerp(this.rShoulder.rotation.z, -0.04, w),
    );
    this.lElbow.rotation.x = THREE.MathUtils.lerp(this.lElbow.rotation.x, 0.22, w);
    this.rElbow.rotation.x = THREE.MathUtils.lerp(this.rElbow.rotation.x, 0.22, w);
    this.lHip.rotation.set(THREE.MathUtils.lerp(this.lHip.rotation.x, 0.025, w), 0, 0.018);
    this.rHip.rotation.set(THREE.MathUtils.lerp(this.rHip.rotation.x, 0.025, w), 0, -0.018);
    this.lKnee.rotation.x = THREE.MathUtils.lerp(this.lKnee.rotation.x, 0.045, w);
    this.rKnee.rotation.x = THREE.MathUtils.lerp(this.rKnee.rotation.x, 0.045, w);
    this.lAnkle.rotation.x = THREE.MathUtils.lerp(this.lAnkle.rotation.x, -0.035, w);
    this.rAnkle.rotation.x = THREE.MathUtils.lerp(this.rAnkle.rotation.x, -0.035, w);
    this.hips.rotation.y = THREE.MathUtils.lerp(this.hips.rotation.y, 0, w);
  }

  private poseWalk(w: number): void {
    if (w <= 0.001) return;
    const t = this.phase;
    const stride = 0.6 * w;
    this.lHip.rotation.x = Math.sin(t) * stride;
    this.rHip.rotation.x = Math.sin(t + Math.PI) * stride;
    this.lKnee.rotation.x = 0.08 + Math.max(0, Math.sin(t + 0.35)) * 0.82 * w;
    this.rKnee.rotation.x = 0.08 + Math.max(0, Math.sin(t + Math.PI + 0.35)) * 0.82 * w;
    this.lAnkle.rotation.x = -0.07 - Math.sin(t) * 0.14 * w;
    this.rAnkle.rotation.x = -0.07 - Math.sin(t + Math.PI) * 0.14 * w;
    this.lShoulder.rotation.x = Math.sin(t + Math.PI) * 0.3 * w;
    this.rShoulder.rotation.x = Math.sin(t) * 0.3 * w;
    this.lShoulder.rotation.z = 0.04;
    this.rShoulder.rotation.z = -0.04;
    this.lElbow.rotation.x = 0.18 + Math.max(0, Math.sin(t + Math.PI)) * 0.16 * w;
    this.rElbow.rotation.x = 0.18 + Math.max(0, Math.sin(t)) * 0.16 * w;
    this.chest.rotation.x = 0.04 * w;
    this.hips.rotation.y = Math.sin(t) * 0.04 * w;
  }

  private poseCarry(w: number): void {
    this.lShoulder.rotation.x = THREE.MathUtils.lerp(this.lShoulder.rotation.x, 0.5, w);
    this.rShoulder.rotation.x = THREE.MathUtils.lerp(this.rShoulder.rotation.x, 0.5, w);
    this.lShoulder.rotation.z = THREE.MathUtils.lerp(this.lShoulder.rotation.z, 0.12, w);
    this.rShoulder.rotation.z = THREE.MathUtils.lerp(this.rShoulder.rotation.z, -0.12, w);
    this.lElbow.rotation.x = THREE.MathUtils.lerp(this.lElbow.rotation.x, 1.0, w);
    this.rElbow.rotation.x = THREE.MathUtils.lerp(this.rElbow.rotation.x, 1.0, w);
  }

  private buildPelvis(): void {
    const core = this.mesh(new THREE.CylinderGeometry(0.07, 0.078, 0.074, 16), this.mats.matte);
    this.hips.add(core);

    for (const side of [-1, 1]) {
      const motor = this.mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.07, 12), this.mats.actuator);
      motor.rotation.z = side * 0.65;
      motor.position.set(side * 0.085, 0.025, 0.012);
      this.hips.add(motor);

    }
  }

  private buildTorso(): void {
    const pecs = this.mesh(createPecShell(), this.mats.white);
    pecs.name = "pecShell";
    pecs.position.y = 0.02;
    pecs.position.z = 0.006;
    this.chest.add(pecs);

    const waist = this.mesh(createMidriff(), this.mats.matte);
    waist.position.y = 0.012;
    this.chest.add(waist);
  }

  private buildNeck(): void {
    const column = this.mesh(new THREE.CylinderGeometry(0.044, 0.052, 0.16, 20), this.mats.matte);
    column.name = "neckColumn";
    column.position.set(0, 0.372, 0.01);
    this.chest.add(column);

    const well = this.mesh(new THREE.CylinderGeometry(0.068, 0.05, 0.046, 20), this.mats.matte);
    well.position.set(0, 0.312, 0.01);
    this.chest.add(well);
  }

  private buildHead(): void {
    const head = new THREE.Group();
    head.name = "head";
    head.position.set(0, 0.528, 0.012);
    this.chest.add(head);

    const skull = this.mesh(createVisorSkull(), this.mats.skull);
    skull.name = "visorSkull";
    head.add(skull);
  }

  private arm(side: number): THREE.Group {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.268, 0.248, 0.016);
    this.chest.add(shoulder);

    const socket = this.mesh(new THREE.SphereGeometry(0.012, 8, 6), this.mats.joint);
    socket.position.set(side * 0.02, -0.04, 0);
    shoulder.add(socket);

    const upper = new THREE.Group();
    upper.position.set(side * 0.018, -0.05, 0);
    shoulder.add(upper);

    const housing = this.mesh(createLimbShell(0.165, 0.048, 0.04, 0.042), this.mats.white);
    housing.position.y = -0.1;
    upper.add(housing);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.22, 0);
    upper.add(elbow);
    shoulder.userData.elbow = elbow;

    const pivot = this.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.062, 16), this.mats.joint);
    pivot.rotation.z = Math.PI / 2;
    elbow.add(pivot);
    this.bellows(elbow, 0.028, 4, 0.008);

    const forearm = new THREE.Group();
    forearm.position.y = -0.022;
    elbow.add(forearm);

    const fHousing = this.mesh(createLimbShell(0.17, 0.042, 0.034, 0.038), this.mats.white);
    fHousing.position.y = -0.01;
    forearm.add(fHousing);

    const wrist = this.mesh(new THREE.SphereGeometry(0.02, 10, 8), this.mats.joint);
    wrist.position.y = -0.192;
    forearm.add(wrist);

    const hand = this.hand(side);
    hand.position.set(0, -0.208, 0);
    forearm.add(hand);

    return shoulder;
  }

  private hand(side: number): THREE.Group {
    const g = new THREE.Group();

    const palm = this.mesh(new THREE.SphereGeometry(0.03, 16, 12), this.mats.matte);
    palm.scale.set(1.32, 0.9, 0.7);
    palm.position.set(0, -0.03, 0);
    g.add(palm);
    const dorsal = this.mesh(new THREE.SphereGeometry(0.026, 14, 10), this.mats.white);
    dorsal.scale.set(1.18, 0.72, 0.32);
    dorsal.position.set(0, -0.026, 0.015);
    g.add(dorsal);

    const xs = [-0.022, -0.007, 0.008, 0.022];
    const lens = [0.036, 0.042, 0.04, 0.03];
    for (let i = 0; i < 4; i += 1) {
      const bone = this.mesh(new THREE.CapsuleGeometry(0.0068, lens[i], 3, 8), this.mats.matte);
      bone.position.set(xs[i], -0.058, 0);
      bone.rotation.x = 0.38 + i * 0.03;
      g.add(bone);
      const pad = this.mesh(new THREE.SphereGeometry(0.0074, 10, 8), this.mats.white);
      pad.scale.set(0.82, 1.7 + i * 0.08, 0.42);
      pad.position.set(xs[i], -0.054, 0.013);
      pad.rotation.x = 0.38 + i * 0.03;
      g.add(pad);
    }

    const thumb = this.mesh(new THREE.CapsuleGeometry(0.0066, 0.02, 3, 8), this.mats.matte);
    thumb.position.set(side * 0.032, -0.018, 0.004);
    thumb.rotation.set(0.3, side * 0.48, side * 0.68);
    g.add(thumb);
    const tPad = this.mesh(new THREE.SphereGeometry(0.007, 10, 8), this.mats.white);
    tPad.scale.set(0.8, 1.5, 0.4);
    tPad.position.set(side * 0.034, -0.02, 0.014);
    tPad.rotation.set(0.3, side * 0.48, side * 0.68);
    g.add(tPad);
    return g;
  }

  private leg(side: number): THREE.Group {
    const hip = new THREE.Group();
    hip.position.set(side * 0.12, -0.028, 0);
    this.hips.add(hip);

    const ball = this.mesh(new THREE.SphereGeometry(0.028, 12, 10), this.mats.joint);
    hip.add(ball);
    const motor = this.mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.07, 10), this.mats.actuator);
    motor.rotation.z = side * 0.48;
    motor.position.set(side * 0.036, 0.022, 0.01);
    hip.add(motor);

    const thigh = new THREE.Group();
    thigh.position.y = -0.022;
    hip.add(thigh);

    const tHousing = this.mesh(createThighShell(0.365, side), this.mats.white);
    tHousing.position.set(0, -0.01, 0.018);
    thigh.add(tHousing);

    const knee = new THREE.Group();
    knee.position.y = -0.388;
    thigh.add(knee);
    hip.userData.knee = knee;

    const axle = this.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.048, 10), this.mats.joint);
    axle.rotation.z = Math.PI / 2;
    knee.add(axle);
    const cap = this.mesh(createKneeCap(), this.mats.white);
    cap.position.set(0, 0.004, 0.038);
    knee.add(cap);

    const shin = new THREE.Group();
    shin.position.y = -0.022;
    knee.add(shin);

    const sHousing = this.mesh(createShinShell(0.385), this.mats.white);
    sHousing.position.set(0, -0.008, 0.01);
    shin.add(sHousing);

    const ankle = new THREE.Group();
    ankle.position.y = -0.408;
    shin.add(ankle);
    hip.userData.ankle = ankle;

    const joint = this.mesh(new THREE.SphereGeometry(0.024, 10, 8), this.mats.joint);
    ankle.add(joint);

    const boot = this.panel(0.086, 0.058, 0.2, this.mats.matte, 0.024);
    boot.position.set(0, -0.036, 0.042);
    ankle.add(boot);
    const toe = this.mesh(new THREE.SphereGeometry(0.036, 14, 10), this.mats.matte);
    toe.scale.set(1.15, 0.72, 1.2);
    toe.position.set(0, -0.04, 0.138);
    ankle.add(toe);

    return hip;
  }

  private bellows(parent: THREE.Group, radius: number, count: number, spacing: number): void {
    for (let i = 0; i < count; i += 1) {
      const ring = this.mesh(new THREE.TorusGeometry(radius, 0.004, 6, 14), this.mats.matte);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = (i - (count - 1) / 2) * spacing;
      parent.add(ring);
    }
  }

  private panel(
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    radius = 0.012,
  ): THREE.Mesh {
    return this.mesh(new RoundedBoxGeometry(w, h, d, 3, radius), mat);
  }

  private mesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
    const m = new THREE.Mesh(geometry, material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
}
