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
 * Pectoral yoke: V-taper plate with a sternum split and shoulder wings
 * that slope into the deltoid. Front-only collar so the neck stays bare.
 */
export function createPecShell(): THREE.BufferGeometry {
  const segsV = 28;
  const segsU = 52;
  const cols = segsU + 1;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= segsV; iy += 1) {
    const t = iy / segsV;
    const y0 = t * 0.29;
    let rx = 0.12;
    let rzF = 0.07;
    let rzB = 0.04;
    if (t < 0.14) {
      rx = 0.12 + (t / 0.14) * 0.06;
      rzF = 0.07 + (t / 0.14) * 0.035;
      rzB = 0.04;
    } else if (t < 0.48) {
      rx = 0.18 + ((t - 0.14) / 0.34) * 0.05;
      rzF = 0.105 + ((t - 0.14) / 0.34) * 0.03;
      rzB = 0.042;
    } else if (t < 0.82) {
      rx = 0.23 + ((t - 0.48) / 0.34) * 0.04;
      rzF = 0.135;
      rzB = 0.03;
    } else {
      const k = (t - 0.82) / 0.18;
      rx = 0.27 - k * 0.035;
      rzF = 0.12 - k * 0.02;
      rzB = 0.03 * (1 - k * 0.92);
    }

    for (let ix = 0; ix <= segsU; ix += 1) {
      const a = (ix / segsU) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      let y = y0;
      if (t > 0.52) {
        y -= Math.abs(c) ** 2.1 * (t - 0.52) * 0.09;
      }
      let r = rx;
      if (t > 0.74 && s < 0) {
        r *= 1 - ((t - 0.74) / 0.26) * 0.88;
      }
      const x = r * c;
      let z: number;
      if (s >= 0) {
        z = rzF * s ** 0.52;
        z *= 1 - 0.18 * Math.exp(-(x * x) / 0.00145);
      } else {
        z = rzB * s;
      }
      positions.push(x, y, z);
    }
  }

  for (let i = 0; i < segsV; i += 1) {
    for (let j = 0; j < segsU; j += 1) {
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

/** Pauldron wrap that dumps onto the upper arm. Inner face is scooped. */
export function createDeltoid(): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.07, rx: 0.118, rzFront: 0.11, rzBack: 0.04, lip: 0.9 },
    { y: 0.042, rx: 0.125, rzFront: 0.118, rzBack: 0.042, ridge: 0.01 },
    { y: 0.008, rx: 0.112, rzFront: 0.105, rzBack: 0.034, ridge: 0.008 },
    { y: -0.05, rx: 0.092, rzFront: 0.088, rzBack: 0.03 },
    { y: -0.12, rx: 0.072, rzFront: 0.068, rzBack: 0.024 },
    { y: -0.2, rx: 0.054, rzFront: 0.05, rzBack: 0.02, lip: 0.9 },
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
      rzFront: rz * (1.05 + Math.max(0, mid) * 0.18),
      rzBack: rz * 0.38,
      ridge: 0.006 * Math.max(0, mid),
      lip: i === 0 || i === steps ? 0.88 : 1,
      power: 0.58,
    });
  }
  return loftArmor(rings, 28);
}

/** Athletic quad plate: peaks mid-thigh, tapers to the knee, center ridge. */
export function createThighShell(length: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const quad = Math.exp(-(((t - 0.32) / 0.22) ** 2));
    const rx = 0.09 + quad * 0.024 - t * 0.016;
    const rzF = 0.1 + quad * 0.042 - t * 0.014;
    rings.push({
      y: -t * length,
      rx,
      rzFront: rzF,
      rzBack: 0.028 - t * 0.006,
      ridge: 0.012 * quad,
      lip: i === 0 || i === steps ? 0.9 : 1,
      power: 0.5,
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
      rzFront: 0.09 - t * 0.02,
      rzBack: 0.024 - t * 0.004,
      ridge: 0.014 * ridge,
      lip: i === 0 || i === steps ? 0.9 : 1,
      power: 0.48,
    });
  }
  return loftArmor(rings, 28);
}

/** Back-of-hand plate only. Fingers attach at the knuckles. */
export function createDorsalPlate(): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.01, rx: 0.038, rzFront: 0.014, rzBack: 0.006, lip: 0.92 },
    { y: -0.025, rx: 0.048, rzFront: 0.016, rzBack: 0.007 },
    { y: -0.058, rx: 0.056, rzFront: 0.018, rzBack: 0.007, ridge: 0.004 },
    { y: -0.095, rx: 0.06, rzFront: 0.017, rzBack: 0.006, ridge: 0.005 },
    { y: -0.108, rx: 0.058, rzFront: 0.014, rzBack: 0.005, lip: 0.9 },
  ];
  return loftArmor(rings, 24);
}
