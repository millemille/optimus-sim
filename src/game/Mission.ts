import * as THREE from "three";
import { Factory } from "../world/Factory.ts";
import { Player } from "./Player.ts";

const PICK_RANGE = 1.35;
const DROP_RANGE = 1.45;

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
    if (this.phase === "seek") return "Crate is on the left workbench.";
    if (this.phase === "carry") return "Carrying the crate. Yellow bay is across the floor.";
    return "Crate is on the bay mark. Workshop is yours.";
  }

  missionText(): string {
    if (this.phase === "done") return "Bay marked. Walk around if you want.";
    return "Pick up the parts crate and set it on the yellow bay mark.";
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
