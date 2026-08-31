import * as THREE from "three";

/**
 * Motorcycle-visor skull: wider than tall from the front, with real
 * height and depth. One black mesh, no sockets.
 */
export function createVisorSkull(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.0, -0.088),
    new THREE.Vector2(0.028, -0.086),
    new THREE.Vector2(0.056, -0.074),
    new THREE.Vector2(0.078, -0.054),
    new THREE.Vector2(0.094, -0.028),
    new THREE.Vector2(0.102, -0.002),
    new THREE.Vector2(0.104, 0.024),
    new THREE.Vector2(0.098, 0.048),
    new THREE.Vector2(0.084, 0.07),
    new THREE.Vector2(0.062, 0.088),
    new THREE.Vector2(0.032, 0.1),
    new THREE.Vector2(0.0, 0.106),
  ];
  const geo = new THREE.LatheGeometry(profile, 64);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setX(i, x * 1.1);
    pos.setZ(i, z > 0 ? z * 0.78 : z * 0.88);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

type ArmorRing = {
  y: number;
  rx: number;
  rzFront: number;
  rzBack: number;
  power?: number;
  ridge?: number;
  lip?: number;
};

/** Open armor shell: paneled front, scooped back, hard lips, optional ridge. */
function loftArmor(
  rings: ArmorRing[],
  segs = 36,
  caps: "both" | "bottom" | "none" = "both",
): THREE.BufferGeometry {
  const cols = segs + 1;
  const positions: number[] = [];
  const indices: number[] = [];

  for (const ring of rings) {
    const lip = ring.lip ?? 1;
    const rx = ring.rx * lip;
    const rzF = ring.rzFront * lip;
    const rzB = ring.rzBack * lip;
    const pwr = ring.power ?? 0.62;
    const ridge = ring.ridge ?? 0;
    for (let j = 0; j <= segs; j += 1) {
      const a = (j / segs) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const x = rx * c;
      const z =
        s >= 0
          ? rzF * s ** pwr + ridge * s ** 3 * (1 - Math.abs(c) * 0.65)
          : rzB * s;
      positions.push(x, ring.y, z);
    }
  }

  const last = rings.length - 1;
  for (let i = 0; i < last; i += 1) {
    for (let j = 0; j < segs; j += 1) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  if (caps === "both") {
    const topCenter = positions.length / 3;
    positions.push(0, rings[0].y, 0);
    const botCenter = positions.length / 3;
    positions.push(0, rings[last].y, 0);
    for (let j = 0; j < segs; j += 1) {
      indices.push(topCenter, j, j + 1);
      const b = last * cols + j;
      indices.push(botCenter, b + 1, b);
    }
  } else if (caps === "bottom") {
    const botCenter = positions.length / 3;
    positions.push(0, rings[last].y, 0);
    for (let j = 0; j < segs; j += 1) {
      const b = last * cols + j;
      indices.push(botCenter, b + 1, b);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function stitchGrid(
  positions: number[],
  rows: number,
  cols: number,
  bothSides = false,
): THREE.BufferGeometry {
  const indices: number[] = [];
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols - 1; j += 1) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
      if (bothSides) indices.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function mergeGeos(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  let offset = 0;
  for (const part of parts) {
    const pos = part.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    }
    const idx = part.getIndex();
    if (idx) {
      for (let i = 0; i < idx.count; i += 1) indices.push(idx.getX(i) + offset);
    }
    offset += pos.count;
    part.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Athletic pec plate plus a round deltoid wrap on each side.
 * The pec itself stops at the pecs. Width at the shoulder comes
 * from the deltoid, so the front silhouette is two rounded hills
 * rather than a flat T-shelf. Front wall stays closed. No back plate.
 */
function buildPecPlate(): THREE.BufferGeometry {
  const rings = [
    { y: 0.262, rx: 0.088, zF: 0.094 },
    { y: 0.244, rx: 0.118, zF: 0.116 },
    { y: 0.222, rx: 0.158, zF: 0.13 },
    { y: 0.196, rx: 0.198, zF: 0.142 },
    { y: 0.164, rx: 0.236, zF: 0.148 },
    { y: 0.128, rx: 0.252, zF: 0.144 },
    { y: 0.096, rx: 0.236, zF: 0.118 },
    { y: 0.06, rx: 0.2, zF: 0.092 },
    { y: 0.028, rx: 0.178, zF: 0.072 },
    { y: 0.01, rx: 0.166, zF: 0.056 },
  ];
  const segs = 36;
  const wrap = 6;
  const cols = segs + 1 + wrap * 2;
  const positions: number[] = [];

  const collarU = (x: number, y: number) => {
    const ax = Math.abs(x);
    if (ax < 0.11 && y > 0.22) {
      return y - Math.exp(-((ax / 0.07) ** 2)) * ((y - 0.22) / 0.05) * 0.034;
    }
    return y;
  };

  for (const ring of rings) {
    for (let w = wrap; w >= 1; w -= 1) {
      const t = w / wrap;
      const y = collarU(-ring.rx, ring.y);
      positions.push(-ring.rx * (1 - t * 0.06), y, THREE.MathUtils.lerp(0.05, 0.002, t));
    }
    for (let j = 0; j <= segs; j += 1) {
      const xn = (j / segs) * 2 - 1;
      const x = ring.rx * xn;
      const y = collarU(x, ring.y);
      let z = 0.05 + (ring.zF - 0.05) * (1 - xn * xn);
      const pec = Math.exp(-(x * x) / 0.026) * Math.exp(-((y - 0.13) ** 2) / 0.016);
      z += pec * 0.05;
      positions.push(x, y, Math.max(0.05, z));
    }
    for (let w = 1; w <= wrap; w += 1) {
      const t = w / wrap;
      const y = collarU(ring.rx, ring.y);
      positions.push(ring.rx * (1 - t * 0.06), y, THREE.MathUtils.lerp(0.05, 0.002, t));
    }
  }

  return stitchGrid(positions, rings.length - 1, cols);
}

/** Front-only deltoid mass. Round in the camera plane, scoops off before the back. */
function buildDeltoidWrap(side: number): THREE.BufferGeometry {
  const rings = 14;
  const segs = 22;
  const positions: number[] = [];
  const cx = side * 0.312;
  const cy = 0.198;
  const cz = 0.022;
  const rx = 0.106;
  const ry = 0.09;
  const rz = 0.072;

  for (let i = 0; i <= rings; i += 1) {
    const theta = 0.28 + (i / rings) * 2.35;
    for (let j = 0; j <= segs; j += 1) {
      const phi = -1.05 + ((side > 0 ? j : segs - j) / segs) * 2.1;
      const x = cx + side * rx * Math.sin(theta) * Math.sin(phi);
      const y = cy + ry * Math.cos(theta);
      const z = cz + rz * Math.sin(theta) * Math.cos(phi);
      positions.push(x, y, Math.max(0.016, z));
    }
  }

  const geo = stitchGrid(positions, rings, segs + 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    if (x * side < 0.228) {
      pos.setX(i, THREE.MathUtils.lerp(x, side * 0.24, 0.55));
      pos.setZ(i, Math.max(pos.getZ(i), 0.052));
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export function createPecShell(): THREE.BufferGeometry {
  return mergeGeos([buildPecPlate(), buildDeltoidWrap(-1), buildDeltoidWrap(1)]);
}

/** Black ribcage the pec sits on. Fitted, not a hollow cage. */
export function createThorax(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.132, 0.268),
    new THREE.Vector2(0.148, 0.2),
    new THREE.Vector2(0.156, 0.12),
    new THREE.Vector2(0.15, 0.04),
    new THREE.Vector2(0.138, -0.01),
  ];
  const geo = new THREE.LatheGeometry(profile, 28);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    pos.setX(i, pos.getX(i) * 0.72);
    pos.setZ(i, z > 0 ? z * 0.64 : z * 0.38);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Fitted black waist. Wide enough that the front cannot see studio gray. */
export function createMidriff(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.21, 0.12),
    new THREE.Vector2(0.2, 0.06),
    new THREE.Vector2(0.192, 0.008),
    new THREE.Vector2(0.19, -0.05),
    new THREE.Vector2(0.194, -0.11),
    new THREE.Vector2(0.2, -0.18),
    new THREE.Vector2(0.206, -0.26),
  ];
  const geo = new THREE.LatheGeometry(profile, 32);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    pos.setZ(i, z > 0 ? z * 0.82 : z * 0.5);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Black mechanical pelvis. Fills the hip bowl into the thighs. */
export function createPelvis(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.168, 0.14),
    new THREE.Vector2(0.188, 0.08),
    new THREE.Vector2(0.2, 0.02),
    new THREE.Vector2(0.196, -0.04),
    new THREE.Vector2(0.178, -0.1),
    new THREE.Vector2(0.152, -0.16),
    new THREE.Vector2(0.12, -0.22),
  ];
  const geo = new THREE.LatheGeometry(profile, 32);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    pos.setZ(i, z > 0 ? z * 0.84 : z * 0.48);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Black column from mid-waist through the inner thighs.
 * Wide and tall on purpose: the front camera must not see studio gray.
 */
export function createCrotchGuard(): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(0.34, 0.58, 0.2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    const x = pos.getX(i);
    const taper = 1 - Math.max(0, -y - 0.1) * 0.45;
    pos.setX(i, x * taper);
    if (pos.getZ(i) < 0) pos.setZ(i, pos.getZ(i) * 0.35);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** White sleeve that grows up into the pec wrap. Not a pauldron ball. */
export function createDeltoid(side: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.072, rx: 0.07, rzFront: 0.078, rzBack: 0.026, power: 0.48 },
    { y: 0.012, rx: 0.062, rzFront: 0.07, rzBack: 0.022, power: 0.5 },
    { y: -0.06, rx: 0.052, rzFront: 0.056, rzBack: 0.02, power: 0.5 },
    { y: -0.13, rx: 0.046, rzFront: 0.048, rzBack: 0.018, power: 0.5, lip: 0.9 },
  ];
  const geo = loftArmor(rings, 36);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    if (x * side < 0) {
      pos.setX(i, x - side * (0.036 + Math.max(0, y) * 1.05));
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Fitted limb D-shell. Anterior plate, scooped back. Not a barrel or a pipe. */
export function createLimbShell(
  length: number,
  rxTop: number,
  rxBot: number,
  rz: number,
): THREE.BufferGeometry {
  const rings: ArmorRing[] = [];
  const steps = 10;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const mid = Math.max(0, 1 - Math.abs(t - 0.4) * 1.5);
    rings.push({
      y: -t * length,
      rx: rxTop + (rxBot - rxTop) * t,
      rzFront: rz * (1.05 + mid * 0.22),
      rzBack: rz * 0.26,
      ridge: 0.004 * mid,
      lip: i === 0 || i === steps ? 0.88 : 1,
      power: 0.48,
    });
  }
  return loftArmor(rings, 28);
}

/** Fitted quad: D-section, flat inner, anterior bulk. Not a pipe or a hip blade. */
export function createThighShell(length: number, side: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const quad = Math.exp(-(((t - 0.42) / 0.28) ** 2));
    rings.push({
      y: -t * length,
      rx: 0.054 + quad * 0.02 - t * 0.006,
      rzFront: (t < 0.12 ? 0.03 : 0.07) + quad * 0.09 - t * 0.006,
      rzBack: 0.012 + quad * 0.006,
      ridge: 0.005 * quad,
      lip: i === 0 ? 0.2 : i === steps ? 0.88 : 1,
      power: 0.42,
    });
  }
  const geo = loftArmor(rings, 36, "none");
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    if (x * side < 0) pos.setX(i, x * 0.5);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Shin as an anterior ski plate, not a tube. */
export function createShinShell(length: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [];
  const steps = 12;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const ridge = Math.max(0, 1 - Math.abs(t - 0.36) * 1.7);
    rings.push({
      y: -t * length,
      rx: 0.048 - t * 0.007,
      rzFront: 0.12 - t * 0.022,
      rzBack: 0.016 - t * 0.004,
      ridge: 0.005 * ridge,
      lip: i === 0 || i === steps ? 0.9 : 1,
      power: 0.5,
    });
  }
  return loftArmor(rings, 28, "none");
}

/** White kneecap on the front of the joint. */
export function createKneeCap(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.05, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.72);
  geo.scale(1.22, 0.7, 0.82);
  geo.rotateX(-0.42);
  geo.computeVertexNormals();
  return geo;
}

/** Organic palm volume. Not a rectangular block. */
export function createPalm(): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.01, rx: 0.032, rzFront: 0.02, rzBack: 0.016, power: 0.7, lip: 0.88 },
    { y: -0.02, rx: 0.044, rzFront: 0.03, rzBack: 0.022, power: 0.62 },
    { y: -0.048, rx: 0.048, rzFront: 0.034, rzBack: 0.022, power: 0.58 },
    { y: -0.072, rx: 0.042, rzFront: 0.03, rzBack: 0.018, power: 0.62, lip: 0.9 },
  ];
  return loftArmor(rings, 22, "both");
}

/** Short thick finger. Knuckle volume, planted in the palm. */
export function createFinger(length: number, width: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0, rx: width * 0.52, rzFront: width * 0.72, rzBack: width * 0.44, power: 0.58, lip: 0.92 },
    { y: -length * 0.32, rx: width * 0.58, rzFront: width * 0.86, rzBack: width * 0.48, power: 0.52 },
    { y: -length * 0.64, rx: width * 0.5, rzFront: width * 0.74, rzBack: width * 0.4, power: 0.54 },
    { y: -length, rx: width * 0.36, rzFront: width * 0.5, rzBack: width * 0.28, power: 0.58, lip: 0.84 },
  ];
  return loftArmor(rings, 16, "both");
}

