import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createRobotMaterials, type RobotMaterials } from "./materials.ts";

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
  private readonly eyes: THREE.Mesh[];
  private phase = 0;
  private bob = 0;

  constructor() {
    this.mats = createRobotMaterials();
    this.root.name = "optimus";

    this.hips = new THREE.Group();
    this.hips.position.y = 0.9;
    this.root.add(this.hips);

    this.buildPelvis();

    this.chest = new THREE.Group();
    this.chest.position.y = 0.16;
    this.hips.add(this.chest);
    this.buildTorso();

    const neck = this.mesh(new THREE.CylinderGeometry(0.038, 0.05, 0.09, 12), this.mats.matte);
    neck.position.set(0, 0.42, 0);
    this.chest.add(neck);
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

    this.carryAnchor.position.set(0, 1.08, 0.3);
    this.root.add(this.carryAnchor);

    this.eyes = [];
    this.root.traverse((obj) => {
      if (obj.name === "eye") this.eyes.push(obj as THREE.Mesh);
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
    this.hips.position.y = 0.9 + Math.abs(Math.sin(this.phase)) * 0.03 * this.bob;

    const pulse = 0.7 + Math.sin(performance.now() * 0.003) * 0.15;
    for (const eye of this.eyes) {
      const mat = eye.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = pulse;
    }
  }

  private poseIdle(w: number): void {
    if (w <= 0.001) return;
    this.chest.rotation.x = THREE.MathUtils.lerp(this.chest.rotation.x, 0.04, w);
    this.lShoulder.rotation.set(
      THREE.MathUtils.lerp(this.lShoulder.rotation.x, 0.08, w),
      0,
      THREE.MathUtils.lerp(this.lShoulder.rotation.z, 0.08, w),
    );
    this.rShoulder.rotation.set(
      THREE.MathUtils.lerp(this.rShoulder.rotation.x, 0.08, w),
      0,
      THREE.MathUtils.lerp(this.rShoulder.rotation.z, -0.08, w),
    );
    this.lElbow.rotation.x = THREE.MathUtils.lerp(this.lElbow.rotation.x, 0.22, w);
    this.rElbow.rotation.x = THREE.MathUtils.lerp(this.rElbow.rotation.x, 0.22, w);
    this.lHip.rotation.set(THREE.MathUtils.lerp(this.lHip.rotation.x, 0.04, w), 0, 0.03);
    this.rHip.rotation.set(THREE.MathUtils.lerp(this.rHip.rotation.x, 0.04, w), 0, -0.03);
    this.lKnee.rotation.x = THREE.MathUtils.lerp(this.lKnee.rotation.x, 0.08, w);
    this.rKnee.rotation.x = THREE.MathUtils.lerp(this.rKnee.rotation.x, 0.08, w);
    this.lAnkle.rotation.x = THREE.MathUtils.lerp(this.lAnkle.rotation.x, -0.06, w);
    this.rAnkle.rotation.x = THREE.MathUtils.lerp(this.rAnkle.rotation.x, -0.06, w);
    this.hips.rotation.y = THREE.MathUtils.lerp(this.hips.rotation.y, 0, w);
  }

  private poseWalk(w: number): void {
    if (w <= 0.001) return;
    const t = this.phase;
    const stride = 0.52 * w;
    this.lHip.rotation.x = Math.sin(t) * stride;
    this.rHip.rotation.x = Math.sin(t + Math.PI) * stride;
    this.lKnee.rotation.x = 0.1 + Math.max(0, Math.sin(t + 0.45)) * 0.78 * w;
    this.rKnee.rotation.x = 0.1 + Math.max(0, Math.sin(t + Math.PI + 0.45)) * 0.78 * w;
    this.lAnkle.rotation.x = -0.08 - Math.sin(t) * 0.16 * w;
    this.rAnkle.rotation.x = -0.08 - Math.sin(t + Math.PI) * 0.16 * w;
    this.lShoulder.rotation.x = Math.sin(t + Math.PI) * 0.38 * w;
    this.rShoulder.rotation.x = Math.sin(t) * 0.38 * w;
    this.lShoulder.rotation.z = 0.06;
    this.rShoulder.rotation.z = -0.06;
    this.lElbow.rotation.x = 0.28 + Math.max(0, Math.sin(t + Math.PI)) * 0.22 * w;
    this.rElbow.rotation.x = 0.28 + Math.max(0, Math.sin(t)) * 0.22 * w;
    this.chest.rotation.x = 0.08 * w;
    this.hips.rotation.y = Math.sin(t) * 0.06 * w;
  }

  private poseCarry(w: number): void {
    this.lShoulder.rotation.x = THREE.MathUtils.lerp(this.lShoulder.rotation.x, 0.55, w);
    this.rShoulder.rotation.x = THREE.MathUtils.lerp(this.rShoulder.rotation.x, 0.55, w);
    this.lShoulder.rotation.z = THREE.MathUtils.lerp(this.lShoulder.rotation.z, 0.18, w);
    this.rShoulder.rotation.z = THREE.MathUtils.lerp(this.rShoulder.rotation.z, -0.18, w);
    this.lElbow.rotation.x = THREE.MathUtils.lerp(this.lElbow.rotation.x, 1.05, w);
    this.rElbow.rotation.x = THREE.MathUtils.lerp(this.rElbow.rotation.x, 1.05, w);
  }

  private buildPelvis(): void {
    const yoke = this.panel(0.26, 0.1, 0.16, this.mats.matte, 0.02);
    yoke.position.y = 0.02;
    this.hips.add(yoke);
    const belt = this.mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.08, 14), this.mats.joint);
    belt.position.y = 0.1;
    this.hips.add(belt);
  }

  private buildTorso(): void {
    const chest = this.panel(0.36, 0.34, 0.18, this.mats.white, 0.028);
    chest.position.set(0, 0.22, 0.01);
    this.chest.add(chest);

    const pec = this.panel(0.33, 0.12, 0.04, this.mats.white, 0.016);
    pec.position.set(0, 0.3, 0.09);
    this.chest.add(pec);

    const back = this.panel(0.34, 0.3, 0.05, this.mats.white, 0.02);
    back.position.set(0, 0.2, -0.08);
    this.chest.add(back);

    const waist = this.mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.12, 12), this.mats.matte);
    waist.position.y = 0.02;
    this.chest.add(waist);

    const collar = this.panel(0.3, 0.05, 0.16, this.mats.white, 0.016);
    collar.position.set(0, 0.38, 0);
    this.chest.add(collar);
  }

  private buildHead(): void {
    const head = new THREE.Group();
    head.position.set(0, 0.52, 0.02);
    this.chest.add(head);

    const visor = this.panel(0.2, 0.22, 0.24, this.mats.visor, 0.08);
    visor.scale.set(1, 1.02, 1);
    head.add(visor);

    const dome = this.mesh(new THREE.SphereGeometry(0.1, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), this.mats.visor);
    dome.scale.set(0.98, 0.9, 1.12);
    dome.position.set(0, 0.02, 0.01);
    head.add(dome);

    const left = this.mesh(new THREE.CapsuleGeometry(0.012, 0.018, 6, 8), this.mats.eye);
    left.name = "eye";
    left.rotation.z = Math.PI / 2;
    left.position.set(-0.028, 0.012, 0.1);
    head.add(left);

    const right = left.clone();
    right.position.x = 0.028;
    head.add(right);

    const slit = this.mesh(new THREE.BoxGeometry(0.07, 0.004, 0.002), this.mats.eye);
    slit.name = "eye";
    slit.position.set(0, -0.018, 0.104);
    head.add(slit);
  }

  private arm(side: number): THREE.Group {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.2, 0.34, 0);
    this.chest.add(shoulder);

    const cap = this.panel(0.1, 0.08, 0.1, this.mats.white, 0.02);
    cap.position.set(side * 0.02, 0.02, 0);
    shoulder.add(cap);

    const socket = this.mesh(new THREE.SphereGeometry(0.038, 12, 10), this.mats.joint);
    socket.position.set(side * 0.03, -0.02, 0);
    shoulder.add(socket);

    const upper = new THREE.Group();
    upper.position.set(side * 0.03, -0.04, 0);
    shoulder.add(upper);

    const core = this.mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.22, 10), this.mats.metal);
    core.position.y = -0.12;
    upper.add(core);

    const shell = this.panel(0.078, 0.2, 0.055, this.mats.white, 0.014);
    shell.position.set(side * 0.012, -0.12, 0.01);
    upper.add(shell);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.24, 0);
    upper.add(elbow);
    shoulder.userData.elbow = elbow;

    const hinge = this.mesh(new THREE.SphereGeometry(0.032, 12, 10), this.mats.joint);
    elbow.add(hinge);

    const pad = this.mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.018, 12), this.mats.matte);
    pad.rotation.z = Math.PI / 2;
    pad.position.set(side * 0.03, 0, 0);
    elbow.add(pad);
    for (let i = 0; i < 4; i += 1) {
      const rib = this.mesh(new THREE.BoxGeometry(0.006, 0.036, 0.008), this.mats.joint);
      rib.position.set(side * 0.038, (i - 1.5) * 0.01, 0);
      elbow.add(rib);
    }

    const forearm = new THREE.Group();
    forearm.position.y = -0.02;
    elbow.add(forearm);

    const fCore = this.mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.2, 10), this.mats.metal);
    fCore.position.y = -0.12;
    forearm.add(fCore);

    const fShell = this.panel(0.07, 0.18, 0.05, this.mats.white, 0.012);
    fShell.position.set(side * 0.01, -0.12, 0.008);
    forearm.add(fShell);

    const hand = this.hand(side);
    hand.position.set(0, -0.24, 0);
    forearm.add(hand);

    return shoulder;
  }

  private hand(side: number): THREE.Group {
    const g = new THREE.Group();
    const palm = this.panel(0.068, 0.078, 0.028, this.mats.matte, 0.008);
    palm.position.y = -0.03;
    g.add(palm);

    const plate = this.panel(0.062, 0.05, 0.012, this.mats.white, 0.006);
    plate.position.set(0, -0.018, 0.012);
    g.add(plate);

    const spans = [-0.026, -0.01, 0.008, 0.024];
    for (const x of spans) {
      g.add(this.finger(x, 0.07, 0.012));
    }
    const thumb = this.finger(side * 0.034, 0.05, 0.012);
    thumb.rotation.z = side * -0.7;
    thumb.position.set(side * 0.02, -0.01, 0.006);
    g.add(thumb);
    return g;
  }

  private finger(x: number, length: number, width: number): THREE.Group {
    const g = new THREE.Group();
    g.position.set(x, -0.068, 0);
    const bone = this.panel(width, length * 0.55, 0.014, this.mats.matte, 0.004);
    bone.position.y = -length * 0.22;
    g.add(bone);
    const tip = this.panel(width * 0.9, length * 0.4, 0.012, this.mats.matte, 0.003);
    tip.position.y = -length * 0.58;
    g.add(tip);
    const nail = this.panel(width * 0.8, length * 0.28, 0.006, this.mats.white, 0.002);
    nail.position.set(0, -length * 0.28, 0.008);
    g.add(nail);
    return g;
  }

  private leg(side: number): THREE.Group {
    const hip = new THREE.Group();
    hip.position.set(side * 0.09, -0.02, 0);
    this.hips.add(hip);

    const ball = this.mesh(new THREE.SphereGeometry(0.045, 12, 10), this.mats.joint);
    hip.add(ball);
    const actuator = this.mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.08, 8), this.mats.metal);
    actuator.rotation.z = side * 0.6;
    actuator.position.set(side * 0.04, 0.02, 0);
    hip.add(actuator);

    const thigh = new THREE.Group();
    thigh.position.y = -0.02;
    hip.add(thigh);

    const tCore = this.mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.34, 10), this.mats.metal);
    tCore.position.y = -0.18;
    thigh.add(tCore);

    const tShell = this.panel(0.1, 0.32, 0.07, this.mats.white, 0.016);
    tShell.position.set(0, -0.18, 0.018);
    thigh.add(tShell);

    const knee = new THREE.Group();
    knee.position.y = -0.38;
    thigh.add(knee);
    hip.userData.knee = knee;

    const knurl = this.mesh(new THREE.SphereGeometry(0.04, 12, 10), this.mats.joint);
    knee.add(knurl);
    const cap = this.panel(0.07, 0.055, 0.03, this.mats.white, 0.01);
    cap.position.set(0, 0, 0.03);
    knee.add(cap);

    const shin = new THREE.Group();
    shin.position.y = -0.02;
    knee.add(shin);

    const sCore = this.mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.34, 10), this.mats.metal);
    sCore.position.y = -0.18;
    shin.add(sCore);

    const sShell = this.panel(0.088, 0.32, 0.06, this.mats.white, 0.014);
    sShell.position.set(0, -0.18, 0.016);
    shin.add(sShell);

    const ankle = new THREE.Group();
    ankle.position.y = -0.38;
    shin.add(ankle);
    hip.userData.ankle = ankle;

    const joint = this.mesh(new THREE.SphereGeometry(0.03, 10, 8), this.mats.joint);
    ankle.add(joint);

    const foot = this.panel(0.08, 0.045, 0.2, this.mats.matte, 0.012);
    foot.position.set(0, -0.04, 0.04);
    ankle.add(foot);
    const toe = this.panel(0.076, 0.03, 0.06, this.mats.matte, 0.01);
    toe.position.set(0, -0.042, 0.12);
    ankle.add(toe);

    return hip;
  }

  private panel(
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    radius = 0.012,
  ): THREE.Mesh {
    return this.mesh(new RoundedBoxGeometry(w, h, d, 2, radius), mat);
  }

  private mesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
    const m = new THREE.Mesh(geometry, material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
}
