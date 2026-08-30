import type { Mission } from "../game/Mission.ts";

export class Hud {
  private readonly overlay = el("overlay");
  private readonly hud = el("hud");
  private readonly enter = el("enter") as HTMLButtonElement;
  private readonly missionText = el("mission-text");
  private readonly missionStatus = el("mission-status");
  private readonly prompt = el("prompt");

  constructor(onEnter: () => void) {
    this.enter.addEventListener("click", onEnter);
  }

  showPaused(hasStarted: boolean): void {
    this.overlay.hidden = false;
    this.hud.hidden = true;
    this.enter.textContent = hasStarted ? "Click to resume" : "Click to enter workshop";
  }

  showPlaying(): void {
    this.overlay.hidden = true;
    this.hud.hidden = false;
  }

  sync(mission: Mission): void {
    this.missionText.textContent = mission.missionText();
    this.missionStatus.textContent = mission.status();
    this.missionStatus.classList.toggle("done", mission.phase === "done");
    const prompt = mission.prompt();
    this.prompt.hidden = prompt === null;
    this.prompt.textContent = prompt ?? "";
  }
}

function el(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) throw new Error(`#${id} missing`);
  return node;
}
