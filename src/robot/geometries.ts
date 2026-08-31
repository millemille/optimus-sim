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

function stitchGrid(
  positions: number[],
  rows: number,
  cols: number,
  bothSides = false,
): THREE.BufferGeometry {
  const indices: number[] = [];
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols - 1; j += 1) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
      if (bothSides) indices.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * One white surface: collar U, pec mound, quarter-circle into the
 * upper arm. Not a plate with two spheres on it. Front wall stays
 * closed. Side wrap stops at z=0, so there is no back plate.
 */
export function createPecShell(): THREE.BufferGeometry {
  const rows = 22;
  const segs = 52;
  const wrap = 8;
  const cols = segs + 1 + wrap * 2;
  const positions: number[] = [];

  const topEdge = (xn: number) => {
    const ax = Math.abs(xn);
    const side = xn < 0 ? -1 : 1;
    if (ax <= 0.56) {
      const t = ax / 0.56;
      return {
        x: side * THREE.MathUtils.lerp(0, 0.24, t),
        y: 0.214 + 0.048 * t ** 0.58,
        z: 0.09 - 0.022 * t * t,
      };
    }
    const t = (ax - 0.56) / 0.44;
    const ang = THREE.MathUtils.lerp(Math.PI * 0.5, 0.1, t);
    return {
      x: side * (0.24 + 0.168 * Math.cos(ang)),
      y: 0.146 + 0.116 * Math.sin(ang),
      z: 0.05 + 0.042 * Math.sin(ang),
    };
  };

  const hemOf = (xn: number) => {
    const ax = Math.abs(xn);
    const side = xn < 0 ? -1 : 1;
    return {
      x: side * (0.168 + 0.02 * ax),
      y: 0.01,
      z: 0.052,
    };
  };

  const point = (xn: number, v: number) => {
    const top = topEdge(xn);
    const hem = hemOf(xn);
    const e = v * 0.8 + v * v * 0.2;
    let x = THREE.MathUtils.lerp(top.x, hem.x, e);
    let y = THREE.MathUtils.lerp(top.y, hem.y, e);
    let z = THREE.MathUtils.lerp(top.z, hem.z, e);
    const pec = Math.exp(-(x * x) / 0.028) * Math.exp(-((y - 0.128) ** 2) / 0.015);
    z += pec * 0.054;
    return { x, y, z: Math.max(0.05, z) };
  };

  for (let i = 0; i <= rows; i += 1) {
    const v = i / rows;
    const left = point(-1, v);
    for (let w = wrap; w >= 1; w -= 1) {
      const t = w / wrap;
      positions.push(left.x * (1 - t * 0.07), left.y - t * 0.01, THREE.MathUtils.lerp(left.z, 0, t));
    }
    for (let j = 0; j <= segs; j += 1) {
      const p = point((j / segs) * 2 - 1, v);
      positions.push(p.x, p.y, p.z);
    }
    const right = point(1, v);
    for (let w = 1; w <= wrap; w += 1) {
      const t = w / wrap;
      positions.push(right.x * (1 - t * 0.07), right.y - t * 0.01, THREE.MathUtils.lerp(right.z, 0, t));
    }
  }

  return stitchGrid(positions, rows, cols);
}

/** Black ribcage the pec sits on. Fitted, not a hollow cage. */
export function createThorax(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.118, 0.26),
    new THREE.Vector2(0.136, 0.18),
    new THREE.Vector2(0.142, 0.1),
    new THREE.Vector2(0.132, 0.03),
    new THREE.Vector2(0.118, -0.02),
  ];
  const geo = new THREE.LatheGeometry(profile, 28);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    pos.setX(i, pos.getX(i) * 0.7);
    pos.setZ(i, z > 0 ? z * 0.7 : z * 0.36);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Black waist that cinches, then opens into the hips. Not a fridge. */
export function createMidriff(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.184, 0.1),
    new THREE.Vector2(0.158, 0.042),
    new THREE.Vector2(0.136, -0.01),
    new THREE.Vector2(0.128, -0.06),
    new THREE.Vector2(0.134, -0.12),
    new THREE.Vector2(0.148, -0.18),
    new THREE.Vector2(0.16, -0.24),
  ];
  const geo = new THREE.LatheGeometry(profile, 32);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    pos.setZ(i, z > 0 ? z * 0.8 : z * 0.48);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Tapered mechanical pelvis. Solid down the center into the thighs. */
