import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { type Box } from "./collision.ts";
import { concreteTexture, plasterTexture } from "./textures.ts";

export class Factory {
  readonly group = new THREE.Group();
  readonly obstacles: Box[] = [];
  readonly crate: THREE.Group;
  readonly crateMarker: THREE.Group;
  readonly dropZone: THREE.Group;
  readonly crateHome = new THREE.Vector3(-1.45, 1.06, 1.25);
  readonly dropPos = new THREE.Vector3(2.35, 0.12, 4.15);

  constructor() {
    this.group.name = "factory";
    this.addRoom();
    this.addLights();
    this.addBenches();
    this.addShelves();
    this.addProps();
    this.crate = this.makeCrate();
    this.crate.position.copy(this.crateHome);
    this.group.add(this.crate);
    this.crateMarker = this.makeCrateMarker();
    this.group.add(this.crateMarker);
    this.dropZone = this.makeDropZone();
    this.dropZone.position.copy(this.dropPos);
    this.group.add(this.dropZone);
  }

  private addRoom(): void {
    const floorMap = new THREE.CanvasTexture(concreteTexture());
    floorMap.wrapS = THREE.RepeatWrapping;
    floorMap.wrapT = THREE.RepeatWrapping;
    floorMap.repeat.set(6, 5);
    floorMap.colorSpace = THREE.SRGBColorSpace;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 14),
      new THREE.MeshStandardMaterial({
        map: floorMap,
        roughness: 0.92,
        metalness: 0.04,
        color: 0xc4c0b6,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    const wallMap = new THREE.CanvasTexture(plasterTexture());
    wallMap.wrapS = THREE.RepeatWrapping;
    wallMap.wrapT = THREE.RepeatWrapping;
    wallMap.repeat.set(3, 1);
    wallMap.colorSpace = THREE.SRGBColorSpace;
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallMap,
      color: 0x6a6862,
      roughness: 0.88,
    });

