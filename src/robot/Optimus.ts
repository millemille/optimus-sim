import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  createCrotchGuard,
  createDeltoid,
  createFinger,
  createKneeCap,
  createLimbShell,
  createMidriff,
  createPalm,
  createPecShell,
  createPelvis,
  createShinShell,
  createThorax,
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
    const bowl = this.mesh(createPelvis(), this.mats.matte);
    bowl.position.y = 0.02;
    this.hips.add(bowl);

    const crotch = this.mesh(createCrotchGuard(), this.mats.matte);
    crotch.position.set(0, -0.12, 0.05);
    this.hips.add(crotch);

    const bridge = this.panel(0.3, 0.28, 0.16, this.mats.matte, 0.03);
    bridge.position.set(0, -0.06, 0.04);
    this.hips.add(bridge);

    for (const side of [-1, 1]) {
      const motor = this.mesh(new THREE.CylinderGeometry(0.024, 0.03, 0.09, 12), this.mats.actuator);
      motor.rotation.z = side * 0.72;
      motor.position.set(side * 0.108, 0.01, 0.016);
      this.hips.add(motor);
      const cup = this.mesh(new THREE.SphereGeometry(0.05, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.75), this.mats.matte);
      cup.rotation.x = Math.PI;
      cup.position.set(side * 0.122, -0.02, 0.008);
      this.hips.add(cup);
      const web = this.panel(0.08, 0.22, 0.1, this.mats.matte, 0.02);
      web.position.set(side * 0.08, -0.14, 0.02);
      this.hips.add(web);
    }
  }

  private buildTorso(): void {
    const thorax = this.mesh(createThorax(), this.mats.matte);
    thorax.position.y = 0.02;
    this.chest.add(thorax);

    const pecs = this.mesh(createPecShell(), this.mats.white);
    pecs.name = "pecShell";
    pecs.position.y = 0.016;
    pecs.position.z = 0.01;
    this.chest.add(pecs);

    const waist = this.mesh(createMidriff(), this.mats.matte);
    waist.position.y = -0.02;
    this.chest.add(waist);
  }

  private buildNeck(): void {
    const column = this.mesh(new THREE.CylinderGeometry(0.044, 0.052, 0.16, 20), this.mats.matte);
    column.name = "neckColumn";
    column.position.set(0, 0.372, 0.01);
    this.chest.add(column);
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

    const sleeve = this.mesh(createDeltoid(side), this.mats.white);
    sleeve.position.set(0, -0.008, 0.008);
    upper.add(sleeve);

    const housing = this.mesh(createLimbShell(0.2, 0.056, 0.046, 0.058), this.mats.white);
    housing.position.y = -0.055;
    upper.add(housing);

    const bicep = this.panel(0.062, 0.155, 0.024, this.mats.white, 0.014);
    bicep.position.set(0, -0.118, 0.04);
    upper.add(bicep);

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

    const fHousing = this.mesh(createLimbShell(0.17, 0.05, 0.04, 0.052), this.mats.white);
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

    const palm = this.mesh(createPalm(), this.mats.matte);
    palm.position.set(0, -0.03, 0.006);
    g.add(palm);
    const dorsal = this.panel(0.078, 0.048, 0.022, this.mats.white, 0.018);
    dorsal.position.set(0, -0.036, 0.028);
    g.add(dorsal);

    const xs = [-0.026, -0.009, 0.008, 0.024];
    const lens = [0.038, 0.044, 0.042, 0.036];
    const widths = [0.03, 0.032, 0.03, 0.028];
    const fans = [-0.1, -0.02, 0.03, 0.12];
    for (let i = 0; i < 4; i += 1) {
      const p = this.mesh(createFinger(lens[i], widths[i]), this.mats.white);
      p.position.set(xs[i], -0.048, 0.018);
      p.rotation.z = fans[i];
      p.rotation.x = 0.58;
      g.add(p);
    }

    const thumb = this.mesh(createFinger(0.036, 0.028), this.mats.white);
    thumb.position.set(side * 0.03, -0.018, 0.02);
    thumb.rotation.set(0.85, side * 0.35, side * 0.9);
    g.add(thumb);
    return g;
  }

  private leg(side: number): THREE.Group {
    const hip = new THREE.Group();
    hip.position.set(side * 0.12, 0.006, 0);
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

    const tHousing = this.mesh(createThighShell(0.34, side), this.mats.white);
    tHousing.position.set(0, -0.04, 0.022);
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
