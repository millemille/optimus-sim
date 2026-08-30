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

/** Tube loft with an open collar. No inner offset surface, so no z-fight. */
function loftOpenShell(rings: ArmorRing[], segs = 36, capBottom = true): THREE.BufferGeometry {
  const cols = segs + 1;
  const positions: number[] = [];
  const indices: number[] = [];

  for (const ring of rings) {
    const lip = ring.lip ?? 1;
    const rx = ring.rx * lip;
    const rzF = ring.rzFront * lip;
    const rzB = ring.rzBack * lip;
    const pwr = ring.power ?? 0.5;
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

  if (capBottom) {
    const botCenter = positions.length / 3;
    positions.push(0, rings[last].y, 0);
    for (let j = 0; j < segs; j += 1) {
      const b = last * cols + j;
      indices.push(botCenter, b + 1, b);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * One athletic vest. Width is a human curve (U collar, pec, deltoid
 * peak, waist), not an ellipsoid circle and not two lofted halves.
 * Peak half-span 0.400, in the recovered ~293px band, not a 309px yoke.
 */
export function createPecShell(): THREE.BufferGeometry {
  const rings: ArmorRing[] = [];
  const steps = 22;
  const y0 = 0.318;
  const y1 = -0.01;

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    let rx: number;
    if (t < 0.28) {
      const u = t / 0.28;
      rx = 0.108 + 0.292 * (1 - Math.cos((u * Math.PI) / 2));
    } else if (t < 0.48) {
      const u = (t - 0.28) / 0.2;
      rx = 0.4 - 0.078 * (u * u);
    } else if (t < 0.72) {
      const u = (t - 0.48) / 0.24;
      rx = 0.322 - 0.072 * u;
    } else {
      const u = (t - 0.72) / 0.28;
      rx = 0.25 - 0.055 * (1 - Math.cos((u * Math.PI) / 2));
    }

    const pecHill = Math.exp(-(((t - 0.38) / 0.16) ** 2));
    const deltoid = Math.exp(-(((t - 0.28) / 0.12) ** 2));
    rings.push({
      y: y0 + (y1 - y0) * t,
      rx,
      rzFront: 0.052 + pecHill * 0.078 + deltoid * 0.016,
      rzBack: 0.04 + pecHill * 0.01,
      power: 0.5,
      ridge: pecHill * 0.006,
    });
  }

  const geo = loftOpenShell(rings, 40, true);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i);

    if (y > 0.255) {
      const u = Math.exp(-((x / 0.09) ** 2)) * ((y - 0.255) / 0.07);
      pos.setY(i, y - u * 0.055);
    }

    if (Math.abs(x) > 0.26 && y > 0.12) {
      const wrap = ((Math.abs(x) - 0.26) / 0.15) * 0.04;
      pos.setY(i, pos.getY(i) - wrap);
    }

    if (z > 0) {
      const pecL = Math.exp(-(((x + 0.086) / 0.078) ** 2)) * Math.exp(-(((y - 0.175) / 0.085) ** 2));
      const pecR = Math.exp(-(((x - 0.086) / 0.078) ** 2)) * Math.exp(-(((y - 0.175) / 0.085) ** 2));
      z += (pecL + pecR) * 0.042;
      pos.setZ(i, z);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Solid fitted abdomen. Not a hollow ring cage. */
export function createMidriff(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.198, 0.118),
    new THREE.Vector2(0.178, 0.08),
    new THREE.Vector2(0.152, 0.042),
    new THREE.Vector2(0.132, 0.006),
    new THREE.Vector2(0.126, -0.032),
    new THREE.Vector2(0.138, -0.064),
    new THREE.Vector2(0.155, -0.09),
  ];
  const geo = new THREE.LatheGeometry(profile, 32);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    pos.setZ(i, z > 0 ? z * 0.88 : z * 0.78);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** White upper-arm dump under the vest. Same front rx as the limb, not a barrel. */
export function createDeltoid(side: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.018, rx: 0.054, rzFront: 0.06, rzBack: 0.026, power: 0.5 },
    { y: -0.055, rx: 0.05, rzFront: 0.054, rzBack: 0.022, power: 0.5 },
    { y: -0.13, rx: 0.046, rzFront: 0.048, rzBack: 0.02, power: 0.5, lip: 0.9 },
  ];
  const geo = loftArmor(rings, 36);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    if (x * side < 0) pos.setX(i, x * 0.4);
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
    const quad = Math.exp(-(((t - 0.4) / 0.2) ** 2));
    rings.push({
      y: -t * length,
      rx: 0.07 + quad * 0.016 - t * 0.008,
      rzFront: 0.074 + quad * 0.116 - t * 0.01,
      rzBack: 0.028 + quad * 0.012 - t * 0.004,
      ridge: 0.004 * quad,
      lip: i === 0 || i === steps ? 0.92 : 1,
      power: 0.46,
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
      rx: 0.054 - t * 0.01,
      rzFront: 0.098 - t * 0.02,
      rzBack: 0.022 - t * 0.004,
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

/** Flat finger plate you can count from the front. Not a capsule, not a box slat. */
export function createFingerPlate(length: number, width: number): THREE.BufferGeometry {
  const s = new THREE.Shape();
  const w = width * 0.5;
  s.moveTo(-w * 0.82, 0);
  s.bezierCurveTo(-w, length * 0.2, -w * 1.04, length * 0.44, -w * 0.9, length * 0.7);
  s.bezierCurveTo(-w * 0.5, length * 0.9, -w * 0.18, length, 0, length);
  s.bezierCurveTo(w * 0.18, length, w * 0.5, length * 0.9, w * 0.9, length * 0.7);
  s.bezierCurveTo(w * 1.04, length * 0.44, w, length * 0.2, w * 0.82, 0);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: width * 0.7,
    bevelEnabled: true,
    bevelThickness: width * 0.11,
    bevelSize: width * 0.09,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geo.translate(0, 0, -width * 0.35);
  geo.computeVertexNormals();
  return geo;
}

