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
function loftArmor(
  rings: ArmorRing[],
  segs = 36,
  caps: "both" | "bottom" | "none" = "both",
): THREE.BufferGeometry {
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

  if (caps === "both") {
    const topCenter = positions.length / 3;
    positions.push(0, rings[0].y, 0);
    const botCenter = positions.length / 3;
    positions.push(0, rings[last].y, 0);
    for (let j = 0; j < segs; j += 1) {
      indices.push(topCenter, j, j + 1);
      const b = last * cols + j;
      indices.push(botCenter, b + 1, b);
    }
  } else if (caps === "bottom") {
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
 * Fitted pec that wraps into a round deltoid. Front wall stays
 * continuous (hole closed). Thickness is a U so the side is a
 * body and the back is not a wing. Outer dump is a
 * quarter-circle, not a pointed T-shelf.
 */
export function createPecShell(): THREE.BufferGeometry {
  const rings = [
    { y: 0.266, rx: 0.084, zF: 0.058 },
    { y: 0.248, rx: 0.126, zF: 0.072 },
    { y: 0.23, rx: 0.198, zF: 0.086 },
    { y: 0.212, rx: 0.298, zF: 0.096 },
    { y: 0.194, rx: 0.372, zF: 0.102 },
    { y: 0.174, rx: 0.4, zF: 0.098 },
    { y: 0.152, rx: 0.39, zF: 0.09 },
    { y: 0.128, rx: 0.352, zF: 0.082 },
    { y: 0.098, rx: 0.268, zF: 0.074 },
    { y: 0.06, rx: 0.206, zF: 0.06 },
    { y: 0.016, rx: 0.174, zF: 0.046 },
  ];
  const segs = 40;
  const cols = segs + 1;
  const positions: number[] = [];
  const indices: number[] = [];

  const sculpt = (rx: number, y0: number, xn: number, xScale: number, z: number) => {
    let x = rx * xn * xScale;
    let y = y0;
    if (y > 0.234) {
      const u = Math.exp(-((x / 0.078) ** 2)) * ((y - 0.234) / 0.032);
      y -= u * 0.03;
    }
    if (Math.abs(rx * xn) > 0.26 && y > 0.13) {
      const t = Math.min(1, (Math.abs(rx * xn) - 0.26) / 0.14);
      y -= t * t * 0.034;
    }
    if (xScale > 0.9 && Math.abs(x) < 0.2) {
      const pec = Math.exp(-(x * x) / 0.03) * Math.exp(-((y - 0.12) ** 2) / 0.014);
      z += pec * 0.024;
    }
    return { x, y, z: xScale > 0.9 ? Math.max(0.052, z) : z };
  };

  for (const ring of rings) {
    for (let j = 0; j <= segs; j += 1) {
      const xn = (j / segs) * 2 - 1;
      const z = 0.052 + (ring.zF - 0.052) * (1 - xn * xn);
      const v = sculpt(ring.rx, ring.y, xn, 1, z);
      positions.push(v.x, v.y, v.z);
    }
  }
  const innerOff = rings.length * cols;
  for (const ring of rings) {
    for (let j = 0; j <= segs; j += 1) {
      const xn = (j / segs) * 2 - 1;
      const v = sculpt(ring.rx, ring.y, xn, 0.48 + 0.1 * (1 - xn * xn), 0.012);
      positions.push(v.x, v.y, v.z);
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
      const ia = innerOff + a;
      indices.push(ia, ia + 1, ia + cols, ia + 1, ia + cols + 1, ia + cols);
    }
  }
  for (let i = 0; i < last; i += 1) {
    for (const j of [0, segs]) {
      const af = i * cols + j;
      const cf = af + cols;
      const ai = innerOff + i * cols + j;
      const ci = ai + cols;
      if (j === 0) indices.push(af, ai, cf, cf, ai, ci);
      else indices.push(af, cf, ai, cf, ci, ai);
    }
  }
  for (let j = 0; j < segs; j += 1) {
    indices.push(j, j + 1, innerOff + j, j + 1, innerOff + j + 1, innerOff + j);
    const c = last * cols + j;
    indices.push(c, innerOff + c, c + 1, c + 1, innerOff + c, innerOff + c + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Black ribcage the pec sits on. Fitted, not a hollow cage. */
export function createThorax(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.132, 0.268),
    new THREE.Vector2(0.148, 0.2),
    new THREE.Vector2(0.156, 0.12),
    new THREE.Vector2(0.15, 0.04),
    new THREE.Vector2(0.138, -0.01),
  ];
  const geo = new THREE.LatheGeometry(profile, 28);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    pos.setX(i, pos.getX(i) * 0.72);
    pos.setZ(i, z > 0 ? z * 0.64 : z * 0.38);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Fitted black waist from pec hem into the pelvis. */
export function createMidriff(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.182, 0.1),
    new THREE.Vector2(0.164, 0.058),
    new THREE.Vector2(0.15, 0.016),
    new THREE.Vector2(0.144, -0.028),
    new THREE.Vector2(0.15, -0.072),
    new THREE.Vector2(0.16, -0.118),
    new THREE.Vector2(0.168, -0.168),
  ];
  const geo = new THREE.LatheGeometry(profile, 32);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    pos.setZ(i, z > 0 ? z * 0.8 : z * 0.5);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Black mechanical pelvis. Fills the studio-gray hole between waist and thighs. */
export function createPelvis(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.122, 0.078),
    new THREE.Vector2(0.136, 0.042),
    new THREE.Vector2(0.142, 0.006),
    new THREE.Vector2(0.138, -0.03),
    new THREE.Vector2(0.124, -0.058),
    new THREE.Vector2(0.1, -0.082),
  ];
  const geo = new THREE.LatheGeometry(profile, 28);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    pos.setZ(i, z > 0 ? z * 0.72 : z * 0.48);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** White sleeve that grows up into the pec wrap. Not a pauldron ball. */
export function createDeltoid(side: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.052, rx: 0.06, rzFront: 0.066, rzBack: 0.024, power: 0.5 },
    { y: -0.012, rx: 0.056, rzFront: 0.062, rzBack: 0.022, power: 0.5 },
    { y: -0.08, rx: 0.05, rzFront: 0.054, rzBack: 0.02, power: 0.5 },
    { y: -0.14, rx: 0.046, rzFront: 0.048, rzBack: 0.018, power: 0.5, lip: 0.9 },
  ];
  const geo = loftArmor(rings, 36);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    if (x * side < 0) {
      pos.setX(i, x - side * (0.034 + Math.max(0, y) * 1.05));
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Fitted limb D-shell. Anterior plate, scooped back. Not a barrel or a pipe. */
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
    const mid = Math.max(0, 1 - Math.abs(t - 0.4) * 1.5);
    rings.push({
      y: -t * length,
      rx: rxTop + (rxBot - rxTop) * t,
      rzFront: rz * (1.05 + mid * 0.22),
      rzBack: rz * 0.26,
      ridge: 0.004 * mid,
      lip: i === 0 || i === steps ? 0.88 : 1,
      power: 0.48,
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
    const quad = Math.exp(-(((t - 0.5) / 0.2) ** 2));
    rings.push({
      y: -t * length,
      rx: 0.066 + quad * 0.018 - t * 0.01,
      rzFront: t < 0.16 ? 0.02 : 0.022 + quad * 0.132 - t * 0.008,
      rzBack: 0.012 + quad * 0.008 - t * 0.002,
      ridge: 0.006 * quad,
      lip: i === 0 ? 0.62 : i === steps ? 0.88 : 1,
      power: 0.42,
    });
  }
  const geo = loftArmor(rings, 36, "none");
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
      rx: 0.048 - t * 0.007,
      rzFront: 0.12 - t * 0.022,
      rzBack: 0.016 - t * 0.004,
      ridge: 0.005 * ridge,
      lip: i === 0 || i === steps ? 0.9 : 1,
      power: 0.5,
    });
  }
  return loftArmor(rings, 28, "none");
}

/** White kneecap on the front of the joint. */
export function createKneeCap(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.05, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.72);
  geo.scale(1.22, 0.7, 0.82);
  geo.rotateX(-0.42);
  geo.computeVertexNormals();
  return geo;
}

/** One finger: D-shell with a white plate face. Not a block, hoop, or cluster. */
export function createFinger(length: number, width: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0, rx: width * 0.4, rzFront: width * 0.82, rzBack: width * 0.26, power: 0.5, lip: 0.88 },
    { y: -length * 0.4, rx: width * 0.48, rzFront: width * 1.05, rzBack: width * 0.3, power: 0.48 },
    { y: -length * 0.76, rx: width * 0.4, rzFront: width * 0.86, rzBack: width * 0.24, power: 0.5 },
    { y: -length, rx: width * 0.3, rzFront: width * 0.52, rzBack: width * 0.16, power: 0.52, lip: 0.8 },
  ];
  return loftArmor(rings, 20, "both");
}

