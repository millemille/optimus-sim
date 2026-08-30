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

function boxRound(
  px: number,
  py: number,
  pz: number,
  hx: number,
  hy: number,
  hz: number,
  r: number,
): number {
  const qx = Math.abs(px) - hx + r;
  const qy = Math.abs(py) - hy + r;
  const qz = Math.abs(pz) - hz + r;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  const oz = Math.max(qz, 0);
  return Math.hypot(ox, oy, oz) + Math.min(Math.max(qx, qy, qz), 0) - r;
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/**
 * Fitted vest, not a yoke. Width lives at the deltoid corners
 * (~0.40 half-span). Center top is a neck well, not a bar.
 */
function torsoField(x: number, y: number, z: number): number {
  const t = Math.min(1, Math.max(0, y / 0.34));
  let hx = 0.118 + smoothstep(0, 0.58, t) * 0.108;
  const au = Math.abs(x);
  if (t > 0.56) {
    const side = smoothstep(0.15, 0.34, au);
    hx += 0.168 * side * smoothstep(0.56, 0.9, t);
  }
  const pecLift = Math.sin(Math.min(1, t / 0.52) * Math.PI);
  const hz = 0.058 + pecLift * 0.05;
  let d = boxRound(x, y - 0.152, z - 0.04, hx, 0.152, hz, 0.062);

  const delL = ellip(x, y, z, -0.302, 0.252, 0.018, 0.098, 0.086, 0.092);
  const delR = ellip(x, y, z, 0.302, 0.252, 0.018, 0.098, 0.086, 0.092);
  const sleeveL = ellip(x, y, z, -0.31, 0.15, 0.01, 0.068, 0.112, 0.062);
  const sleeveR = ellip(x, y, z, 0.31, 0.15, 0.01, 0.068, 0.112, 0.062);
  d = smin(d, smin(delL, delR, 0.045), 0.062);
  d = smin(d, smin(sleeveL, sleeveR, 0.05), 0.058);

  if (y > 0.2) {
    const center = Math.exp(-(x * x) / 0.02);
    const plane = ((y - 0.2) / 0.15) * center - 0.12;
    d = smax(d, plane, 0.045);
  }
  if (y > 0.286) {
    const well = Math.hypot(x / 0.058, (z - 0.008) / 0.048) - 1;
    d = smax(d, -well, 0.03);
  }
  return d;
}

function fieldGrad(x: number, y: number, z: number): [number, number, number] {
  const e = 0.0028;
  const dx = torsoField(x + e, y, z) - torsoField(x - e, y, z);
  const dy = torsoField(x, y + e, z) - torsoField(x, y - e, z);
  const dz = torsoField(x, y, z + e) - torsoField(x, y, z - e);
  const n = Math.hypot(dx, dy, dz) || 1;
  return [dx / n, dy / n, dz / n];
}

function marchHit(
  y: number,
  ang: number,
): [number, number, number] | null {
  const dx = Math.sin(ang);
  const dz = Math.cos(ang);
  const cx = 0;
  const cz = 0.02;
  let t = 0.52;
  let prev = torsoField(cx + dx * t, y, cz + dz * t);
  for (let i = 0; i < 90; i += 1) {
    t -= 0.007;
    if (t < 0.02) break;
    const x = cx + dx * t;
    const z = cz + dz * t;
    const d = torsoField(x, y, z);
    if (prev > 0 && d <= 0) {
      const f = prev / (prev - d);
      const tt = t + 0.007 - f * 0.007;
      return [cx + dx * tt, y, cz + dz * tt];
    }
    prev = d;
  }
  return null;
}

/** One pec+deltoid wrap extracted from the implicit vest. */
export function createPecShell(): THREE.BufferGeometry {
  const nu = 64;
  const nv = 42;
  const a0 = -2.2;
  const a1 = 2.2;
  const y0 = 0.004;
  const y1 = 0.358;
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
    inner.push(x - nx * 0.03, y - ny * 0.03, z - nz * 0.03);
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
      rx: 0.082 + quad * 0.016 - t * 0.012,
      rzFront: 0.126 + quad * 0.056 - t * 0.016,
      rzBack: 0.024 + quad * 0.01 - t * 0.004,
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

/** Thin white plate on the back of one phalanx. */
export function createPhalanxPlate(width: number, length: number): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(width, length, 0.0062);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    const taper = y < 0 ? 0.78 : 0.96;
    pos.setX(i, pos.getX(i) * taper);
    pos.setZ(i, pos.getZ(i) + 0.002);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Small white knuckle tile on the back of the hand. */
export function createKnuckleTile(): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(0.016, 0.014, 0.005);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    pos.setZ(i, pos.getZ(i) + 0.001);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}
