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
 * Torso, not a T-bar. Center is a pec V. Outer is a deltoid that
 * dumps down the arm. Widest at mid-shoulder (~0.40).
 */
function vestSurf(ang: number, v: number): [number, number, number] {
  const a = ang / 2.25;
  const outer = smoothstep(0.22, 0.68, Math.abs(a));
  const yDel = 0.252;
  const xDel = 0.314;
  const rDel = 0.086;
  const collar = 0.274;

  const xApprox = Math.sin(ang) * 0.4;
  const dx = Math.abs(xApprox) - xDel;
  let yTop = collar;
  if (dx * dx < rDel * rDel) {
    yTop = Math.max(collar, yDel + Math.sqrt(rDel * rDel - dx * dx));
  }
  if (Math.abs(a) > 0.72) {
    const o = (Math.abs(a) - 0.72) / 0.28;
    yTop -= o * o * 0.055;
  }

  const yBot = 0.058 - outer * 0.125;
  const y = yBot + v * (yTop - yBot);

  const pecW = 0.152 + smoothstep(0.04, 0.22, y) * 0.178;
  const dy = y - yDel;
  let sleeveW: number;
  if (y >= yDel - 0.015 && dy * dy < rDel * rDel) {
    sleeveW = xDel + Math.sqrt(Math.max(0, rDel * rDel - dy * dy));
  } else if (y < yDel) {
    sleeveW = 0.198 + smoothstep(-0.07, yDel, y) * 0.202;
  } else {
    sleeveW = 0.3;
  }
  let hw = pecW + (Math.max(sleeveW, pecW) - pecW) * outer;

  if (y > 0.248 && Math.abs(a) < 0.28) {
    const t = clamp01((y - 0.248) / 0.07);
    const c = 1 - Math.abs(a) / 0.28;
    hw -= t * t * c * c * 0.09;
    hw = Math.max(0.08, hw);
  }

  const pec =
    Math.exp(-((Math.abs(a) - 0.26) ** 2) / 0.11) * Math.exp(-((v - 0.55) ** 2) / 0.16);
  const sternum = Math.exp(-(a * a) / 0.03) * 0.012 * (1 - v * 0.35);
  let hz = 0.04 + pec * 0.07 - sternum;
  hz *= 0.48 + 0.52 * Math.sin(Math.max(0.08, v) * Math.PI);
  hz *= 1 - outer * 0.28;

  const wrap = Math.max(0.16, Math.cos(ang * 0.34));
  return [Math.sin(ang) * hw, y, hz * wrap];
}

export function createPecShell(): THREE.BufferGeometry {
  const nu = 64;
  const nv = 44;
  const a0 = -2.25;
  const a1 = 2.25;
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
      // Pull the inner face to a spine so the pec is a solid mass.
      // A 3cm shell rim reads as a shelf from the studio camera.
      positions.push(x * 0.18, y * 0.94 + 0.012, Math.min(z * 0.12, 0.012));
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
      rx: 0.08 + quad * 0.014 - t * 0.01,
      rzFront: 0.138 + quad * 0.058 - t * 0.016,
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

/** Rounded palm mass. Not a wrist sphere with prongs hanging off it. */
export function createPalm(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.04, 22, 16);
  geo.scale(1.48, 1.22, 0.74);
  geo.computeVertexNormals();
  return geo;
}
