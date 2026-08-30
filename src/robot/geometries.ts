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

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

/**
 * Athletic vest. The pec is a V. Each deltoid is a circle in the
 * front plane, widest at the equator (~0.40), inset at the top.
 * That is a shoulder, not a wing that kicks up and out.
 */
function vestSurf(ang: number, v: number): [number, number, number] {
  const a = ang / 2.15;

  const collar = 0.294;
  const peak = 0.358;
  const ad = Math.abs(Math.abs(a) - 0.62);
  const delHill = ad < 0.42 ? 0.5 + 0.5 * Math.cos((ad / 0.42) * Math.PI) : 0;
  let yTop = collar + (peak - collar) * delHill;
  if (Math.abs(a) > 0.8) {
    const o = (Math.abs(a) - 0.8) / 0.2;
    yTop -= o * o * 0.05;
  }

  const yBot = 0.078 + 0.02 * a * a;
  const y = yBot + v * (yTop - yBot);

  const pecW = 0.142 + smoothstep(0.078, 0.248, y) * 0.168;
  const yDel = 0.268;
  const xDel = 0.312;
  const rDel = 0.09;
  const dy = y - yDel;
  let delW = 0;
  if (dy * dy < rDel * rDel) {
    delW = xDel + Math.sqrt(rDel * rDel - dy * dy);
  }
  let hw = Math.max(pecW, delW);

  if (y > 0.268 && Math.abs(a) < 0.32) {
    const t = clamp01((y - 0.268) / 0.08);
    const c = 1 - Math.abs(a) / 0.32;
    hw -= t * t * c * c * 0.11;
    hw = Math.max(0.08, hw);
  }

  const pec =
    Math.exp(-((Math.abs(a) - 0.3) ** 2) / 0.09) * Math.exp(-((v - 0.4) ** 2) / 0.13);
  const sternum = Math.exp(-(a * a) / 0.03) * 0.015 * (1 - v * 0.45);
  let hz = 0.04 + pec * 0.068 - sternum;
  hz *= 0.52 + 0.48 * Math.sin(Math.max(0.12, v) * Math.PI);

  const wrap = Math.max(0.18, Math.cos(ang * 0.36));
  return [Math.sin(ang) * hw, y, hz * wrap];
}

export function createPecShell(): THREE.BufferGeometry {
  const nu = 64;
  const nv = 44;
  const a0 = -2.15;
  const a1 = 2.15;
  const cols = nu + 1;
  const positions: number[] = [];

  for (let iv = 0; iv <= nv; iv += 1) {
    const v = iv / nv;
    for (let iu = 0; iu <= nu; iu += 1) {
      const [x, y, z] = vestSurf(a0 + (iu / nu) * (a1 - a0), v);
      positions.push(x, y, z);
    }
  }
  const frontCount = positions.length / 3;
  for (let iv = 0; iv <= nv; iv += 1) {
    const v = iv / nv;
    for (let iu = 0; iu <= nu; iu += 1) {
      const [x, y, z] = vestSurf(a0 + (iu / nu) * (a1 - a0), v);
      positions.push(x * 0.88, y, z - 0.028);
    }
  }

  const indices: number[] = [];
  const quad = (a: number, b: number, c: number, d: number): void => {
    indices.push(a, c, b, b, c, d);
  };
  for (let i = 0; i < nv; i += 1) {
    for (let j = 0; j < nu; j += 1) {
      const a = i * cols + j;
      quad(a, a + 1, a + cols, a + cols + 1);
      const bk = frontCount + a;
      quad(bk + 1, bk, bk + cols + 1, bk + cols);
    }
  }
  for (let i = 0; i < nv; i += 1) {
    const L = i * cols;
    quad(frontCount + L, L, frontCount + L + cols, L + cols);
    const R = i * cols + nu;
    quad(R, frontCount + R, R + cols, frontCount + R + cols);
  }
  for (let j = 0; j < nu; j += 1) {
    quad(j + 1, j, frontCount + j + 1, frontCount + j);
    const t = nv * cols + j;
    quad(t, t + 1, frontCount + t, frontCount + t + 1);
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
      rzFront: 0.12 + quad * 0.05 - t * 0.014,
      rzBack: 0.068 + quad * 0.022 - t * 0.01,
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

/** One finger with knuckle volume and a pad tip. Not a plate slat. */
export function createFingerVolume(length: number, radius: number): THREE.BufferGeometry {
  const r = radius;
  const profile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(r * 0.82, 0.03),
    new THREE.Vector2(r * 1.08, 0.18),
    new THREE.Vector2(r * 0.94, 0.34),
    new THREE.Vector2(r * 1.06, 0.5),
    new THREE.Vector2(r * 0.88, 0.68),
    new THREE.Vector2(r * 0.7, 0.84),
    new THREE.Vector2(r * 0.4, 0.95),
    new THREE.Vector2(0.0, 1.0),
  ];
  const geo = new THREE.LatheGeometry(profile, 20);
  geo.scale(1.05, -length, 0.9);
  geo.computeVertexNormals();
  return geo;
}

/** Rounded palm you can read from across the room. */
export function createPalm(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.04, 22, 18);
  geo.scale(1.38, 1.02, 0.64);
  geo.computeVertexNormals();
  return geo;
}
