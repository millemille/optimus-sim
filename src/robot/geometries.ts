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
 * One filled pec-and-deltoid. The loft of ovals went to z≈0 at
 * the sides, so the front camera saw a vest above two arm tubes.
 * This is the XY silhouette of pec + round shoulder + sleeve
 * dump, extruded so that row is a real front face. Not a loft,
 * not a pauldron ball, not a T-shelf. Back is flattened.
 */
export function createPecShell(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.256);
  shape.bezierCurveTo(0.034, 0.258, 0.058, 0.276, 0.092, 0.27);
  shape.bezierCurveTo(0.16, 0.26, 0.252, 0.24, 0.338, 0.224);
  shape.bezierCurveTo(0.378, 0.214, 0.388, 0.196, 0.372, 0.174);
  shape.bezierCurveTo(0.352, 0.152, 0.312, 0.128, 0.262, 0.102);
  shape.bezierCurveTo(0.214, 0.074, 0.16, 0.03, 0, 0.014);
  shape.bezierCurveTo(-0.16, 0.03, -0.214, 0.074, -0.262, 0.102);
  shape.bezierCurveTo(-0.312, 0.128, -0.352, 0.152, -0.372, 0.174);
  shape.bezierCurveTo(-0.388, 0.196, -0.378, 0.214, -0.338, 0.224);
  shape.bezierCurveTo(-0.252, 0.24, -0.16, 0.26, -0.092, 0.27);
  shape.bezierCurveTo(-0.058, 0.276, -0.034, 0.258, 0, 0.256);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.088,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.007,
    bevelSegments: 2,
    curveSegments: 28,
    steps: 1,
  });
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z0 = pos.getZ(i);
    const t = THREE.MathUtils.clamp(z0 / 0.1, 0, 1);
    const ax = Math.abs(x);
    const pec = Math.exp(-(x * x) / 0.03) * Math.exp(-((y - 0.11) ** 2) / 0.014);
    const del = THREE.MathUtils.smoothstep(0.22, 0.38, ax);
    const zFront = 0.052 + pec * 0.034 - del * 0.016;
    pos.setZ(i, THREE.MathUtils.lerp(0.006, zFront, t));
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
    pos.setX(i, pos.getX(i) * 0.72);
    pos.setZ(i, z > 0 ? z * 0.64 : z * 0.38);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Fitted black waist from pec hem down to the hips. Not a hollow cage. */
export function createMidriff(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.186, 0.108),
    new THREE.Vector2(0.166, 0.068),
    new THREE.Vector2(0.148, 0.024),
    new THREE.Vector2(0.14, -0.02),
    new THREE.Vector2(0.144, -0.064),
    new THREE.Vector2(0.154, -0.108),
    new THREE.Vector2(0.164, -0.152),
  ];
  const geo = new THREE.LatheGeometry(profile, 32);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    pos.setZ(i, z > 0 ? z * 0.82 : z * 0.55);
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

/** One finger volume. Oval section, not a plate, hoop, or sphere cluster. */
export function createFinger(length: number, width: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0, rx: width * 0.48, rzFront: width * 0.44, rzBack: width * 0.4, power: 0.72, lip: 0.9 },
    { y: -length * 0.5, rx: width * 0.54, rzFront: width * 0.5, rzBack: width * 0.42, power: 0.68 },
    { y: -length, rx: width * 0.4, rzFront: width * 0.36, rzBack: width * 0.3, power: 0.72, lip: 0.86 },
  ];
  return loftArmor(rings, 18, "both");
}

