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

/**
 * One pec+deltoid wrap. Athletic width stays (v11 span, not v12 skinny).
 * Top edge is two rounded caps and a neck well, not a flat shield bar
 * and not a two-plate ridge.
 */
function torsoSample(u: number, v: number): [number, number, number] {
  const au = Math.abs(u);
  let hw: number;
  if (v < 0.2) hw = 0.112 + (v / 0.2) * 0.07;
  else if (v < 0.48) hw = 0.182 + ((v - 0.2) / 0.28) * 0.078;
  else if (v < 0.78) hw = 0.26 + ((v - 0.48) / 0.3) * 0.09;
  else hw = 0.35 - ((v - 0.78) / 0.22) * 0.03 * (1 - au);

  let y = 0.012 + v * 0.318;
  if (v > 0.74 && au < 0.42) {
    y -= ((0.42 - au) / 0.42) * (v - 0.74) * 0.085;
  }
  if (v > 0.84 && au > 0.78) {
    const t = ((au - 0.78) / 0.22) * ((v - 0.84) / 0.16);
    y -= Math.min(1, t) ** 2 * 0.035;
  }
  if (v > 0.1 && v < 0.48 && au > 0.55) {
    y -= ((au - 0.55) / 0.45) * Math.sin(((v - 0.1) / 0.38) * Math.PI) * 0.055;
  }

  const x = u * hw;
  const pec = Math.exp(-((au - 0.36) ** 2) / 0.1) * Math.exp(-((v - 0.44) ** 2) / 0.075);
  const del = Math.exp(-((au - 0.78) ** 2) / 0.06) * Math.exp(-((v - 0.76) ** 2) / 0.05);
  const sternum = Math.exp(-(u * u) / 0.03) * Math.exp(-((v - 0.46) ** 2) / 0.12);
  let z = 0.072 + pec * 0.082 + del * 0.07 - sternum * 0.016;
  if (au > 0.7) z *= 1 - ((au - 0.7) / 0.3) * 0.38;
  return [x, y, z];
}

export function createPecShell(): THREE.BufferGeometry {
  const nu = 48;
  const nv = 36;
  const cols = nu + 1;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let iv = 0; iv <= nv; iv += 1) {
    for (let iu = 0; iu <= nu; iu += 1) {
      const [x, y, z] = torsoSample((iu / nu) * 2 - 1, iv / nv);
      positions.push(x, y, z);
    }
  }
  const frontCount = cols * (nv + 1);
  for (let iv = 0; iv <= nv; iv += 1) {
    for (let iu = 0; iu <= nu; iu += 1) {
      const u = (iu / nu) * 2 - 1;
      const [x, y, z] = torsoSample(u, iv / nv);
      const thick = 0.032 + 0.018 * (1 - Math.abs(u));
      positions.push(x * 0.9, y, z - thick);
    }
  }

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

/** Deltoid mass that continues the pec wrap onto the arm. */
export function createDeltoid(): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.02, rx: 0.078, rzFront: 0.088, rzBack: 0.048, lip: 0.92 },
    { y: -0.03, rx: 0.074, rzFront: 0.082, rzBack: 0.044, ridge: 0.005 },
    { y: -0.09, rx: 0.062, rzFront: 0.068, rzBack: 0.036 },
    { y: -0.16, rx: 0.052, rzFront: 0.054, rzBack: 0.03 },
    { y: -0.22, rx: 0.044, rzFront: 0.044, rzBack: 0.024, lip: 0.88 },
  ];
  const geo = loftArmor(rings, 40);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    if (x < 0) pos.setX(i, x * 0.48);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Limb armor plate: taper, front ridge, scooped back. */
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
    const mid = 1 - Math.abs(t - 0.4) * 1.5;
    rings.push({
      y: -t * length,
      rx: rxTop + (rxBot - rxTop) * t,
      rzFront: rz * (1.08 + Math.max(0, mid) * 0.16),
      rzBack: rz * 0.72,
      ridge: 0.007 * Math.max(0, mid),
      lip: i === 0 || i === steps ? 0.9 : 1,
      power: 0.7,
    });
  }
  return loftArmor(rings, 28);
}

/** Full-volume quad: anterior bulge and a real posterior, not a front plate. */
export function createThighShell(length: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const quad = Math.exp(-(((t - 0.28) / 0.2) ** 2));
    const rx = 0.086 + quad * 0.018 - t * 0.014;
    rings.push({
      y: -t * length,
      rx,
      rzFront: 0.118 + quad * 0.048 - t * 0.014,
      rzBack: 0.05 + quad * 0.016 - t * 0.008,
      ridge: 0.014 * quad,
      lip: i === 0 || i === steps ? 0.9 : 1,
      power: 0.72,
    });
  }
  return loftArmor(rings, 36);
}

/** Shin plate with a tibial ridge. */
export function createShinShell(length: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [];
  const steps = 12;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const ridge = Math.max(0, 1 - Math.abs(t - 0.38) * 1.8);
    rings.push({
      y: -t * length,
      rx: 0.072 - t * 0.014,
      rzFront: 0.096 - t * 0.018,
      rzBack: 0.042 - t * 0.008,
      ridge: 0.012 * ridge,
      lip: i === 0 || i === steps ? 0.9 : 1,
      power: 0.7,
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

/** White knuckle plate over the back of the hand. */
export function createDorsalPlate(): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(0.092, 0.052, 0.015);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    const x = pos.getX(i);
    if (y < 0) pos.setX(i, x * 1.06);
    pos.setZ(i, pos.getZ(i) + Math.max(0, -y) * 0.08);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** One white dorsal phalanx, rounded, for a segmented finger. */
export function createPhalanx(length: number, width: number): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(width, length, 0.013);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    const taper = y < 0 ? 0.82 : 0.96;
    pos.setX(i, pos.getX(i) * taper);
    pos.setZ(i, pos.getZ(i) + 0.003);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}
