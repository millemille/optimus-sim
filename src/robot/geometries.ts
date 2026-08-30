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
function loftArmor(rings: ArmorRing[], segs = 36): THREE.BufferGeometry {
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

  const topCenter = positions.length / 3;
  positions.push(0, rings[0].y, 0);
  const botCenter = positions.length / 3;
  positions.push(0, rings[last].y, 0);
  for (let j = 0; j < segs; j += 1) {
    indices.push(topCenter, j, j + 1);
    const b = last * cols + j;
    indices.push(botCenter, b + 1, b);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function smin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

function smax(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + h * h * k * 0.25;
}

function ellip(
  x: number,
  y: number,
  z: number,
  cx: number,
  cy: number,
  cz: number,
  rx: number,
  ry: number,
  rz: number,
): number {
  return Math.hypot((x - cx) / rx, (y - cy) / ry, (z - cz) / rz) - 1;
}

/**
 * Two tall pecs + two deltoid caps that wrap down the arm.
 * Not a wide bar, not a yoke across the top.
 */
function torsoField(x: number, y: number, z: number): number {
  const pecL = ellip(x, y, z, -0.108, 0.152, 0.06, 0.15, 0.14, 0.08);
  const pecR = ellip(x, y, z, 0.108, 0.152, 0.06, 0.15, 0.14, 0.08);
  const delL = ellip(x, y, z, -0.314, 0.226, 0.018, 0.088, 0.1, 0.08);
  const delR = ellip(x, y, z, 0.314, 0.226, 0.018, 0.088, 0.1, 0.08);
  const slL = ellip(x, y, z, -0.298, 0.055, 0.006, 0.06, 0.128, 0.048);
  const slR = ellip(x, y, z, 0.298, 0.055, 0.006, 0.06, 0.128, 0.048);

  let d = smin(pecL, pecR, 0.032);
  d = smin(d, smin(delL, delR, 0.038), 0.048);
  d = smin(d, smin(slL, slR, 0.04), 0.05);

  if (y > 0.235) {
    const well = Math.hypot(x / 0.088, (z - 0.008) / 0.065) - 1;
    d = smax(d, -well + (y - 0.235) * 2.1, 0.028);
  }
  d = smax(d, -z - 0.022, 0.02);
  return d;
}

function fieldGrad(x: number, y: number, z: number): [number, number, number] {
  const e = 0.0026;
  const dx = torsoField(x + e, y, z) - torsoField(x - e, y, z);
  const dy = torsoField(x, y + e, z) - torsoField(x, y - e, z);
  const dz = torsoField(x, y, z + e) - torsoField(x, y, z - e);
  const n = Math.hypot(dx, dy, dz) || 1;
  return [dx / n, dy / n, dz / n];
}

function marchHit(y: number, ang: number): [number, number, number] | null {
  const dx = Math.sin(ang);
  const dz = Math.cos(ang);
  let t = 0.55;
  let prev = torsoField(dx * t, y, 0.018 + dz * t);
  for (let i = 0; i < 100; i += 1) {
    t -= 0.006;
    if (t < 0.015) break;
    const x = dx * t;
    const z = 0.018 + dz * t;
    const d = torsoField(x, y, z);
    if (prev > 0 && d <= 0) {
      const f = prev / (prev - d);
      const tt = t + 0.006 - f * 0.006;
      return [dx * tt, y, 0.018 + dz * tt];
    }
    prev = d;
  }
  return null;
}

export function createPecShell(): THREE.BufferGeometry {
  const nu = 68;
  const nv = 48;
  const a0 = -2.3;
  const a1 = 2.3;
  const y0 = -0.06;
  const y1 = 0.34;
  const cols = nu + 1;
  const hits: Array<[number, number, number] | null> = [];

  for (let iv = 0; iv <= nv; iv += 1) {
    const y = y0 + (iv / nv) * (y1 - y0);
    for (let iu = 0; iu <= nu; iu += 1) {
      hits.push(marchHit(y, a0 + (iu / nu) * (a1 - a0)));
    }
  }

  const positions: number[] = [];
  const inner: number[] = [];
  const live: boolean[] = [];
  for (const h of hits) {
    if (!h) {
      positions.push(0, 0, 0);
      inner.push(0, 0, 0);
      live.push(false);
      continue;
    }
    const [x, y, z] = h;
    const [nx, ny, nz] = fieldGrad(x, y, z);
    positions.push(x, y, z);
    inner.push(x - nx * 0.036, y - ny * 0.036, z - nz * 0.036);
    live.push(true);
  }

  const frontCount = positions.length / 3;
  positions.push(...inner);

  const indices: number[] = [];
  const quad = (a: number, b: number, c: number, d: number): void => {
    indices.push(a, c, b, b, c, d);
  };
  for (let i = 0; i < nv; i += 1) {
    for (let j = 0; j < nu; j += 1) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      if (!live[a] || !live[b] || !live[c] || !live[d]) continue;
      quad(a, b, c, d);
      quad(frontCount + b, frontCount + a, frontCount + d, frontCount + c);
    }
  }
  for (let i = 0; i < nv; i += 1) {
    const L = i * cols;
    const L2 = L + cols;
    if (live[L] && live[L2]) quad(frontCount + L, L, frontCount + L2, L2);
    const R = i * cols + nu;
    const R2 = R + cols;
    if (live[R] && live[R2]) quad(R, frontCount + R, R2, frontCount + R2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Upper-arm sleeve under the pec wrap. Not a second shoulder cap. */
export function createDeltoid(): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: -0.02, rx: 0.05, rzFront: 0.056, rzBack: 0.024, lip: 0.9 },
    { y: -0.08, rx: 0.048, rzFront: 0.052, rzBack: 0.022 },
    { y: -0.15, rx: 0.044, rzFront: 0.046, rzBack: 0.02, lip: 0.88 },
  ];
  const geo = loftArmor(rings, 36);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    if (x < 0) pos.setX(i, x * 0.42);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Limb plate: D-section, not a barrel and not a pipe. */
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
    const mid = 1 - Math.abs(t - 0.38) * 1.4;
    rings.push({
      y: -t * length,
      rx: rxTop + (rxBot - rxTop) * t,
      rzFront: rz * (0.92 + Math.max(0, mid) * 0.12),
      rzBack: rz * 0.34,
      ridge: 0.003 * Math.max(0, mid),
      lip: i === 0 || i === steps ? 0.9 : 1,
      power: 0.5,
    });
  }
  return loftArmor(rings, 28);
}

