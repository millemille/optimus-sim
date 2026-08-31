export function concreteTexture(size = 512): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#6d6a64";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1800; i += 1) {
    const n = 70 + Math.random() * 50;
    ctx.fillStyle = `rgba(${n},${n - 4},${n - 10},${0.08 + Math.random() * 0.12})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2 + Math.random() * 6, 2 + Math.random() * 4);
  }
  ctx.strokeStyle = "rgba(30,30,28,0.18)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= size; x += size / 4) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, x);
    ctx.lineTo(size, x);
    ctx.stroke();
  }
  return canvas;
}

export function plasterTexture(size = 256): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#3a3936";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 400; i += 1) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 8, 3);
  }
  return canvas;
}
