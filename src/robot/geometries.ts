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

function ellip2(x: number, y: number, cx: number, cy: number, rx: number, ry: number): number {
  return Math.hypot((x - cx) / rx, (y - cy) / ry) - 1;
}

function capsule2(
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  r: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy) / l2));
  return Math.hypot(x - ax - dx * t, y - ay - dy * t) - r;
}

/**
 * Front silhouette is authored in XY: one kidney per side (pec mound
 * running diagonally into a round deltoid), U-neckline, rounded hem.
 * Z is only thickness on that silhouette. Not a vest, not two balls.
 */
function torsoField(x: number, y: number, z: number): number {
  const ax = Math.abs(x);
  const pec = ellip2(ax, y, 0.112, 0.098, 0.136, 0.102);
  const del = ellip2(ax, y, 0.336, 0.228, 0.08, 0.086);
  const wrap = capsule2(ax, y, 0.176, 0.112, 0.286, 0.188, 0.05);
  const clav = ellip2(ax, y, 0.09, 0.188, 0.072, 0.048);
  let d2 = smin(smin(pec, del, 0.05), wrap, 0.038);
  d2 = smin(d2, clav, 0.04);

  if (y > 0.2) {
    const well = 0.1 + (y - 0.2) * 2.6;
    d2 = smax(d2, well - ax, 0.028);
  }
  if (y < 0.2 && ax > 0.236 && ax < 0.312) {
    const pit = (0.2 - y) * 2.1 - Math.abs(ax - 0.274) * 0.35;
    d2 = smax(d2, pit, 0.022);
  }

  const pecW = Math.exp(-((ax - 0.112) ** 2) / 0.016 - ((y - 0.098) ** 2) / 0.012);
  const delW = Math.exp(-((ax - 0.336) ** 2) / 0.01 - ((y - 0.228) ** 2) / 0.01);
  const cleft = Math.exp(-(ax ** 2) / 0.0032) * Math.max(0, 1 - Math.abs(y - 0.1) / 0.1);
  const zThick = 0.038 + 0.062 * pecW + 0.04 * delW - 0.022 * cleft;
  const zMid = 0.032 + 0.038 * pecW + 0.012 * delW;

  let d = smax(d2, Math.abs(z - zMid) - zThick, 0.016);
  d = smax(d, -z - 0.016, 0.014);
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

function frontHit(x: number, y: number): [number, number, number] | null {
  let z = 0.22;
  let prev = torsoField(x, y, z);
  for (let i = 0; i < 70; i += 1) {
    z -= 0.0045;
    if (z < -0.04) break;
    const d = torsoField(x, y, z);
    if (prev > 0 && d <= 0) {
      const f = prev / (prev - d);
      return [x, y, z + 0.0045 - f * 0.0045];
    }
    prev = d;
  }
  return null;
}

export function createPecShell(): THREE.BufferGeometry {
  const nu = 80;
  const nv = 56;
  const x0 = -0.43;
  const x1 = 0.43;
  const y0 = -0.05;
  const y1 = 0.332;
  const cols = nu + 1;
  const hits: Array<[number, number, number] | null> = [];

  for (let iv = 0; iv <= nv; iv += 1) {
    const y = y0 + (iv / nv) * (y1 - y0);
    for (let iu = 0; iu <= nu; iu += 1) {
      hits.push(frontHit(x0 + (iu / nu) * (x1 - x0), y));
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
    inner.push(x - nx * 0.034, y - ny * 0.034, z - nz * 0.034);
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

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Fitted black abdomen. Fills the empty triangles under the pec hem. */
export function createMidriff(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.205, 0.11),
    new THREE.Vector2(0.188, 0.078),
    new THREE.Vector2(0.162, 0.042),
    new THREE.Vector2(0.138, 0.008),
    new THREE.Vector2(0.128, -0.028),
    new THREE.Vector2(0.136, -0.058),
    new THREE.Vector2(0.152, -0.084),
  ];
  const geo = new THREE.LatheGeometry(profile, 28);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    pos.setZ(i, z > 0 ? z * 0.82 : z * 0.7);
  }
  pos.needsUpdate = true;
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
      rzFront: 0.168 + quad * 0.078 - t * 0.02,
      rzBack: 0.042 + quad * 0.012 - t * 0.008,
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

/** One hand-shaped mass: flat palm, four long fingers, thumb. */
export function createHandSilhouette(side: number): THREE.BufferGeometry {
  const field = (x: number, y: number): number => {
    let d = ellip2(x, y, 0, -0.028, 0.034, 0.026);
    const digits: Array<[number, number, number, number, number]> = [
      [-0.024, -0.048, -0.028, -0.092, 0.008],
      [-0.008, -0.05, -0.008, -0.102, 0.009],
      [0.008, -0.05, 0.01, -0.098, 0.0085],
      [0.022, -0.046, 0.027, -0.084, 0.0075],
    ];
    for (const [ax, ay, bx, by, r] of digits) {
      d = smin(d, capsule2(x, y, ax, ay, bx, by, r), 0.005);
    }
    d = smin(d, capsule2(x, y, side * 0.018, -0.016, side * 0.044, -0.05, 0.009), 0.006);
    return d;
  };

  const nu = 36;
  const nv = 40;
  const x0 = -0.06;
  const x1 = 0.06;
  const y0 = 0.01;
  const y1 = -0.12;
  const cols = nu + 1;
  const positions: number[] = [];
  const live: boolean[] = [];
  for (let iv = 0; iv <= nv; iv += 1) {
    const y = y0 + (iv / nv) * (y1 - y0);
    for (let iu = 0; iu <= nu; iu += 1) {
      const x = x0 + (iu / nu) * (x1 - x0);
      const d = field(x, y);
      if (d > 0) {
        positions.push(0, y, 0);
        live.push(false);
        continue;
      }
      const z = 0.022 * Math.max(0.35, 1 + d / 0.014);
      positions.push(x, y, z);
      live.push(true);
    }
  }
  const frontCount = positions.length / 3;
  const inner = positions.map((v, i) => (i % 3 === 2 ? -v * 0.55 : v));
  positions.push(...inner);
  const indices: number[] = [];
  for (let i = 0; i < nv; i += 1) {
    for (let j = 0; j < nu; j += 1) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      if (!live[a] || !live[b] || !live[c] || !live[d]) continue;
      indices.push(a, c, b, b, c, d);
      indices.push(frontCount + b, frontCount + a, frontCount + d, frontCount + c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** White kneecap on the front of the joint. */
export function createKneeCap(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.05, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.72);
  geo.scale(1.22, 0.7, 0.82);
  geo.rotateX(-0.42);
  geo.computeVertexNormals();
  return geo;
}