    const walls: Array<[number, number, number, number, number]> = [
      [18, 4.2, 0.3, 0, -7],
      [18, 4.2, 0.3, 0, 7],
      [0.3, 4.2, 14, -9, 0],
      [0.3, 4.2, 14, 9, 0],
    ];
    for (const [w, h, d, x, z] of walls) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      mesh.position.set(x, h / 2, z);
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 14),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.95 }),
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 4.15;
    this.group.add(ceiling);

    for (const z of [-3.4, 0, 3.4]) {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(17.4, 0.16, 0.22),
        new THREE.MeshStandardMaterial({ color: 0x2c2c2e, roughness: 0.6, metalness: 0.4 }),
      );
      beam.position.set(0, 4.0, z);
      this.group.add(beam);
    }

    this.addBayLight(-4.2, 3.4);
    this.addBayLight(0, 3.4);
    this.addBayLight(4.2, 3.4);
    this.addBayLight(-4.2, -3.2);
    this.addBayLight(4.2, -3.2);
  }

  private addBayLight(x: number, z: number): void {
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.08, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.5, metalness: 0.4 }),
    );
    housing.position.set(x, 3.92, z);
    this.group.add(housing);

    const lamp = new THREE.Mesh(
      new THREE.PlaneGeometry(1.46, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0xfff4d8,
        emissive: 0xffe7b0,
        emissiveIntensity: 1.4,
      }),
    );
    lamp.rotation.x = Math.PI / 2;
    lamp.position.set(x, 3.87, z);
    this.group.add(lamp);

    const light = new THREE.PointLight(0xfff1d0, 28, 13, 2);
    light.position.set(x, 3.6, z);
    this.group.add(light);
  }

  private addLights(): void {
    const hemi = new THREE.HemisphereLight(0xd8dee8, 0x3a362e, 0.72);
    this.group.add(hemi);
    const fill = new THREE.AmbientLight(0x8890a0, 0.28);
    this.group.add(fill);

    const sun = new THREE.DirectionalLight(0xfff6e6, 1.35);
    sun.position.set(-4, 8, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 22;
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -8;
    this.group.add(sun);
  }

  private addBenches(): void {
    this.workbench(-2.2, 1.4, 1.8, 0.72);
    this.workbench(4.4, 2.4, 1.5, 0.72);
    this.obstacle(-2.2, 1.4, 1.9, 0.8);
    this.obstacle(4.4, 2.4, 1.6, 0.8);
  }

  private workbench(x: number, z: number, width: number, depth: number): void {
    const top = new THREE.Mesh(
      new RoundedBoxGeometry(width, 0.07, depth, 1, 0.01),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 0.7, metalness: 0.08 }),
    );
    top.position.set(x, 0.88, z);
    top.castShadow = true;
    top.receiveShadow = true;
    this.group.add(top);

    const apron = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.08, 0.1, depth - 0.08),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.6, metalness: 0.3 }),
    );
    apron.position.set(x, 0.8, z);
    this.group.add(apron);

    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, 0.8, 0.07),
          new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.5, metalness: 0.45 }),
        );
        leg.position.set(x + sx * (width / 2 - 0.08), 0.4, z + sz * (depth / 2 - 0.08));
        leg.castShadow = true;
        this.group.add(leg);
      }
    }
  }

  private addShelves(): void {
    const x = -7.6;
    const z = -2.2;
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 2.2, 2.8),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3e, roughness: 0.55, metalness: 0.4 }),
    );
    frame.position.set(x, 1.1, z);
    frame.castShadow = true;
    this.group.add(frame);

    for (let i = 0; i < 4; i += 1) {
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(0.86, 0.04, 2.7),
        new THREE.MeshStandardMaterial({ color: 0x6a5a48, roughness: 0.8 }),
      );
      board.position.set(x, 0.28 + i * 0.55, z);
      this.group.add(board);
    }

    const colors = [0x5a6a74, 0x8a5a3a, 0x4a4a50, 0x6a6e58];
    for (let i = 0; i < 6; i += 1) {
      const box = new THREE.Mesh(
        new RoundedBoxGeometry(0.28, 0.2, 0.32, 1, 0.01),
        new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.7 }),
      );
      box.position.set(x + 0.12, 0.42 + (i % 3) * 0.55, z - 0.9 + (i % 4) * 0.55);
      box.castShadow = true;
      this.group.add(box);
    }
    this.obstacle(x, z, 1.0, 2.9);
  }

  private addProps(): void {
    const tote = this.makeTote(0x3d5a4c);
    tote.position.set(4.1, 0.96, 2.35);
    this.group.add(tote);

    const crateB = this.makeWoodCrate();
    crateB.position.set(-6.4, 0.2, 4.4);
    this.group.add(crateB);
    this.obstacle(-6.4, 4.4, 0.7, 0.7);

    const pallet = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.1, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x7a623e, roughness: 0.85 }),
    );
    pallet.position.set(6.4, 0.05, -1.2);
    pallet.receiveShadow = true;
    this.group.add(pallet);

    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.72, 16),
      new THREE.MeshStandardMaterial({ color: 0x4a5560, roughness: 0.45, metalness: 0.4 }),
    );
    drum.position.set(6.4, 0.46, -1.15);
    drum.castShadow = true;
    this.group.add(drum);
    this.obstacle(6.4, -1.2, 0.9, 0.9);

    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 2.2, 0.32),
      new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.55, metalness: 0.25 }),
    );
    post.position.set(-3.6, 1.1, 6.55);
    this.group.add(post);
  }

  private makeCrateMarker(): THREE.Group {
    const g = new THREE.Group();
    g.name = "crate-marker";
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.38, 24),
      new THREE.MeshStandardMaterial({
        color: 0xf0a040,
        emissive: 0xaa5010,
        emissiveIntensity: 0.55,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(this.crateHome.x, 0.92, this.crateHome.z);
    g.add(ring);
    const postMat = new THREE.MeshStandardMaterial({
      color: 0xe07028,
      emissive: 0x8a3010,
      emissiveIntensity: 0.5,
    });
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.06), postMat);
    post.position.set(this.crateHome.x + 0.42, 0.28, this.crateHome.z);
    g.add(post);
    return g;
  }

  private makeCrate(): THREE.Group {
    const g = new THREE.Group();
    g.name = "parts-crate";
    const body = new THREE.Mesh(
      new RoundedBoxGeometry(0.48, 0.28, 0.38, 1, 0.014),
      new THREE.MeshStandardMaterial({
        color: 0xe07028,
        roughness: 0.42,
        emissive: 0x8a3010,
        emissiveIntensity: 0.55,
      }),
    );
    body.castShadow = true;
    g.add(body);
    const lip = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.03, 0.32),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2e, roughness: 0.6 }),
    );
    lip.position.y = 0.11;
    g.add(lip);
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.008, 8, 14, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x222226, metalness: 0.5, roughness: 0.4 }),
    );
    handle.rotation.x = Math.PI;
    handle.position.set(0, 0.12, 0);
    g.add(handle);
    return g;
  }

  private makeTote(color: number): THREE.Group {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new RoundedBoxGeometry(0.4, 0.16, 0.28, 1, 0.01),
      new THREE.MeshStandardMaterial({ color, roughness: 0.55 }),
    );
    body.castShadow = true;
    g.add(body);
    return g;
  }

  private makeWoodCrate(): THREE.Group {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new RoundedBoxGeometry(0.5, 0.4, 0.5, 1, 0.01),
      new THREE.MeshStandardMaterial({ color: 0x8a7048, roughness: 0.8 }),
    );
    body.castShadow = true;
    body.position.y = 0;
    g.add(body);
    return g;
  }

  private makeDropZone(): THREE.Group {
    const g = new THREE.Group();
    g.name = "drop-zone";
    const pad = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 1.7),
      new THREE.MeshStandardMaterial({
        color: 0xf0c94a,
        emissive: 0xc9a020,
        emissiveIntensity: 0.7,
        roughness: 0.55,
      }),
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.012;
    g.add(pad);

    const inner = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 1.15),
      new THREE.MeshStandardMaterial({
        color: 0x2e2c22,
        roughness: 0.88,
        emissive: 0x3a3008,
        emissiveIntensity: 0.15,
      }),
    );
    inner.rotation.x = -Math.PI / 2;
    inner.position.y = 0.014;
    g.add(inner);

    const postMat = new THREE.MeshStandardMaterial({
      color: 0xf2d056,
      emissive: 0xaa8808,
      emissiveIntensity: 0.55,
      roughness: 0.4,
    });
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const stake = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.62, 0.07), postMat);
      stake.position.set(sx * 0.78, 0.31, sz * 0.78);
      stake.castShadow = true;
      g.add(stake);
    }

    const lamp = new THREE.PointLight(0xffe08a, 16, 7, 2);
    lamp.position.set(0, 1.6, 0);
    g.add(lamp);
    return g;
  }

  private obstacle(x: number, z: number, w: number, d: number): void {
    this.obstacles.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
    });
  }
}