/** Fitted quad: D-section, flat inner, anterior bulk. Not a pipe. */
export function createThighShell(length: number, side: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const quad = Math.exp(-(((t - 0.26) / 0.22) ** 2));
    rings.push({
      y: -t * length,
      rx: 0.078 + quad * 0.02 - t * 0.01,
      rzFront: 0.145 + quad * 0.062 - t * 0.018,
      rzBack: 0.072 + quad * 0.02 - t * 0.01,
      ridge: 0.003 * quad,
      lip: i === 0 || i === steps ? 0.92 : 1,
      power: 0.42,
    });
  }
  const geo = loftArmor(rings, 36);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    if (x * side < 0) pos.setX(i, x * 0.52);
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
      rx: 0.07 - t * 0.014,
      rzFront: 0.088 - t * 0.018,
      rzBack: 0.026 - t * 0.006,
      ridge: 0.005 * ridge,
      lip: i === 0 || i === steps ? 0.9 : 1,
      power: 0.5,
    });
  }
  return loftArmor(rings, 28);
}

/** White kneecap on the front of the joint. */
export function createKneeCap(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.05, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.72);
  geo.scale(1.22, 0.7, 0.82);
  geo.rotateX(-0.42);
  geo.computeVertexNormals();
  return geo;
}

function handField(x: number, y: number, z: number, side: number): number {
  let d = ellip(x, y, z, 0, -0.032, 0.002, 0.044, 0.04, 0.028);
  const digits: Array<[number, number, number, number, number, number]> = [
    [-0.028, -0.082, 0.006, 0.014, 0.03, 0.013],
    [-0.009, -0.092, 0.006, 0.015, 0.034, 0.014],
    [0.01, -0.09, 0.006, 0.0145, 0.032, 0.0135],
    [0.026, -0.078, 0.006, 0.013, 0.026, 0.012],
  ];
  for (const [cx, cy, cz, rx, ry, rz] of digits) {
    d = smin(d, ellip(x, y, z, cx, cy, cz, rx, ry, rz), 0.011);
  }
  d = smin(d, ellip(x, y, z, side * 0.038, -0.018, 0.012, 0.013, 0.024, 0.013), 0.01);
  return d;
}

/** One hand mass: palm plus finger lobes. Not capsules on a sphere. */
export function createHandMass(side: number): THREE.BufferGeometry {
  const nu = 28;
  const nv = 32;
  const cols = nu + 1;
  const positions: number[] = [];
  for (let iv = 0; iv <= nv; iv += 1) {
    const v = iv / nv;
    const y = 0.02 - v * 0.14;
    for (let iu = 0; iu <= nu; iu += 1) {
      const a = -Math.PI + (iu / nu) * Math.PI * 2;
      let t = 0.12;
      let hit: [number, number, number] | null = null;
      let prev = handField(Math.sin(a) * t, y, Math.cos(a) * t, side);
      for (let k = 0; k < 40; k += 1) {
        t -= 0.004;
        if (t < 0.002) break;
        const x = Math.sin(a) * t;
        const z = Math.cos(a) * t;
        const d = handField(x, y, z, side);
        if (prev > 0 && d <= 0) {
          const f = prev / (prev - d);
          const tt = t + 0.004 - f * 0.004;
          hit = [Math.sin(a) * tt, y, Math.cos(a) * tt];
          break;
        }
        prev = d;
      }
      if (hit) positions.push(hit[0], hit[1], hit[2]);
      else positions.push(0, y, 0);
    }
  }
  const indices: number[] = [];
  for (let i = 0; i < nv; i += 1) {
    for (let j = 0; j < nu; j += 1) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
