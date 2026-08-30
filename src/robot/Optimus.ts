import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createRobotMaterials, type RobotMaterials } from "./materials.ts";

const HIP_Y = 0.86;

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
  private readonly status: THREE.Mesh[];
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

    this.carryAnchor.position.set(0, 1.08, 0.28);
    this.root.add(this.carryAnchor);

    this.status = [];
    this.root.traverse((obj) => {
      if (obj.name === "status") this.status.push(obj as THREE.Mesh);
    });

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
    this.hips.position.y = HIP_Y + Math.abs(Math.sin(this.phase)) * 0.028 * this.bob;

    const pulse = 0.16 + Math.sin(performance.now() * 0.002) * 0.05;
    for (const dot of this.status) {
      (dot.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
  }

  private poseIdle(w: number): void {
    if (w <= 0.001) return;
    this.chest.rotation.x = THREE.MathUtils.lerp(this.chest.rotation.x, 0.03, w);
    this.lShoulder.rotation.set(
      THREE.MathUtils.lerp(this.lShoulder.rotation.x, 0.06, w),
      0,
      THREE.MathUtils.lerp(this.lShoulder.rotation.z, 0.06, w),
    );
    this.rShoulder.rotation.set(
      THREE.MathUtils.lerp(this.rShoulder.rotation.x, 0.06, w),
      0,
      THREE.MathUtils.lerp(this.rShoulder.rotation.z, -0.06, w),
    );
    this.lElbow.rotation.x = THREE.MathUtils.lerp(this.lElbow.rotation.x, 0.18, w);
    this.rElbow.rotation.x = THREE.MathUtils.lerp(this.rElbow.rotation.x, 0.18, w);
    this.lHip.rotation.set(THREE.MathUtils.lerp(this.lHip.rotation.x, 0.03, w), 0, 0.025);
    this.rHip.rotation.set(THREE.MathUtils.lerp(this.rHip.rotation.x, 0.03, w), 0, -0.025);
    this.lKnee.rotation.x = THREE.MathUtils.lerp(this.lKnee.rotation.x, 0.06, w);
    this.rKnee.rotation.x = THREE.MathUtils.lerp(this.rKnee.rotation.x, 0.06, w);
    this.lAnkle.rotation.x = THREE.MathUtils.lerp(this.lAnkle.rotation.x, -0.05, w);
    this.rAnkle.rotation.x = THREE.MathUtils.lerp(this.rAnkle.rotation.x, -0.05, w);
    this.hips.rotation.y = THREE.MathUtils.lerp(this.hips.rotation.y, 0, w);
  }

  private poseWalk(w: number): void {
    if (w <= 0.001) return;
    const t = this.phase;
    const stride = 0.68 * w;
    this.lHip.rotation.x = Math.sin(t) * stride;
    this.rHip.rotation.x = Math.sin(t + Math.PI) * stride;
    this.lKnee.rotation.x = 0.08 + Math.max(0, Math.sin(t + 0.35)) * 0.9 * w;
    this.rKnee.rotation.x = 0.08 + Math.max(0, Math.sin(t + Math.PI + 0.35)) * 0.9 * w;
    this.lAnkle.rotation.x = -0.08 - Math.sin(t) * 0.16 * w;
    this.rAnkle.rotation.x = -0.08 - Math.sin(t + Math.PI) * 0.16 * w;
    this.lShoulder.rotation.x = Math.sin(t + Math.PI) * 0.36 * w;
    this.rShoulder.rotation.x = Math.sin(t) * 0.36 * w;
    this.lShoulder.rotation.z = 0.05;
    this.rShoulder.rotation.z = -0.05;
    this.lElbow.rotation.x = 0.24 + Math.max(0, Math.sin(t + Math.PI)) * 0.2 * w;
    this.rElbow.rotation.x = 0.24 + Math.max(0, Math.sin(t)) * 0.2 * w;
    this.chest.rotation.x = 0.07 * w;
    this.hips.rotation.y = Math.sin(t) * 0.05 * w;
  }

  private poseCarry(w: number): void {
    this.lShoulder.rotation.x = THREE.MathUtils.lerp(this.lShoulder.rotation.x, 0.55, w);
    this.rShoulder.rotation.x = THREE.MathUtils.lerp(this.rShoulder.rotation.x, 0.55, w);
    this.lShoulder.rotation.z = THREE.MathUtils.lerp(this.lShoulder.rotation.z, 0.16, w);
    this.rShoulder.rotation.z = THREE.MathUtils.lerp(this.rShoulder.rotation.z, -0.16, w);
    this.lElbow.rotation.x = THREE.MathUtils.lerp(this.lElbow.rotation.x, 1.05, w);
    this.rElbow.rotation.x = THREE.MathUtils.lerp(this.rElbow.rotation.x, 1.05, w);
  }

  private buildPelvis(): void {
    const yolk = this.mesh(new THREE.CapsuleGeometry(0.07, 0.08, 6, 14), this.mats.white);
    yolk.rotation.z = Math.PI / 2;
    yolk.scale.set(1, 1, 0.85);
    yolk.position.y = 0.02;
    this.hips.add(yolk);

    const core = this.mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.08, 14), this.mats.joint);
    core.position.y = 0.05;
    this.hips.add(core);

    for (const side of [-1, 1]) {
      const motor = this.mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.075, 10), this.mats.actuator);
      motor.rotation.z = Math.PI / 2;
      motor.position.set(side * 0.068, 0.04, 0.015);
      this.hips.add(motor);
    }
  }

  private buildTorso(): void {
    const shell = this.mesh(new THREE.CapsuleGeometry(0.145, 0.2, 8, 20), this.mats.white);
    shell.scale.set(1.38, 1.02, 0.78);
    shell.position.set(0, 0.2, 0.01);
    this.chest.add(shell);

    const pec = this.panel(0.32, 0.1, 0.04, this.mats.white, 0.02);
    pec.position.set(0, 0.28, 0.11);
    this.chest.add(pec);

    this.seam(0.34, 0.006, 0.16, 0, 0.22, 0.02);
    this.seam(0.28, 0.006, 0.14, 0, 0.1, 0.015);

    const back = this.mesh(new THREE.CapsuleGeometry(0.13, 0.16, 6, 16), this.mats.white);
    back.scale.set(1.3, 1, 0.45);
    back.position.set(0, 0.2, -0.06);
    this.chest.add(back);

    const waist = this.mesh(new THREE.CylinderGeometry(0.062, 0.078, 0.1, 16), this.mats.matte);
    waist.position.y = -0.015;
    this.chest.add(waist);

    for (let i = 0; i < 3; i += 1) {
      const rib = this.mesh(new THREE.TorusGeometry(0.068, 0.004, 6, 18), this.mats.metal);
      rib.rotation.x = Math.PI / 2;
      rib.position.y = -0.035 + i * 0.026;
      this.chest.add(rib);
    }

    const collar = this.mesh(new THREE.TorusGeometry(0.07, 0.016, 8, 20, Math.PI), this.mats.white);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0.385, 0.01);
    this.chest.add(collar);
  }

  private buildNeck(): void {
    const column = this.mesh(new THREE.CylinderGeometry(0.032, 0.042, 0.08, 12), this.mats.matte);
    column.position.set(0, 0.43, 0);
    this.chest.add(column);
    const ring = this.mesh(new THREE.TorusGeometry(0.038, 0.007, 8, 14), this.mats.joint);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.46, 0);
    this.chest.add(ring);
    const piston = this.mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 8), this.mats.actuator);
    piston.position.set(0.02, 0.43, 0.018);
    this.chest.add(piston);
  }

  private buildHead(): void {
    const head = new THREE.Group();
    head.position.set(0, 0.55, 0.02);
    this.chest.add(head);

    const helmet = this.mesh(new THREE.SphereGeometry(0.105, 32, 24), this.mats.white);
    helmet.scale.set(0.88, 1.04, 0.98);
    helmet.position.set(0, 0.018, -0.012);
    head.add(helmet);

    const brow = this.mesh(new THREE.SphereGeometry(0.1, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), this.mats.white);
    brow.scale.set(0.9, 0.85, 1.02);
    brow.position.set(0, 0.03, 0.01);
    head.add(brow);

    const visor = this.mesh(
      new THREE.SphereGeometry(0.108, 36, 24, Math.PI * 0.22, Math.PI * 0.56, Math.PI * 0.42, Math.PI * 0.5),
      this.mats.visor,
    );
    visor.scale.set(0.92, 1.0, 1.14);
    visor.position.set(0, -0.012, 0.016);
    head.add(visor);

    const shield = this.panel(0.17, 0.1, 0.045, this.mats.visor, 0.03);
    shield.position.set(0, -0.012, 0.086);
    head.add(shield);

    for (const side of [-1, 1]) {
      const wrap = this.panel(0.035, 0.1, 0.1, this.mats.visor, 0.018);
      wrap.position.set(side * 0.078, -0.01, 0.04);
      head.add(wrap);
    }

    for (const x of [-0.018, 0.018]) {
      const dot = this.mesh(new THREE.SphereGeometry(0.0035, 8, 6), this.mats.status);
      dot.name = "status";
      dot.position.set(x, 0.0, 0.062);
      head.add(dot);
    }
  }

  private arm(side: number): THREE.Group {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.205, 0.33, 0);
    this.chest.add(shoulder);

    const cap = this.panel(0.11, 0.085, 0.12, this.mats.white, 0.028);
    cap.position.set(side * 0.028, 0.028, 0);
    shoulder.add(cap);

    const socket = this.mesh(new THREE.SphereGeometry(0.04, 14, 12), this.mats.joint);
    socket.position.set(side * 0.032, -0.018, 0);
    shoulder.add(socket);

    const deltoid = this.mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.055, 10), this.mats.actuator);
    deltoid.rotation.z = side * 0.9;
    deltoid.position.set(side * 0.05, 0.01, 0.01);
    shoulder.add(deltoid);

    const upper = new THREE.Group();
    upper.position.set(side * 0.03, -0.04, 0);
    shoulder.add(upper);

    const shell = this.mesh(new THREE.CapsuleGeometry(0.036, 0.14, 6, 12), this.mats.white);
    shell.position.y = -0.12;
    upper.add(shell);
    const inner = this.mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.16, 8), this.mats.metal);
    inner.position.set(side * -0.018, -0.12, 0);
    upper.add(inner);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.235, 0);
    upper.add(elbow);
    shoulder.userData.elbow = elbow;

    const hinge = this.mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.07, 14), this.mats.joint);
    hinge.rotation.z = Math.PI / 2;
    elbow.add(hinge);
    const ball = this.mesh(new THREE.SphereGeometry(0.03, 12, 10), this.mats.joint);
    elbow.add(ball);
    const pad = this.mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.016, 12), this.mats.matte);
    pad.rotation.z = Math.PI / 2;
    pad.position.set(side * 0.036, 0, 0);
    elbow.add(pad);
    for (let i = 0; i < 4; i += 1) {
      const rib = this.mesh(new THREE.BoxGeometry(0.005, 0.034, 0.007), this.mats.joint);
      rib.position.set(side * 0.044, (i - 1.5) * 0.009, 0);
      elbow.add(rib);
    }

    const forearm = new THREE.Group();
    forearm.position.y = -0.02;
    elbow.add(forearm);

    const fShell = this.mesh(new THREE.CapsuleGeometry(0.03, 0.12, 6, 12), this.mats.white);
    fShell.position.y = -0.11;
    forearm.add(fShell);
    const fInner = this.mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.12, 8), this.mats.metal);
    fInner.position.set(side * -0.016, -0.11, 0);
    forearm.add(fInner);

    const cuff = this.mesh(new THREE.CylinderGeometry(0.028, 0.026, 0.03, 12), this.mats.white);
    cuff.position.y = -0.2;
    forearm.add(cuff);

    const wrist = this.mesh(new THREE.SphereGeometry(0.022, 10, 8), this.mats.joint);
    wrist.position.y = -0.22;
    forearm.add(wrist);

    const hand = this.hand(side);
    hand.position.set(0, -0.235, 0);
    forearm.add(hand);

    return shoulder;
  }

  private hand(side: number): THREE.Group {
    const g = new THREE.Group();
    const palm = this.panel(0.07, 0.075, 0.026, this.mats.matte, 0.008);
    palm.position.y = -0.028;
    g.add(palm);

    const plate = this.panel(0.064, 0.048, 0.012, this.mats.white, 0.006);
    plate.position.set(0, -0.016, 0.012);
    g.add(plate);

    const xs = [-0.026, -0.009, 0.008, 0.025];
    const lengths = [0.066, 0.074, 0.07, 0.06];
    xs.forEach((x, i) => {
      g.add(this.finger(x, lengths[i], 0.013));
    });

    const thumb = this.finger(side * 0.03, 0.05, 0.013);
    thumb.rotation.z = side * -0.72;
    thumb.position.set(side * 0.022, -0.006, 0.006);
    g.add(thumb);
    return g;
  }

  private finger(x: number, length: number, width: number): THREE.Group {
    const g = new THREE.Group();
    g.position.set(x, -0.066, 0);

    const p1 = this.panel(width, length * 0.38, 0.013, this.mats.white, 0.004);
    p1.position.y = -length * 0.16;
    g.add(p1);

    const k1 = this.mesh(new THREE.SphereGeometry(width * 0.42, 8, 6), this.mats.joint);
    k1.position.y = -length * 0.36;
    g.add(k1);

    const p2 = this.panel(width * 0.92, length * 0.32, 0.012, this.mats.white, 0.003);
    p2.position.y = -length * 0.54;
    g.add(p2);

    const k2 = this.mesh(new THREE.SphereGeometry(width * 0.36, 8, 6), this.mats.joint);
    k2.position.y = -length * 0.7;
    g.add(k2);

    const tip = this.panel(width * 0.82, length * 0.22, 0.011, this.mats.white, 0.003);
    tip.position.y = -length * 0.84;
    g.add(tip);
    return g;
  }

  private leg(side: number): THREE.Group {
    const hip = new THREE.Group();
    hip.position.set(side * 0.088, -0.02, 0);
    this.hips.add(hip);

    const ball = this.mesh(new THREE.SphereGeometry(0.042, 14, 12), this.mats.joint);
    hip.add(ball);

    const actuator = this.mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.09, 10), this.mats.actuator);
    actuator.rotation.z = side * 0.55;
    actuator.position.set(side * 0.042, 0.028, 0.01);
    hip.add(actuator);

    const piston = this.mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.07, 8), this.mats.metal);
    piston.rotation.x = 0.4;
    piston.position.set(side * 0.02, 0.01, 0.04);
    hip.add(piston);

    const thigh = new THREE.Group();
    thigh.position.y = -0.02;
    hip.add(thigh);

    const tShell = this.mesh(new THREE.CapsuleGeometry(0.048, 0.24, 6, 14), this.mats.white);
    tShell.position.y = -0.19;
    thigh.add(tShell);
    const tInner = this.mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.22, 8), this.mats.metal);
    tInner.position.set(side * -0.02, -0.19, -0.01);
    thigh.add(tInner);

    const knee = new THREE.Group();
    knee.position.y = -0.39;
    thigh.add(knee);
    hip.userData.knee = knee;

    const pin = this.mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.072, 12), this.mats.joint);
    pin.rotation.z = Math.PI / 2;
    knee.add(pin);
    const knurl = this.mesh(new THREE.SphereGeometry(0.032, 12, 10), this.mats.joint);
    knee.add(knurl);
    const ram = this.mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 8), this.mats.actuator);
    ram.position.set(0, 0.02, 0.03);
    ram.rotation.x = 0.6;
    knee.add(ram);
    const cap = this.panel(0.062, 0.048, 0.028, this.mats.white, 0.01);
    cap.position.set(0, 0.002, 0.032);
    knee.add(cap);

    const shin = new THREE.Group();
    shin.position.y = -0.02;
    knee.add(shin);

    const sShell = this.mesh(new THREE.CapsuleGeometry(0.04, 0.24, 6, 14), this.mats.white);
    sShell.position.y = -0.18;
    shin.add(sShell);
    const sInner = this.mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.2, 8), this.mats.metal);
    sInner.position.set(side * -0.016, -0.18, -0.008);
    shin.add(sInner);

    const ankle = new THREE.Group();
    ankle.position.y = -0.38;
    shin.add(ankle);
    hip.userData.ankle = ankle;

    const joint = this.mesh(new THREE.SphereGeometry(0.026, 10, 8), this.mats.joint);
    ankle.add(joint);
    const axle = this.mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.05, 8), this.mats.actuator);
    axle.rotation.z = Math.PI / 2;
    ankle.add(axle);

    const foot = this.panel(0.078, 0.042, 0.21, this.mats.matte, 0.014);
    foot.position.set(0, -0.038, 0.042);
    ankle.add(foot);
    const toe = this.panel(0.074, 0.028, 0.055, this.mats.matte, 0.01);
    toe.position.set(0, -0.04, 0.128);
    ankle.add(toe);
    const heel = this.panel(0.07, 0.02, 0.04, this.mats.joint, 0.006);
    heel.position.set(0, -0.052, -0.03);
    ankle.add(heel);

    return hip;
  }

  private seam(w: number, h: number, d: number, x: number, y: number, z: number): void {
    const line = this.mesh(new THREE.BoxGeometry(w, h, d), this.mats.matte);
    line.position.set(x, y, z);
    this.chest.add(line);
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
