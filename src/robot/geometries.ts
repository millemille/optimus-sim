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
 * One pec-to-arm wrap. The pec body stays chest-width. Width
 * only reaches ~0.40 in a short shoulder band so the deltoid
 * sits on the arm, fills the old vest/ball gap, and does not
 * hang as a shelf. Hem is a pec cut. No sphere lobes.
 */
export function createPecShell(): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.292, rx: 0.104, rzFront: 0.05, rzBack: 0.028, power: 0.5 },
    { y: 0.258, rx: 0.166, rzFront: 0.07, rzBack: 0.03, power: 0.48 },
    { y: 0.232, rx: 0.242, rzFront: 0.084, rzBack: 0.03, power: 0.46 },
    { y: 0.214, rx: 0.318, rzFront: 0.088, rzBack: 0.03, power: 0.44 },
    { y: 0.198, rx: 0.4, rzFront: 0.082, rzBack: 0.028, power: 0.42 },
    { y: 0.178, rx: 0.356, rzFront: 0.09, rzBack: 0.026, power: 0.44 },
    { y: 0.152, rx: 0.248, rzFront: 0.116, rzBack: 0.028, power: 0.46, ridge: 0.01 },
    { y: 0.11, rx: 0.228, rzFront: 0.12, rzBack: 0.026, power: 0.46, ridge: 0.012 },
    { y: 0.068, rx: 0.206, rzFront: 0.078, rzBack: 0.024, power: 0.48 },
    { y: 0.028, rx: 0.182, rzFront: 0.052, rzBack: 0.022, power: 0.5 },
    { y: -0.006, rx: 0.164, rzFront: 0.038, rzBack: 0.02, power: 0.5, lip: 0.9 },
  ];
  const geo = loftArmor(rings, 48, "none");
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    if (y > 0.228) {
      const u = Math.exp(-((x / 0.09) ** 2)) * ((y - 0.228) / 0.064);
      y -= u * 0.04;
    }
    if (Math.abs(x) > 0.26 && y > 0.1) {
      const t = Math.min(1, (Math.abs(x) - 0.26) / 0.14);
      y -= t * 0.05;
    }
    if (y < 0.05) {
      const t = Math.min(1, Math.abs(x) / 0.18);
      y += t * t * 0.044;
    }
    if (z > 0) {
      const pec = Math.exp(-(x * x) / 0.028) * Math.exp(-((y - 0.128) ** 2) / 0.01);
      z += pec * 0.016;
    }
    pos.setY(i, y);
    pos.setZ(i, z);
  }
  pos.needsUpdate = true;
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
    pos.setZ(i, z > 0 ? z * 0.72 : z * 0.7);
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
    const quad = Math.exp(-(((t - 0.46) / 0.2) ** 2));
    rings.push({
      y: -t * length,
      rx: 0.062 + quad * 0.014 - t * 0.008,
      rzFront: 0.032 + quad * 0.14 - t * 0.006,
      rzBack: 0.014 + quad * 0.006 - t * 0.002,
      ridge: 0.005 * quad,
      lip: i === 0 || i === steps ? 0.9 : 1,
      power: 0.44,
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
      rx: 0.042 - t * 0.006,
      rzFront: 0.118 - t * 0.022,
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

/** White finger plate with volume, hanging down. Not a sphere cluster. */
export function createFingerPhalanx(length: number, width: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0, rx: width * 0.7, rzFront: width * 0.84, rzBack: width * 0.32, power: 0.5, lip: 0.9 },
    { y: -length * 0.48, rx: width, rzFront: width * 1.08, rzBack: width * 0.36, power: 0.48 },
    { y: -length, rx: width * 0.66, rzFront: width * 0.74, rzBack: width * 0.28, power: 0.5, lip: 0.86 },
  ];
  return loftArmor(rings, 18, "both");
}

