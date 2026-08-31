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
 * Pec and deltoid as one front shell. Every column across the
 * shoulder has z well in front of the thorax, so the camera
 * cannot see a hole. Width holds through the sleeve, then
 * dumps. No oval sides, no pauldron, no extruded card, no back
 * wings.
 */
export function createPecShell(): THREE.BufferGeometry {
  const rings = [
    { y: 0.266, rx: 0.098, zFront: 0.05, zSide: 0.038 },
    { y: 0.246, rx: 0.172, zFront: 0.06, zSide: 0.042 },
    { y: 0.228, rx: 0.3, zFront: 0.072, zSide: 0.05 },
    { y: 0.212, rx: 0.368, zFront: 0.08, zSide: 0.054 },
    { y: 0.196, rx: 0.388, zFront: 0.084, zSide: 0.056 },
    { y: 0.176, rx: 0.382, zFront: 0.082, zSide: 0.054 },
    { y: 0.152, rx: 0.36, zFront: 0.078, zSide: 0.05 },
    { y: 0.124, rx: 0.312, zFront: 0.074, zSide: 0.044 },
    { y: 0.09, rx: 0.232, zFront: 0.07, zSide: 0.038 },
    { y: 0.05, rx: 0.198, zFront: 0.058, zSide: 0.03 },
    { y: 0.012, rx: 0.17, zFront: 0.042, zSide: 0.022 },
  ];
  const segs = 40;
  const cols = segs + 1;
  const positions: number[] = [];
  const indices: number[] = [];

  for (const ring of rings) {
    for (let j = 0; j <= segs; j += 1) {
      const xn = (j / segs) * 2 - 1;
      let x = ring.rx * xn;
      let y = ring.y;
      let z = ring.zSide + (ring.zFront - ring.zSide) * (1 - xn * xn);
      if (y > 0.234) {
        const u = Math.exp(-((x / 0.078) ** 2)) * ((y - 0.234) / 0.032);
        y -= u * 0.034;
      }
      if (Math.abs(x) < 0.18) {
        const pec = Math.exp(-(x * x) / 0.028) * Math.exp(-((y - 0.11) ** 2) / 0.012);
        z += pec * 0.018;
      }
      if (Math.abs(x) > 0.33 && y > 0.15) {
        const t = Math.min(1, (Math.abs(x) - 0.33) / 0.06);
        y -= t * 0.018;
      }
      positions.push(x, y, z);
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

