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
 * One pec-to-arm wrap. Collar stays narrow. Width holds ~0.40
 * from the deltoid down through the armpit so the front camera
 * cannot see a hole between pec and sleeve. Hem is a pec cut
 * in the center only. No separate caps.
 */
export function createPecShell(): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.292, rx: 0.104, rzFront: 0.05, rzBack: 0.028, power: 0.5 },
    { y: 0.26, rx: 0.168, rzFront: 0.068, rzBack: 0.03, power: 0.48 },
    { y: 0.234, rx: 0.268, rzFront: 0.08, rzBack: 0.03, power: 0.46 },
    { y: 0.214, rx: 0.348, rzFront: 0.086, rzBack: 0.03, power: 0.44 },
    { y: 0.196, rx: 0.398, rzFront: 0.084, rzBack: 0.028, power: 0.42 },
    { y: 0.172, rx: 0.388, rzFront: 0.09, rzBack: 0.026, power: 0.44 },
    { y: 0.146, rx: 0.372, rzFront: 0.1, rzBack: 0.026, power: 0.44, ridge: 0.006 },
    { y: 0.118, rx: 0.338, rzFront: 0.108, rzBack: 0.024, power: 0.46, ridge: 0.008 },
    { y: 0.086, rx: 0.246, rzFront: 0.1, rzBack: 0.024, power: 0.48, ridge: 0.01 },
    { y: 0.048, rx: 0.198, rzFront: 0.07, rzBack: 0.022, power: 0.5 },
    { y: 0.008, rx: 0.172, rzFront: 0.046, rzBack: 0.02, power: 0.5, lip: 0.9 },
  ];
  const geo = loftArmor(rings, 48, "none");
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    if (y > 0.23) {
      const u = Math.exp(-((x / 0.09) ** 2)) * ((y - 0.23) / 0.062);
      y -= u * 0.038;
    }
    if (Math.abs(x) > 0.36 && y > 0.12) {
      const t = Math.min(1, (Math.abs(x) - 0.36) / 0.04);
      y -= t * 0.022;
    }
    if (y < 0.045 && Math.abs(x) < 0.2) {
      const t = Math.min(1, Math.abs(x) / 0.2);
      y += t * t * 0.03;
    }
    if (Math.abs(x) > 0.22 && y > 0.1 && y < 0.22 && z > -0.012) {
      z = Math.max(z, 0.05);
    }
    if (z > 0 && Math.abs(x) < 0.2) {
      const pec = Math.exp(-(x * x) / 0.026) * Math.exp(-((y - 0.12) ** 2) / 0.01);
      z += pec * 0.014;
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

/** White sleeve that grows up into the pec wrap. Not a pauldron ball. */
export function createDeltoid(side: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.082, rx: 0.06, rzFront: 0.068, rzBack: 0.028, power: 0.48 },
    { y: 0.028, rx: 0.056, rzFront: 0.062, rzBack: 0.026, power: 0.5 },
    { y: -0.05, rx: 0.05, rzFront: 0.054, rzBack: 0.022, power: 0.5 },
    { y: -0.128, rx: 0.046, rzFront: 0.048, rzBack: 0.02, power: 0.5, lip: 0.9 },
  ];
  const geo = loftArmor(rings, 36);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    if (x * side < 0) {
      const towardPec = y > 0 ? 0.55 + (y / 0.082) * 0.7 : 0.4;
      pos.setX(i, x * towardPec);
    }
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
      rzFront: 0.016 + quad * 0.128 - t * 0.006,
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
    { y: 0, rx: width * 0.78, rzFront: width * 1.15, rzBack: width * 0.42, power: 0.48, lip: 0.9 },
    { y: -length * 0.48, rx: width * 1.08, rzFront: width * 1.45, rzBack: width * 0.48, power: 0.46 },
    { y: -length, rx: width * 0.72, rzFront: width * 1.05, rzBack: width * 0.36, power: 0.48, lip: 0.86 },
  ];
  return loftArmor(rings, 20, "both");
}

