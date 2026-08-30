import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createRobotMaterials, type RobotMaterials } from "./materials.ts";

const HIP_Y = 0.94;

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
    this.chest.position.y = 0.15;
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

    this.carryAnchor.position.set(0, 1.08, 0.26);
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
    this.chest.rotation.x = THREE.MathUtils.lerp(this.chest.rotation.x, 0.02, w);
    this.lShoulder.rotation.set(
      THREE.MathUtils.lerp(this.lShoulder.rotation.x, 0.05, w),
      0,
      THREE.MathUtils.lerp(this.lShoulder.rotation.z, 0.04, w),
    );
    this.rShoulder.rotation.set(
      THREE.MathUtils.lerp(this.rShoulder.rotation.x, 0.05, w),
      0,
      THREE.MathUtils.lerp(this.rShoulder.rotation.z, -0.04, w),
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
    this.lElbow.rotation.x = 0.2 + Math.max(0, Math.sin(t + Math.PI)) * 0.16 * w;
    this.rElbow.rotation.x = 0.2 + Math.max(0, Math.sin(t)) * 0.16 * w;
    this.chest.rotation.x = 0.05 * w;
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
    const shell = this.lathe(
      [
        [0.04, -0.05],
        [0.1, -0.05],
        [0.13, -0.02],
        [0.14, 0.03],
        [0.12, 0.06],
        [0.07, 0.07],
      ],
      this.mats.white,
      0.72,
    );
    this.hips.add(shell);

    for (const side of [-1, 1]) {
      const motor = this.mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.08, 12), this.mats.actuator);
      motor.rotation.z = side * 0.7;
      motor.position.set(side * 0.09, 0.03, 0.015);
      this.hips.add(motor);
    }
  }

  private buildTorso(): void {
    const pecs = this.lathe(
      [
        [0.05, 0.0],
        [0.1, 0.02],
        [0.16, 0.08],
        [0.2, 0.16],
        [0.195, 0.22],
        [0.16, 0.27],
        [0.1, 0.3],
        [0.055, 0.315],
      ],
      this.mats.white,
      0.58,
    );
    pecs.position.y = 0.02;
    this.chest.add(pecs);

    for (let i = 0; i < 4; i += 1) {
      const ring = this.mesh(new THREE.TorusGeometry(0.07 - i * 0.004, 0.01, 8, 20), this.mats.matte);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.015 + i * 0.022;
      this.chest.add(ring);
    }

    const waist = this.mesh(new THREE.CylinderGeometry(0.06, 0.078, 0.1, 16), this.mats.matte);
    waist.position.y = 0.04;
    this.chest.add(waist);
  }

  private buildNeck(): void {
    const column = this.mesh(new THREE.CylinderGeometry(0.042, 0.055, 0.12, 18), this.mats.matte);
    column.position.set(0, 0.39, 0.01);
    this.chest.add(column);
  }

  private buildHead(): void {
    const head = new THREE.Group();
    head.position.set(0, 0.56, 0.015);
    this.chest.add(head);

    const skull = this.lathe(
      [
        [0.004, -0.092],
        [0.042, -0.09],
        [0.075, -0.068],
        [0.094, -0.028],
        [0.1, 0.012],
        [0.096, 0.048],
        [0.082, 0.082],
        [0.055, 0.108],
        [0.022, 0.12],
        [0.0, 0.122],
      ],
      this.mats.skull,
      0.9,
    );
    head.add(skull);
  }

  private arm(side: number): THREE.Group {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.21, 0.28, 0);
    this.chest.add(shoulder);

    const pauldron = this.mesh(
      new THREE.SphereGeometry(0.078, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
      this.mats.white,
    );
    pauldron.scale.set(1.15, 0.62, 1.05);
    pauldron.rotation.z = side * 0.35;
    pauldron.position.set(side * 0.03, 0.012, 0);
    shoulder.add(pauldron);

    const socket = this.mesh(new THREE.SphereGeometry(0.036, 12, 10), this.mats.joint);
    socket.position.set(side * 0.035, -0.028, 0);
    shoulder.add(socket);

    const upper = new THREE.Group();
    upper.position.set(side * 0.035, -0.04, 0);
    shoulder.add(upper);

    const housing = this.shell(0.2, 0.05, 0.032);
    housing.position.y = -0.11;
    upper.add(housing);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.225, 0);
    upper.add(elbow);
    shoulder.userData.elbow = elbow;

    const pivot = this.mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.07, 16), this.mats.joint);
    pivot.rotation.z = Math.PI / 2;
    elbow.add(pivot);
    this.bellows(elbow, 0.032, 5, 0.009);

    const forearm = new THREE.Group();
    forearm.position.y = -0.025;
    elbow.add(forearm);

    const fHousing = this.shell(0.175, 0.044, 0.028);
    fHousing.position.y = -0.1;
    forearm.add(fHousing);

    const wrist = this.mesh(new THREE.SphereGeometry(0.022, 10, 8), this.mats.joint);
    wrist.position.y = -0.2;
    forearm.add(wrist);

    const hand = this.hand(side);
    hand.position.set(0, -0.215, 0);
    forearm.add(hand);

    return shoulder;
  }

  private hand(side: number): THREE.Group {
    const g = new THREE.Group();
    const palm = this.panel(0.07, 0.078, 0.028, this.mats.matte, 0.008);
    palm.position.y = -0.03;
    g.add(palm);

    const plate = this.panel(0.062, 0.048, 0.01, this.mats.white, 0.006);
    plate.position.set(0, -0.016, 0.014);
    g.add(plate);

    const xs = [-0.026, -0.009, 0.008, 0.025];
    const lengths = [0.068, 0.076, 0.072, 0.06];
    xs.forEach((x, i) => {
      g.add(this.finger(x, lengths[i], 0.013));
    });

    const thumb = this.finger(side * 0.028, 0.05, 0.013);
    thumb.rotation.z = side * -0.7;
    thumb.position.set(side * 0.022, -0.008, 0.006);
    g.add(thumb);
    return g;
  }

  private finger(x: number, length: number, width: number): THREE.Group {
    const g = new THREE.Group();
    g.position.set(x, -0.068, 0);

    const p1 = this.panel(width, length * 0.36, 0.012, this.mats.white, 0.003);
    p1.position.set(0, -length * 0.15, 0.003);
    g.add(p1);
    const k1 = this.mesh(new THREE.SphereGeometry(width * 0.38, 8, 6), this.mats.joint);
    k1.position.y = -length * 0.35;
    g.add(k1);
    const p2 = this.panel(width * 0.9, length * 0.3, 0.011, this.mats.white, 0.003);
    p2.position.set(0, -length * 0.52, 0.002);
    g.add(p2);
    const k2 = this.mesh(new THREE.SphereGeometry(width * 0.32, 8, 6), this.mats.joint);
    k2.position.y = -length * 0.68;
    g.add(k2);
    const tip = this.panel(width * 0.8, length * 0.2, 0.01, this.mats.matte, 0.003);
    tip.position.y = -length * 0.82;
    g.add(tip);
    return g;
  }

  private leg(side: number): THREE.Group {
    const hip = new THREE.Group();
    hip.position.set(side * 0.09, -0.03, 0);
    this.hips.add(hip);

    const ball = this.mesh(new THREE.SphereGeometry(0.044, 14, 12), this.mats.joint);
    hip.add(ball);
    const motor = this.mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.08, 10), this.mats.actuator);
    motor.rotation.z = side * 0.5;
    motor.position.set(side * 0.04, 0.025, 0.012);
    hip.add(motor);

    const thigh = new THREE.Group();
    thigh.position.y = -0.025;
    hip.add(thigh);

    const tHousing = this.shell(0.33, 0.062, 0.038);
    tHousing.position.y = -0.175;
    thigh.add(tHousing);

    const knee = new THREE.Group();
    knee.position.y = -0.36;
    thigh.add(knee);
    hip.userData.knee = knee;

    const disk = this.mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.078, 18), this.mats.joint);
    disk.rotation.z = Math.PI / 2;
    knee.add(disk);

    const shin = new THREE.Group();
    shin.position.y = -0.025;
    knee.add(shin);

    const sHousing = this.shell(0.3, 0.05, 0.032);
    sHousing.position.y = -0.16;
    shin.add(sHousing);

    const ankle = new THREE.Group();
    ankle.position.y = -0.33;
    shin.add(ankle);
    hip.userData.ankle = ankle;

    const joint = this.mesh(new THREE.SphereGeometry(0.026, 10, 8), this.mats.joint);
    ankle.add(joint);
    for (const x of [-0.016, 0.016]) {
      const cable = this.mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.075, 8), this.mats.metal);
      cable.position.set(x, 0.018, -0.026);
      cable.rotation.x = 0.28;
      ankle.add(cable);
    }

    const boot = this.panel(0.09, 0.078, 0.23, this.mats.matte, 0.03);
    boot.position.set(0, -0.048, 0.05);
    ankle.add(boot);
    const toe = this.mesh(new THREE.SphereGeometry(0.04, 14, 10), this.mats.matte);
    toe.scale.set(1.1, 0.8, 1.15);
    toe.position.set(0, -0.046, 0.15);
    ankle.add(toe);

    return hip;
  }

  private shell(length: number, rx: number, rz: number): THREE.Mesh {
    const shape = new THREE.Shape();
    const steps = 24;
    for (let i = 0; i <= steps; i += 1) {
      const a = (i / steps) * Math.PI * 2;
      const x = rx * Math.cos(a);
      let y = rz * Math.sin(a);
      if (y < 0) y *= 0.55;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: length,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.004,
      bevelSegments: 2,
      curveSegments: 12,
    });
    geo.translate(0, 0, -length / 2);
    geo.rotateX(-Math.PI / 2);
    return this.mesh(geo, this.mats.white);
  }

  private lathe(profile: Array<[number, number]>, mat: THREE.Material, zScale: number): THREE.Mesh {
    const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
    const mesh = this.mesh(new THREE.LatheGeometry(pts, 40), mat);
    mesh.scale.z = zScale;
    return mesh;
  }

  private bellows(parent: THREE.Group, radius: number, count: number, spacing: number): void {
    for (let i = 0; i < count; i += 1) {
      const ring = this.mesh(new THREE.TorusGeometry(radius, 0.0045, 6, 14), this.mats.matte);
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
