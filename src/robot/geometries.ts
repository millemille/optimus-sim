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
 * Front armor: two pec mounds + rounded deltoid caps as one surface.
 * Not a polar oval. The old rx=0.38 ring was the shield.
 */
function torsoSample(u: number, v: number): [number, number, number] {
  const au = Math.abs(u);
  let hw: number;
  if (v < 0.22) hw = 0.102 + (v / 0.22) * 0.058;
  else if (v < 0.52) hw = 0.16 + ((v - 0.22) / 0.3) * 0.055;
  else if (v < 0.8) hw = 0.215 + ((v - 0.52) / 0.28) * 0.055;
  else hw = 0.27 - ((v - 0.8) / 0.2) * 0.035 * (1 - au);

  let y = 0.012 + v * 0.305;
  if (v > 0.78 && au < 0.38) {
    y -= ((0.38 - au) / 0.38) * (v - 0.78) * 0.11;
  }
  if (v > 0.68 && au > 0.52) {
    const du = (au - 0.52) / 0.48;
    const dv = (v - 0.68) / 0.32;
    const r = Math.hypot(du, dv);
    if (r > 0.5) y -= (r - 0.5) * 0.1;
  }
  if (v > 0.08 && v < 0.48 && au > 0.48) {
    y -= ((au - 0.48) / 0.52) * Math.sin(((v - 0.08) / 0.4) * Math.PI) * 0.07;
  }

  const x = u * hw;
  const pec = Math.exp(-((au - 0.4) ** 2) / 0.065) * Math.exp(-((v - 0.45) ** 2) / 0.05);
  const del = Math.exp(-((au - 0.84) ** 2) / 0.04) * Math.exp(-((v - 0.74) ** 2) / 0.036);
  const sternum = Math.exp(-(u * u) / 0.016) * (0.25 + 0.75 * Math.exp(-((v - 0.48) ** 2) / 0.07));
  let z = 0.052 + pec * 0.1 + del * 0.075 - sternum * 0.042;
  if (au > 0.7) z *= 1 - ((au - 0.7) / 0.3) * 0.5;
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

/** Short wrap from the pec cap onto the upper arm. Not a pad on the chest. */
export function createDeltoid(): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: -0.03, rx: 0.06, rzFront: 0.07, rzBack: 0.04, lip: 0.92 },
    { y: -0.07, rx: 0.056, rzFront: 0.064, rzBack: 0.036, ridge: 0.004 },
    { y: -0.13, rx: 0.05, rzFront: 0.054, rzBack: 0.03 },
    { y: -0.2, rx: 0.044, rzFront: 0.046, rzBack: 0.026, lip: 0.88 },
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
    const rx = 0.082 + quad * 0.016 - t * 0.016;
    rings.push({
      y: -t * length,
      rx,
      rzFront: 0.1 + quad * 0.042 - t * 0.012,
      rzBack: 0.068 + quad * 0.022 - t * 0.01,
      ridge: 0.012 * quad,
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
      rx: 0.074 - t * 0.018,
      rzFront: 0.088 - t * 0.016,
      rzBack: 0.058 - t * 0.01,
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

/** White dorsal knuckle plate. Fingers attach as separate plates. */
export function createDorsalPlate(): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(0.09, 0.058, 0.016);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    const x = pos.getX(i);
    if (y < 0) pos.setX(i, x * 1.08);
    if (y > 0) pos.setX(i, x * 0.88);
    pos.setZ(i, pos.getZ(i) + 0.004 * (1 - (y + 0.029) / 0.058));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** One white finger plate, tapered toward the tip. */
export function createFingerPlate(length: number, width: number): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(width, length, 0.014);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    if (pos.getY(i) < 0) {
      pos.setX(i, pos.getX(i) * 0.72);
      pos.setZ(i, pos.getZ(i) * 0.8);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}
