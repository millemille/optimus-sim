import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Factory } from "../world/Factory.ts";
import { Hud } from "../ui/hud.ts";
import { applyStudioLights, poseStudioCamera, studioViewFromUrl } from "./Studio.ts";
import { CameraRig } from "./CameraRig.ts";
import { Input } from "./Input.ts";
import { Mission } from "./Mission.ts";
import { Player } from "./Player.ts";

export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly input: Input;
  private readonly cameraRig: CameraRig;
  private readonly player = new Player();
  private readonly factory = new Factory();
  private readonly mission: Mission;
  private readonly hud: Hud;
  private readonly clock = new THREE.Clock();
  private playing = false;
  private started = false;
  private raf = 0;
  private readonly studio = studioViewFromUrl();

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.08, 80);
    this.cameraRig = new CameraRig(this.camera);
    this.input = new Input(canvas);
    this.mission = new Mission(this.factory, this.player);
    this.hud = new Hud(() => this.requestLock());

    this.scene.background = new THREE.Color(0x2a2a2c);
    this.scene.fog = new THREE.Fog(0x2a2a2c, 16, 36);
    this.scene.add(this.factory.group);
    this.scene.add(this.player.robot.root);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    if (this.studio) {
      this.renderer.toneMappingExposure = 1.05;
      this.scene.fog = null;
      this.scene.background = new THREE.Color(0x6a6864);
      this.factory.group.visible = false;
      applyStudioLights(this.scene, this.player.position);
      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(5, 48),
        new THREE.MeshStandardMaterial({ color: 0x8c8a84, roughness: 0.92 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      this.scene.add(floor);
      poseStudioCamera(this.cameraRig, this.studio);
      this.hud.hideAll();
    } else {
      this.cameraRig.yaw = Math.PI;
    }
    this.cameraRig.update(this.player.position);
    this.hud.sync(this.mission);

    window.addEventListener("resize", this.onResize);
    document.addEventListener("pointerlockchange", this.onLock);
    document.addEventListener("pointerlockerror", this.onLockError);
  }

  start(): void {
    this.clock.start();
    const tick = (): void => {
      this.raf = requestAnimationFrame(tick);
      this.frame();
    };
    tick();
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("pointerlockchange", this.onLock);
    document.removeEventListener("pointerlockerror", this.onLockError);
    this.input.dispose();
    this.renderer.dispose();
  }

  private requestLock(): void {
    this.canvas.requestPointerLock();
  }

  private readonly onLock = (): void => {
    if (this.studio) return;
    this.playing = document.pointerLockElement === this.canvas;
    if (this.playing) {
      this.started = true;
      this.hud.showPlaying();
    } else {
      this.hud.showPaused(this.started);
    }
  };

  private readonly onLockError = (): void => {
    this.hud.showPaused(this.started);
  };

  private readonly onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private frame(): void {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.studio) {
      this.player.robot.update(dt, false, 0, false);
      this.cameraRig.update(this.player.position);
      this.renderer.render(this.scene, this.camera);
      return;
    }
    if (this.playing) {
      const look = this.input.consumeLook();
      this.cameraRig.applyLook(look.x, look.y);
      const heldYaw =
        (this.input.keys.has("ArrowLeft") ? 1 : 0) + (this.input.keys.has("ArrowRight") ? -1 : 0);
      const heldPitch =
        (this.input.keys.has("ArrowUp") ? 1 : 0) + (this.input.keys.has("ArrowDown") ? -1 : 0);
      this.cameraRig.applyHeldLook(dt, heldYaw, heldPitch);
      this.player.update(dt, this.input, this.cameraRig.yaw, this.factory.obstacles);
      if (this.input.consumeUse()) this.mission.tryUse();
    } else {
      this.input.consumeLook();
      this.input.consumeUse();
    }
    this.cameraRig.update(this.player.position);
    this.hud.sync(this.mission);
    this.renderer.render(this.scene, this.camera);
  }
}
