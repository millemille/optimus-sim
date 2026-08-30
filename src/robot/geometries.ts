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
 * Pectoral yoke that IS the shoulder. Width stays at the deltoid through
 * the collar; only the neck notch tucks. Armpit scoops mid-height.
 */
export function createPecShell(): THREE.BufferGeometry {
  const segsV = 32;
  const segsU = 56;
  const cols = segsU + 1;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= segsV; iy += 1) {
    const t = iy / segsV;
    const y0 = t * 0.318;
    let rx = 0.11;
    let rzF = 0.078;
    let rzB = 0.034;
    if (t < 0.18) {
      const k = t / 0.18;
      rx = 0.11 + k * 0.06;
      rzF = 0.078 + k * 0.05;
      rzB = 0.034;
    } else if (t < 0.5) {
      const k = (t - 0.18) / 0.32;
      rx = 0.17 + k * 0.07;
      rzF = 0.128 + k * 0.05;
      rzB = 0.036;
    } else if (t < 0.78) {
      const k = (t - 0.5) / 0.28;
      rx = 0.24 + k * 0.14;
      rzF = 0.178 - k * 0.012;
      rzB = 0.028;
    } else {
      rx = 0.38;
      rzF = 0.17;
      rzB = 0.024;
    }

    for (let ix = 0; ix <= segsU; ix += 1) {
      const a = (ix / segsU) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      let y = y0;
      if (t > 0.12 && t < 0.58) {
        const scoop = Math.sin(((t - 0.12) / 0.46) * Math.PI);
        y -= Math.abs(c) ** 1.05 * scoop * 0.09;
      }
      if (t > 0.86) {
        y -= Math.abs(c) ** 5 * (t - 0.86) * 0.035;
      }
      let r = rx;
      if (t > 0.86 && Math.abs(c) < 0.42) {
        const notch = (0.42 - Math.abs(c)) / 0.42;
        r *= 1 - notch * ((t - 0.86) / 0.14) * 0.55;
      }
      if (t > 0.7 && s < 0) {
        r *= 1 - ((t - 0.7) / 0.3) * 0.9;
      }
      const x = r * c;
      let z: number;
      if (s >= 0) {
        z = rzF * s ** 0.42;
        z *= 1 - 0.34 * Math.exp(-(x * x) / 0.0009);
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

/** Sleeve that continues the pec onto the arm. Stays below the yoke line. */
export function createDeltoid(): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: -0.02, rx: 0.058, rzFront: 0.056, rzBack: 0.022, lip: 0.9 },
    { y: -0.06, rx: 0.054, rzFront: 0.052, rzBack: 0.02, ridge: 0.004 },
    { y: -0.11, rx: 0.048, rzFront: 0.046, rzBack: 0.018 },
    { y: -0.17, rx: 0.044, rzFront: 0.04, rzBack: 0.016 },
    { y: -0.24, rx: 0.04, rzFront: 0.036, rzBack: 0.014, lip: 0.86 },
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
      rzFront: rz * (1.12 + Math.max(0, mid) * 0.22),
      rzBack: rz * 0.32,
      ridge: 0.008 * Math.max(0, mid),
      lip: i === 0 || i === steps ? 0.86 : 1,
      power: 0.5,
    });
  }
  return loftArmor(rings, 28);
}

/** Quad plate: athletic front width, pec-deep anterior, scooped back. */
export function createThighShell(length: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const quad = Math.exp(-(((t - 0.3) / 0.2) ** 2));
    const rx = 0.088 + quad * 0.018 - t * 0.02;
    const rzF = 0.148 + quad * 0.036 - t * 0.02;
    rings.push({
      y: -t * length,
      rx,
      rzFront: rzF,
      rzBack: 0.02 - t * 0.004,
      ridge: 0.02 * quad,
      lip: i === 0 || i === steps ? 0.88 : 1,
      power: 0.36,
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
      rzFront: 0.1 - t * 0.022,
      rzBack: 0.02 - t * 0.003,
      ridge: 0.016 * ridge,
      lip: i === 0 || i === steps ? 0.88 : 1,
      power: 0.4,
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

/**
 * One white glove silhouette. Thumb is part of the outline, not a hole
 * and not a fifth cylinder. Sized to read at the studio camera.
 */
export function createGlove(side: number): THREE.BufferGeometry {
  const sx = side >= 0 ? 1 : -1;
  const shape = new THREE.Shape();
  shape.moveTo(-0.04 * sx, 0.012);
  shape.bezierCurveTo(-0.05 * sx, -0.03, -0.052 * sx, -0.08, -0.046 * sx, -0.118);
  // pinky
  shape.quadraticCurveTo(-0.044 * sx, -0.15, -0.034 * sx, -0.168);
  shape.quadraticCurveTo(-0.03 * sx, -0.136, -0.022 * sx, -0.128);
  // ring
  shape.quadraticCurveTo(-0.016 * sx, -0.172, -0.008 * sx, -0.188);
  shape.quadraticCurveTo(-0.002 * sx, -0.15, 0.004 * sx, -0.132);
  // middle
  shape.quadraticCurveTo(0.012 * sx, -0.176, 0.02 * sx, -0.194);
  shape.quadraticCurveTo(0.026 * sx, -0.154, 0.03 * sx, -0.13);
  // index
  shape.quadraticCurveTo(0.038 * sx, -0.162, 0.044 * sx, -0.17);
  shape.quadraticCurveTo(0.046 * sx, -0.132, 0.042 * sx, -0.1);
  // thumb lobe
  shape.quadraticCurveTo(0.05 * sx, -0.072, 0.074 * sx, -0.096);
  shape.quadraticCurveTo(0.09 * sx, -0.078, 0.078 * sx, -0.042);
  shape.quadraticCurveTo(0.058 * sx, -0.008, 0.03 * sx, 0.01);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.024,
    bevelEnabled: true,
    bevelThickness: 0.007,
    bevelSize: 0.006,
    bevelSegments: 3,
    curveSegments: 22,
  });
  geo.translate(0, 0, -0.012);
  geo.computeVertexNormals();
  return geo;
}
