export class Input {
  readonly keys = new Set<string>();
  mouseX = 0;
  mouseY = 0;
  private useQueued = false;
  pointerLocked = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("pointerlockchange", this.onLockChange);
    canvas.addEventListener("mousedown", this.onMouseDown);
  }

  consumeUse(): boolean {
    if (!this.useQueued) return false;
    this.useQueued = false;
    return true;
  }

  consumeLook(): { x: number; y: number } {
    const look = { x: this.mouseX, y: this.mouseY };
    this.mouseX = 0;
    this.mouseY = 0;
    return look;
  }

  moving(): boolean {
    return (
      this.keys.has("KeyW") ||
      this.keys.has("KeyA") ||
      this.keys.has("KeyS") ||
      this.keys.has("KeyD")
    );
  }

  sprinting(): boolean {
    return this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
  }

  wish(out: { x: number; z: number }): void {
    out.x = 0;
    out.z = 0;
    if (this.keys.has("KeyW")) out.z += 1;
    if (this.keys.has("KeyS")) out.z -= 1;
    if (this.keys.has("KeyA")) out.x -= 1;
    if (this.keys.has("KeyD")) out.x += 1;
    const len = Math.hypot(out.x, out.z);
    if (len > 0) {
      out.x /= len;
      out.z /= len;
    }
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("pointerlockchange", this.onLockChange);
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "KeyE") this.useQueued = true;
    if (event.repeat) return;
    this.keys.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };

  private readonly onMouseMove = (event: MouseEvent): void => {
    if (!this.pointerLocked) return;
    this.mouseX += event.movementX;
    this.mouseY += event.movementY;
  };

  private readonly onMouseDown = (event: MouseEvent): void => {
    if (!this.pointerLocked || event.button !== 0) return;
    this.useQueued = true;
  };

  private readonly onLockChange = (): void => {
    this.pointerLocked = document.pointerLockElement === this.canvas;
  };
}
