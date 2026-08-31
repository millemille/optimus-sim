export type Box = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export const ROOM = {
  minX: -8.4,
  maxX: 8.4,
  minZ: -6.4,
  maxZ: 6.4,
};

export function resolveCircle(
  x: number,
  z: number,
  radius: number,
  boxes: readonly Box[],
): { x: number; z: number } {
  let px = Math.min(ROOM.maxX - radius, Math.max(ROOM.minX + radius, x));
  let pz = Math.min(ROOM.maxZ - radius, Math.max(ROOM.minZ + radius, z));

  for (const box of boxes) {
    const nx = Math.min(box.maxX, Math.max(box.minX, px));
    const nz = Math.min(box.maxZ, Math.max(box.minZ, pz));
    const dx = px - nx;
    const dz = pz - nz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= radius * radius) continue;
    if (d2 < 1e-8) {
      const left = Math.abs(px - box.minX);
      const right = Math.abs(box.maxX - px);
      const back = Math.abs(pz - box.minZ);
      const fwd = Math.abs(box.maxZ - pz);
      const m = Math.min(left, right, back, fwd);
      if (m === left) px = box.minX - radius;
      else if (m === right) px = box.maxX + radius;
      else if (m === back) pz = box.minZ - radius;
      else pz = box.maxZ + radius;
      continue;
    }
    const d = Math.sqrt(d2);
    px = nx + (dx / d) * radius;
    pz = nz + (dz / d) * radius;
  }

  px = Math.min(ROOM.maxX - radius, Math.max(ROOM.minX + radius, px));
  pz = Math.min(ROOM.maxZ - radius, Math.max(ROOM.minZ + radius, pz));
  return { x: px, z: pz };
}