export function createPelvis(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.148, 0.16),
    new THREE.Vector2(0.162, 0.08),
    new THREE.Vector2(0.166, 0.016),
    new THREE.Vector2(0.152, -0.05),
    new THREE.Vector2(0.13, -0.12),
    new THREE.Vector2(0.1, -0.2),
    new THREE.Vector2(0.078, -0.3),
  ];
  const geo = new THREE.LatheGeometry(profile, 32);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    pos.setZ(i, z > 0 ? z * 0.82 : z * 0.46);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Tapered fill from mid-waist through the inner thighs.
 * Curved sides, not a box. Center stays opaque.
 */
export function createCrotchGuard(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.138, 0.22),
    new THREE.Vector2(0.146, 0.12),
    new THREE.Vector2(0.142, 0.03),
    new THREE.Vector2(0.128, -0.06),
    new THREE.Vector2(0.108, -0.16),
    new THREE.Vector2(0.086, -0.26),
    new THREE.Vector2(0.07, -0.36),
  ];
  const geo = new THREE.LatheGeometry(profile, 28);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    pos.setZ(i, z > 0 ? z * 0.88 : z * 0.36);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** White sleeve that continues the pec wrap down the arm. */
export function createDeltoid(side: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.06, rx: 0.064, rzFront: 0.07, rzBack: 0.024, power: 0.5 },
    { y: 0.004, rx: 0.058, rzFront: 0.064, rzBack: 0.022, power: 0.5 },
    { y: -0.06, rx: 0.05, rzFront: 0.054, rzBack: 0.02, power: 0.5 },
    { y: -0.128, rx: 0.046, rzFront: 0.048, rzBack: 0.018, power: 0.5, lip: 0.9 },
  ];
  const geo = loftArmor(rings, 36);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    if (x * side < 0) {
      pos.setX(i, x - side * (0.034 + Math.max(0, y) * 1.0));
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

/** Fitted quad: D-section, flat inner, anterior bulk. Not a pipe or a hip blade. */
export function createThighShell(length: number, side: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const quad = Math.exp(-(((t - 0.4) / 0.26) ** 2));
    rings.push({
      y: -t * length,
      rx: 0.07 + quad * 0.03 - t * 0.01,
      rzFront: (t < 0.1 ? 0.04 : 0.088) + quad * 0.1 - t * 0.008,
      rzBack: 0.014 + quad * 0.008,
      ridge: 0.006 * quad,
      lip: i === 0 ? 0.32 : i === steps ? 0.88 : 1,
      power: 0.4,
    });
  }
  const geo = loftArmor(rings, 36, "none");
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    if (x * side < 0) pos.setX(i, x * 0.48);
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
      rx: 0.06 - t * 0.01,
      rzFront: 0.145 - t * 0.028,
      rzBack: 0.018 - t * 0.004,
      ridge: 0.006 * ridge,
      lip: i === 0 || i === steps ? 0.88 : 1,
      power: 0.48,
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

/** Organic palm volume. Not a rectangular block. */
export function createPalm(): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.008, rx: 0.03, rzFront: 0.02, rzBack: 0.016, power: 0.68, lip: 0.86 },
    { y: -0.022, rx: 0.042, rzFront: 0.028, rzBack: 0.02, power: 0.6 },
    { y: -0.05, rx: 0.046, rzFront: 0.032, rzBack: 0.02, power: 0.56 },
    { y: -0.078, rx: 0.038, rzFront: 0.026, rzBack: 0.016, power: 0.6, lip: 0.88 },
  ];
  return loftArmor(rings, 22, "both");
}

/** Finger with knuckle and tip. Planted in the palm, long enough to read as a digit. */
export function createFinger(length: number, width: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0, rx: width * 0.48, rzFront: width * 0.64, rzBack: width * 0.4, power: 0.56, lip: 0.9 },
    { y: -length * 0.28, rx: width * 0.54, rzFront: width * 0.78, rzBack: width * 0.44, power: 0.5 },
    { y: -length * 0.55, rx: width * 0.46, rzFront: width * 0.66, rzBack: width * 0.36, power: 0.52 },
    { y: -length * 0.8, rx: width * 0.4, rzFront: width * 0.56, rzBack: width * 0.3, power: 0.54 },
    { y: -length, rx: width * 0.3, rzFront: width * 0.42, rzBack: width * 0.22, power: 0.58, lip: 0.8 },
  ];
  return loftArmor(rings, 16, "both");
}

