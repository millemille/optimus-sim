import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createRobotMaterials, type RobotMaterials } from "./materials.ts";

const HIP_Y = 0.95;

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
    this.chest.position.y = 0.16;
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

    this.carryAnchor.position.set(0, 1.1, 0.3);
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
    this.hips.position.y = HIP_Y + Math.abs(Math.sin(this.phase)) * 0.026 * this.bob;
  }

  private poseIdle(w: number): void {
    if (w <= 0.001) return;
    this.chest.rotation.x = THREE.MathUtils.lerp(this.chest.rotation.x, 0.02, w);
    this.lShoulder.rotation.set(
      THREE.MathUtils.lerp(this.lShoulder.rotation.x, 0.05, w),
      0,
      THREE.MathUtils.lerp(this.lShoulder.rotation.z, 0.05, w),
    );
    this.rShoulder.rotation.set(
      THREE.MathUtils.lerp(this.rShoulder.rotation.x, 0.05, w),
      0,
      THREE.MathUtils.lerp(this.rShoulder.rotation.z, -0.05, w),
    );
    this.lElbow.rotation.x = THREE.MathUtils.lerp(this.lElbow.rotation.x, 0.16, w);
    this.rElbow.rotation.x = THREE.MathUtils.lerp(this.rElbow.rotation.x, 0.16, w);
    this.lHip.rotation.set(THREE.MathUtils.lerp(this.lHip.rotation.x, 0.03, w), 0, 0.02);
    this.rHip.rotation.set(THREE.MathUtils.lerp(this.rHip.rotation.x, 0.03, w), 0, -0.02);
    this.lKnee.rotation.x = THREE.MathUtils.lerp(this.lKnee.rotation.x, 0.05, w);
    this.rKnee.rotation.x = THREE.MathUtils.lerp(this.rKnee.rotation.x, 0.05, w);
    this.lAnkle.rotation.x = THREE.MathUtils.lerp(this.lAnkle.rotation.x, -0.04, w);
    this.rAnkle.rotation.x = THREE.MathUtils.lerp(this.rAnkle.rotation.x, -0.04, w);
    this.hips.rotation.y = THREE.MathUtils.lerp(this.hips.rotation.y, 0, w);
  }

  private poseWalk(w: number): void {
    if (w <= 0.001) return;
    const t = this.phase;
    const stride = 0.62 * w;
    this.lHip.rotation.x = Math.sin(t) * stride;
    this.rHip.rotation.x = Math.sin(t + Math.PI) * stride;
    this.lKnee.rotation.x = 0.08 + Math.max(0, Math.sin(t + 0.35)) * 0.85 * w;
    this.rKnee.rotation.x = 0.08 + Math.max(0, Math.sin(t + Math.PI + 0.35)) * 0.85 * w;
    this.lAnkle.rotation.x = -0.07 - Math.sin(t) * 0.14 * w;
    this.rAnkle.rotation.x = -0.07 - Math.sin(t + Math.PI) * 0.14 * w;
    this.lShoulder.rotation.x = Math.sin(t + Math.PI) * 0.32 * w;
    this.rShoulder.rotation.x = Math.sin(t) * 0.32 * w;
    this.lShoulder.rotation.z = 0.04;
    this.rShoulder.rotation.z = -0.04;
    this.lElbow.rotation.x = 0.22 + Math.max(0, Math.sin(t + Math.PI)) * 0.18 * w;
    this.rElbow.rotation.x = 0.22 + Math.max(0, Math.sin(t)) * 0.18 * w;
    this.chest.rotation.x = 0.06 * w;
    this.hips.rotation.y = Math.sin(t) * 0.045 * w;
  }

  private poseCarry(w: number): void {
    this.lShoulder.rotation.x = THREE.MathUtils.lerp(this.lShoulder.rotation.x, 0.52, w);
    this.rShoulder.rotation.x = THREE.MathUtils.lerp(this.rShoulder.rotation.x, 0.52, w);
    this.lShoulder.rotation.z = THREE.MathUtils.lerp(this.lShoulder.rotation.z, 0.14, w);
    this.rShoulder.rotation.z = THREE.MathUtils.lerp(this.rShoulder.rotation.z, -0.14, w);
    this.lElbow.rotation.x = THREE.MathUtils.lerp(this.lElbow.rotation.x, 1.02, w);
    this.rElbow.rotation.x = THREE.MathUtils.lerp(this.rElbow.rotation.x, 1.02, w);
  }

  private buildPelvis(): void {
    const shell = this.panel(0.28, 0.13, 0.18, this.mats.white, 0.04);
    shell.position.y = 0.01;
    this.hips.add(shell);

    const front = this.panel(0.22, 0.08, 0.05, this.mats.white, 0.022);
    front.position.set(0, 0.0, 0.08);
    this.hips.add(front);

    const core = this.mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.07, 16), this.mats.matte);
    core.position.y = 0.08;
    this.hips.add(core);

    for (const side of [-1, 1]) {
      const housing = this.mesh(new THREE.SphereGeometry(0.048, 16, 12), this.mats.joint);
      housing.scale.set(1.1, 0.85, 1);
      housing.position.set(side * 0.1, -0.01, 0.01);
      this.hips.add(housing);

      const motor = this.mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.09, 12), this.mats.actuator);
      motor.rotation.z = side * 0.85;
      motor.position.set(side * 0.08, 0.04, 0.02);
      this.hips.add(motor);
    }
  }

  private buildTorso(): void {
    const chest = this.mesh(new THREE.SphereGeometry(0.16, 28, 20), this.mats.white);
    chest.scale.set(1.55, 1.05, 0.95);
    chest.position.set(0, 0.26, 0.02);
    this.chest.add(chest);

    const pec = this.panel(0.34, 0.11, 0.045, this.mats.white, 0.03);
    pec.position.set(0, 0.3, 0.14);
    this.chest.add(pec);

    const trap = this.panel(0.26, 0.06, 0.14, this.mats.white, 0.024);
    trap.position.set(0, 0.385, 0.02);
    this.chest.add(trap);

    const back = this.panel(0.4, 0.26, 0.07, this.mats.white, 0.04);
    back.position.set(0, 0.25, -0.09);
    this.chest.add(back);

    for (const side of [-1, 1]) {
      const wrap = this.panel(0.07, 0.22, 0.16, this.mats.white, 0.03);
      wrap.position.set(side * 0.2, 0.26, 0.01);
      this.chest.add(wrap);
    }

    for (let i = 0; i < 5; i += 1) {
      const ring = this.mesh(new THREE.TorusGeometry(0.072 - i * 0.003, 0.011, 8, 22), this.mats.matte);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.02 + i * 0.024;
      this.chest.add(ring);
    }

    const abs = this.mesh(new THREE.CylinderGeometry(0.068, 0.085, 0.13, 16), this.mats.matte);
    abs.position.y = 0.06;
    this.chest.add(abs);
  }

  private buildNeck(): void {
    const column = this.mesh(new THREE.CylinderGeometry(0.048, 0.07, 0.1, 16), this.mats.matte);
    column.position.set(0, 0.46, 0.01);
    this.chest.add(column);

    const trapL = this.mesh(new THREE.SphereGeometry(0.055, 14, 10), this.mats.matte);
    trapL.scale.set(1.2, 0.55, 0.9);
    trapL.position.set(-0.05, 0.43, -0.01);
    this.chest.add(trapL);
    const trapR = trapL.clone();
    trapR.position.x = 0.05;
    this.chest.add(trapR);
  }

  private buildHead(): void {
    const head = new THREE.Group();
    head.position.set(0, 0.58, 0.02);
    this.chest.add(head);

    const skull = this.mesh(new THREE.SphereGeometry(0.112, 36, 28), this.mats.skull);
    skull.scale.set(0.86, 1.1, 1.02);
    skull.position.set(0, 0.01, -0.012);
    head.add(skull);

    const face = this.panel(0.155, 0.175, 0.018, this.mats.visor, 0.04);
    face.position.set(0, 0.002, 0.09);
    head.add(face);

    const wrap = this.mesh(
      new THREE.SphereGeometry(0.108, 32, 20, Math.PI * 0.3, Math.PI * 0.4, Math.PI * 0.38, Math.PI * 0.48),
      this.mats.visor,
    );
    wrap.scale.set(0.84, 1.0, 0.98);
    wrap.position.set(0, 0.0, 0.004);
    head.add(wrap);
  }

  private arm(side: number): THREE.Group {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.24, 0.34, 0);
    this.chest.add(shoulder);

    const pauldron = this.mesh(new THREE.SphereGeometry(0.1, 22, 16), this.mats.white);
    pauldron.scale.set(1.25, 0.82, 1.2);
    pauldron.position.set(side * 0.035, 0.04, 0.01);
    shoulder.add(pauldron);

    const flow = this.panel(0.1, 0.08, 0.12, this.mats.white, 0.03);
    flow.position.set(side * 0.04, -0.01, 0);
    shoulder.add(flow);

    const socket = this.mesh(new THREE.SphereGeometry(0.042, 14, 12), this.mats.joint);
    socket.position.set(side * 0.04, -0.03, 0);
    shoulder.add(socket);

    const upper = new THREE.Group();
    upper.position.set(side * 0.04, -0.05, 0);
    shoulder.add(upper);

    const housing = this.mesh(new THREE.CylinderGeometry(0.042, 0.05, 0.2, 16), this.mats.white);
    housing.scale.set(1.15, 1, 0.95);
    housing.position.y = -0.11;
    upper.add(housing);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.23, 0);
    upper.add(elbow);
    shoulder.userData.elbow = elbow;

    const pivot = this.mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.078, 16), this.mats.joint);
    pivot.rotation.z = Math.PI / 2;
    elbow.add(pivot);
    this.bellows(elbow, 0.036, 6, 0.01);

    const pad = this.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 14), this.mats.matte);
    pad.rotation.z = Math.PI / 2;
    pad.position.set(side * 0.042, 0, 0);
    elbow.add(pad);
    for (let i = 0; i < 5; i += 1) {
      const rib = this.mesh(new THREE.BoxGeometry(0.006, 0.038, 0.008), this.mats.joint);
      rib.position.set(side * 0.052, (i - 2) * 0.009, 0);
      elbow.add(rib);
    }

    const forearm = new THREE.Group();
    forearm.position.y = -0.03;
    elbow.add(forearm);

    const fHousing = this.mesh(new THREE.CylinderGeometry(0.036, 0.044, 0.18, 16), this.mats.white);
    fHousing.scale.set(1.12, 1, 0.95);
    fHousing.position.y = -0.1;
    forearm.add(fHousing);

    const cuff = this.mesh(new THREE.CylinderGeometry(0.032, 0.03, 0.028, 12), this.mats.white);
    cuff.position.y = -0.195;
    forearm.add(cuff);

    const wrist = this.mesh(new THREE.SphereGeometry(0.024, 12, 10), this.mats.joint);
    wrist.position.y = -0.215;
    forearm.add(wrist);

    const hand = this.hand(side);
    hand.position.set(0, -0.23, 0);
    forearm.add(hand);

    return shoulder;
  }

  private hand(side: number): THREE.Group {
    const g = new THREE.Group();
    const palm = this.panel(0.074, 0.08, 0.03, this.mats.matte, 0.01);
    palm.position.y = -0.03;
    g.add(palm);

    const plate = this.panel(0.068, 0.055, 0.014, this.mats.white, 0.008);
    plate.position.set(0, -0.018, 0.014);
    g.add(plate);

    const xs = [-0.027, -0.009, 0.009, 0.026];
    const lengths = [0.07, 0.078, 0.074, 0.062];
    xs.forEach((x, i) => {
      g.add(this.finger(x, lengths[i], 0.014));
    });

    const thumb = this.finger(side * 0.03, 0.052, 0.014);
    thumb.rotation.z = side * -0.7;
    thumb.position.set(side * 0.024, -0.008, 0.008);
    g.add(thumb);
    return g;
  }

  private finger(x: number, length: number, width: number): THREE.Group {
    const g = new THREE.Group();
    g.position.set(x, -0.07, 0);

    const p1 = this.panel(width, length * 0.38, 0.014, this.mats.white, 0.004);
    p1.position.y = -length * 0.16;
    g.add(p1);
    const k1 = this.mesh(new THREE.SphereGeometry(width * 0.4, 8, 6), this.mats.joint);
    k1.position.y = -length * 0.36;
    g.add(k1);
    const p2 = this.panel(width * 0.92, length * 0.32, 0.013, this.mats.white, 0.003);
    p2.position.y = -length * 0.54;
    g.add(p2);
    const k2 = this.mesh(new THREE.SphereGeometry(width * 0.34, 8, 6), this.mats.joint);
    k2.position.y = -length * 0.7;
    g.add(k2);
    const tip = this.panel(width * 0.82, length * 0.22, 0.012, this.mats.white, 0.003);
    tip.position.y = -length * 0.84;
    g.add(tip);
    return g;
  }

  private leg(side: number): THREE.Group {
    const hip = new THREE.Group();
    hip.position.set(side * 0.095, -0.03, 0);
    this.hips.add(hip);

    const ball = this.mesh(new THREE.SphereGeometry(0.05, 16, 12), this.mats.joint);
    hip.add(ball);
    const housing = this.mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.1, 12), this.mats.actuator);
    housing.rotation.z = side * 0.5;
    housing.position.set(side * 0.045, 0.03, 0.015);
    hip.add(housing);

    const thigh = new THREE.Group();
    thigh.position.y = -0.03;
    hip.add(thigh);

    const tHousing = this.mesh(new THREE.CylinderGeometry(0.05, 0.068, 0.34, 16), this.mats.white);
    tHousing.scale.set(1.18, 1, 0.95);
    tHousing.position.y = -0.18;
    thigh.add(tHousing);

    const knee = new THREE.Group();
    knee.position.y = -0.38;
    thigh.add(knee);
    hip.userData.knee = knee;

    const disk = this.mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.085, 20), this.mats.joint);
    disk.rotation.z = Math.PI / 2;
    knee.add(disk);
    const hub = this.mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.09, 12), this.mats.metal);
    hub.rotation.z = Math.PI / 2;
    knee.add(hub);

    const shin = new THREE.Group();
    shin.position.y = -0.03;
    knee.add(shin);

    const sHousing = this.mesh(new THREE.CylinderGeometry(0.042, 0.055, 0.32, 16), this.mats.white);
    sHousing.scale.set(1.15, 1, 0.95);
    sHousing.position.y = -0.17;
    shin.add(sHousing);

    const ankle = new THREE.Group();
    ankle.position.y = -0.35;
    shin.add(ankle);
    hip.userData.ankle = ankle;

    const joint = this.mesh(new THREE.SphereGeometry(0.03, 12, 10), this.mats.joint);
    ankle.add(joint);
    for (const x of [-0.018, 0.018]) {
      const cable = this.mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.08, 8), this.mats.metal);
      cable.position.set(x, 0.02, -0.028);
      cable.rotation.x = 0.25;
      ankle.add(cable);
    }

    const boot = this.panel(0.095, 0.085, 0.25, this.mats.matte, 0.032);
    boot.position.set(0, -0.05, 0.055);
    ankle.add(boot);
    const toe = this.mesh(new THREE.SphereGeometry(0.044, 16, 12), this.mats.matte);
    toe.scale.set(1.1, 0.85, 1.15);
    toe.position.set(0, -0.048, 0.16);
    ankle.add(toe);
    const sole = this.panel(0.086, 0.016, 0.22, this.mats.joint, 0.008);
    sole.position.set(0, -0.078, 0.045);
    ankle.add(sole);

    return hip;
  }

  private bellows(parent: THREE.Group, radius: number, count: number, spacing: number): void {
    for (let i = 0; i < count; i += 1) {
      const ring = this.mesh(new THREE.TorusGeometry(radius, 0.005, 6, 16), this.mats.matte);
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
    return this.mesh(new RoundedBoxGeometry(w, h, d, 4, radius), mat);
  }

  private mesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
    const m = new THREE.Mesh(geometry, material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
}
