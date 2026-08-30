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
 * Pectoral yoke that IS the shoulder. High rounded deltoid line, V-taper,
 * sternum cleft, armpit scoop at mid-height only. The top does not drop
 * at the sides — that shield taper is what made v10 a chest brick.
 */
export function createPecShell(): THREE.BufferGeometry {
  const segsV = 32;
  const segsU = 56;
  const cols = segsU + 1;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= segsV; iy += 1) {
    const t = iy / segsV;
    const y0 = t * 0.305;
    let rx = 0.108;
    let rzF = 0.07;
    let rzB = 0.036;
    if (t < 0.16) {
      const k = t / 0.16;
      rx = 0.108 + k * 0.052;
      rzF = 0.07 + k * 0.04;
      rzB = 0.036;
    } else if (t < 0.48) {
      const k = (t - 0.16) / 0.32;
      rx = 0.16 + k * 0.058;
      rzF = 0.11 + k * 0.04;
      rzB = 0.038;
    } else if (t < 0.84) {
      const k = (t - 0.48) / 0.36;
      rx = 0.218 + k * 0.102;
      rzF = 0.15 - k * 0.016;
      rzB = 0.03;
    } else {
      const k = (t - 0.84) / 0.16;
      rx = 0.32 - k * 0.068;
      rzF = 0.134 - k * 0.018;
      rzB = 0.028 * (1 - k * 0.9);
    }

    for (let ix = 0; ix <= segsU; ix += 1) {
      const a = (ix / segsU) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      let y = y0;
      if (t > 0.1 && t < 0.6) {
        const scoop = Math.sin(((t - 0.1) / 0.5) * Math.PI);
        y -= Math.abs(c) ** 1.12 * scoop * 0.078;
      }
      if (t > 0.8) {
        y -= Math.abs(c) ** 4.2 * (t - 0.8) * 0.045;
      }
      let r = rx;
      if (t > 0.72 && s < 0) {
        r *= 1 - ((t - 0.72) / 0.28) * 0.88;
      }
      const x = r * c;
      let z: number;
      if (s >= 0) {
        z = rzF * s ** 0.46;
        z *= 1 - 0.24 * Math.exp(-(x * x) / 0.00115);
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

/** Lower dump onto the upper arm only. The pec yoke already is the shoulder. */
export function createDeltoid(): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.004, rx: 0.072, rzFront: 0.068, rzBack: 0.026, lip: 0.9 },
    { y: -0.036, rx: 0.066, rzFront: 0.062, rzBack: 0.024, ridge: 0.005 },
    { y: -0.09, rx: 0.056, rzFront: 0.052, rzBack: 0.02 },
    { y: -0.15, rx: 0.048, rzFront: 0.044, rzBack: 0.018 },
    { y: -0.22, rx: 0.042, rzFront: 0.038, rzBack: 0.016, lip: 0.88 },
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
    const rzF = 0.132 + quad * 0.034 - t * 0.018;
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
  shape.moveTo(-0.038 * sx, 0.01);
  shape.bezierCurveTo(-0.046 * sx, -0.028, -0.048 * sx, -0.078, -0.042 * sx, -0.122);
  shape.quadraticCurveTo(-0.04 * sx, -0.148, -0.028 * sx, -0.16);
  shape.quadraticCurveTo(-0.016 * sx, -0.176, -0.004 * sx, -0.182);
  shape.quadraticCurveTo(0.01 * sx, -0.19, 0.02 * sx, -0.178);
  shape.quadraticCurveTo(0.032 * sx, -0.164, 0.036 * sx, -0.138);
  shape.quadraticCurveTo(0.04 * sx, -0.1, 0.044 * sx, -0.068);
  shape.quadraticCurveTo(0.064 * sx, -0.074, 0.076 * sx, -0.092);
  shape.quadraticCurveTo(0.084 * sx, -0.072, 0.07 * sx, -0.04);
  shape.quadraticCurveTo(0.054 * sx, -0.01, 0.032 * sx, 0.006);
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
