import * as THREE from "three";
import { Factory } from "../world/Factory.ts";
import { Player } from "./Player.ts";

const PICK_RANGE = 1.85;
const DROP_RANGE = 2.2;

export type MissionPhase = "seek" | "carry" | "done";

export class Mission {
  phase: MissionPhase = "seek";

  constructor(
    private readonly factory: Factory,
    private readonly player: Player,
  ) {}

  prompt(): string | null {
    if (this.phase === "seek" && this.near(this.factory.crate)) {
      return "E / click  Pick up crate";
    }
    if (this.phase === "carry" && this.near(this.factory.dropZone)) {
      return "E / click  Place crate on bay mark";
    }
    return null;
  }

  status(): string {
    if (this.phase === "seek") return "Orange crate is on a workbench.";
    if (this.phase === "carry") return "Carrying the crate. Walk onto the glowing yellow floor pad.";
    return "Crate is on the yellow pad. Workshop is yours.";
  }

  missionText(): string {
    if (this.phase === "done") return "Pad is loaded. Walk around if you want.";
    return "Pick up the orange crate and set it on the glowing yellow floor pad.";
  }

  tryUse(): boolean {
    if (this.phase === "seek" && this.near(this.factory.crate)) {
      this.pickUp();
      return true;
    }
    if (this.phase === "carry" && this.near(this.factory.dropZone)) {
      this.place();
      return true;
    }
    return false;
  }

  private pickUp(): void {
    const crate = this.factory.crate;
    crate.removeFromParent();
    crate.position.set(0, 0, 0);
    crate.rotation.set(0, 0, 0);
    crate.scale.setScalar(0.92);
    this.player.robot.carryAnchor.add(crate);
    this.player.carrying = true;
    this.factory.crateMarker.visible = false;
    this.phase = "carry";
  }

  private place(): void {
    const crate = this.factory.crate;
    crate.removeFromParent();
    crate.scale.setScalar(1);
    crate.rotation.set(0, 0.15, 0);
    crate.position.copy(this.factory.dropPos);
    crate.position.y = 0.14;
    this.factory.group.add(crate);
    this.player.carrying = false;
    this.phase = "done";
  }

  private near(obj: THREE.Object3D): boolean {
    const range = obj === this.factory.dropZone ? DROP_RANGE : PICK_RANGE;
    const pos = new THREE.Vector3();
    obj.getWorldPosition(pos);
    const dx = pos.x - this.player.position.x;
    const dz = pos.z - this.player.position.z;
    return Math.hypot(dx, dz) < range;
  }
}
