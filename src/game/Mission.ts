import { Factory } from "../world/Factory.ts";
import { Player } from "./Player.ts";

const PICK_RANGE = 2.5;
const DROP_RANGE = 4.0;

export type MissionPhase = "seek" | "carry" | "done";

export class Mission {
  phase: MissionPhase = "seek";

  constructor(
    private readonly factory: Factory,
    private readonly player: Player,
  ) {}

  prompt(): string | null {
    if (this.phase === "seek") {
      const d = this.distanceTo(this.factory.crateHome.x, this.factory.crateHome.z);
      if (d < PICK_RANGE) return "E / click  Pick up crate";
      return null;
    }
    if (this.phase === "carry") {
      const d = this.distanceTo(this.factory.dropPos.x, this.factory.dropPos.z);
      if (d < DROP_RANGE) return "E / click  Place crate on the yellow pad";
      return `Yellow pad ${d.toFixed(0)}m away`;
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
    if (this.phase === "seek" && this.inRange(this.factory.crateHome.x, this.factory.crateHome.z, PICK_RANGE)) {
      this.pickUp();
      return true;
    }
    if (this.phase === "carry" && this.inRange(this.factory.dropPos.x, this.factory.dropPos.z, DROP_RANGE)) {
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
    crate.position.y = 0.16;
    this.factory.group.add(crate);
    this.player.carrying = false;
    this.phase = "done";
  }

  private distanceTo(x: number, z: number): number {
    return Math.hypot(x - this.player.position.x, z - this.player.position.z);
  }

  private inRange(x: number, z: number, range: number): boolean {
    return this.distanceTo(x, z) < range;
  }
}
