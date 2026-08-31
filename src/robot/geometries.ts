import * as THREE from "three";

/**
 * Motorcycle-visor skull. Glossy black oval, wider than tall, no face.
 * Matches the 2024–2025 Tesla Optimus showroom head.
 */
export function createVisorSkull(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 64, 40);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const crown = 1 - 0.08 * Math.max(0, y);
    pos.setX(i, x * 0.096 * crown);
    pos.setY(i, y * 0.122);
    // The real visor has a shallow face and a fuller helmet at the rear.
    const front = z > 0 ? 0.068 : 0.082;
    const facePlane = z > 0 ? 0.006 * Math.pow(Math.abs(z), 3) : 0;
    pos.setZ(i, z * front - facePlane);
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
 * One continuous white torso shell: volumetric chest, integrated rear
 * scapula humps and spine channel. No floating back plates.
 */
export function createPecShell(): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.31, rx: 0.09, rzFront: 0.072, rzBack: 0.068, power: 0.66, lip: 0.92 },
    { y: 0.265, rx: 0.192, rzFront: 0.162, rzBack: 0.128, power: 0.46 },
    { y: 0.21, rx: 0.228, rzFront: 0.192, rzBack: 0.138, power: 0.42 },
    { y: 0.145, rx: 0.224, rzFront: 0.178, rzBack: 0.132, power: 0.4 },
    { y: 0.075, rx: 0.202, rzFront: 0.142, rzBack: 0.112, power: 0.44 },
    { y: 0.015, rx: 0.172, rzFront: 0.108, rzBack: 0.094, power: 0.48 },
    { y: -0.042, rx: 0.142, rzFront: 0.082, rzBack: 0.078, power: 0.52, lip: 0.94 },
  ];
  const geo = loftArmor(rings, 52);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // V-neck: shallow cut at the collar only — chest stays one solid curved plate.
    if (y > 0.24 && z > 0.04) {
      const across = 1 - Math.min(1, Math.abs(x) / 0.11);
      const down = (y - 0.24) / 0.07;
      const v = across * across * down;
      y -= v * 0.048;
      z -= v * 0.014;
    }

    // Showroom chest volume — forward camber, not a flat plate.
    if (z > 0.02 && y > 0.02 && y < 0.29) {
      const centerPec = Math.exp(-(x * x) / 0.038) * Math.exp(-((y - 0.15) ** 2) / 0.022);
      z += centerPec * 0.078;
      const lateralPec = Math.exp(-((Math.abs(x) - 0.108) ** 2) / 0.009) * Math.exp(-((y - 0.15) ** 2) / 0.022);
      z += lateralPec * 0.036;
    }

    // Wrap the sides around the body — avoids flat vertical slabs at the armpits.
    if (Math.abs(x) > 0.12 && y > 0.02 && y < 0.28) {
      const side = Math.min(1, (Math.abs(x) - 0.12) / 0.07);
      const band = Math.exp(-((y - 0.16) ** 2) / 0.028);
      z -= side * band * 0.078;
    }

    // Integrated rear anatomy — continuous scapula swell, no spine gap.
    if (z < -0.004 && y > 0.05 && y < 0.29) {
      const ax = Math.abs(x);
      const scapula =
        Math.exp(-((ax - 0.096) ** 2) / 0.0052) * Math.exp(-((y - 0.17) ** 2) / 0.026);
      z -= scapula * 0.028;
      // Keep center back flush so the black thorax does not read as a detached strip.
      if (ax < 0.055) {
        z -= 0.012 * Math.exp(-((y - 0.16) ** 2) / 0.03);
      }
    }

    pos.setX(i, x);
    pos.setY(i, y);
    pos.setZ(i, z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Black core under the white plate. Visible at the V-neck and armpits. */
export function createThorax(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.072, 0.3),
    new THREE.Vector2(0.118, 0.22),
    new THREE.Vector2(0.132, 0.12),
    new THREE.Vector2(0.12, 0.04),
    new THREE.Vector2(0.104, -0.02),
  ];
  const geo = new THREE.LatheGeometry(profile, 28);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    pos.setX(i, pos.getX(i) * 0.76);
    pos.setZ(i, z > 0 ? z * 0.68 : z * 0.44);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Short black waist belt. Cinches. Does not become a fridge torso. */
export function createMidriff(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.122, 0.028),
    new THREE.Vector2(0.114, 0.004),
    new THREE.Vector2(0.11, -0.022),
    new THREE.Vector2(0.118, -0.048),
  ];
  const geo = new THREE.LatheGeometry(profile, 28);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    pos.setZ(i, z > 0 ? z * 0.78 : z * 0.5);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Circular waist medallion. Blank disc — no wordmark. */
export function createWaistBuckle(): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(0.028, 0.028, 0.012, 24);
  geo.rotateX(Math.PI / 2);
  return geo;
}

/** Compact black mechanical pelvis. Hips stay exposed, not covered by shorts. */
export function createPelvis(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.108, 0.065),
    new THREE.Vector2(0.116, 0.025),
    new THREE.Vector2(0.108, -0.018),
    new THREE.Vector2(0.086, -0.062),
    new THREE.Vector2(0.062, -0.1),
  ];
  const geo = new THREE.LatheGeometry(profile, 28);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i);
    pos.setZ(i, z > 0 ? z * 0.72 : z * 0.42);
    // Integrated sacrum fairing — no floating rear plate.
    if (z < 0 && y > -0.04 && y < 0.04) {
      const sacrum = Math.exp(-(x * x) / 0.004) * Math.exp(-((y + 0.01) ** 2) / 0.0025);
      z -= sacrum * 0.018;
      pos.setZ(i, z);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Slim black fill between the hip motors. Not a white brief. */
export function createCrotchGuard(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.058, 0.045),
    new THREE.Vector2(0.06, 0.005),
    new THREE.Vector2(0.052, -0.038),
    new THREE.Vector2(0.04, -0.08),
    new THREE.Vector2(0.03, -0.12),
  ];
  const geo = new THREE.LatheGeometry(profile, 20);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    pos.setZ(i, z > 0 ? z * 0.7 : z * 0.32);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Rounded white shoulder cap. Sits on the joint, does not wrap the pec. */
export function createShoulderCap(side: number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.058, 28, 18);
  geo.scale(1.16, 0.82, 1.06);
  geo.rotateZ(side * -0.18);
  geo.translate(side * 0.008, 0, 0.004);
  geo.computeVertexNormals();
  return geo;
}

/** Short white upper-arm sleeve under the cap. */
export function createDeltoid(side: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.02, rx: 0.052, rzFront: 0.056, rzBack: 0.03, power: 0.55, lip: 0.92 },
    { y: -0.04, rx: 0.05, rzFront: 0.054, rzBack: 0.026, power: 0.52 },
    { y: -0.1, rx: 0.046, rzFront: 0.05, rzBack: 0.022, power: 0.5, lip: 0.9 },
  ];
  const geo = loftArmor(rings, 28);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    if (x * side < 0) pos.setX(i, x * 0.72);
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
      rzFront: rz * (1.05 + mid * 0.18),
      rzBack: rz * (0.42 + mid * 0.12),
      ridge: 0.003 * mid,
      lip: i === 0 || i === steps ? 0.88 : 1,
      power: 0.5,
    });
  }
  return loftArmor(rings, 28);
}

/** Quad plate: front and outer side, flatter inner. */
export function createThighShell(length: number, side: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const quad = Math.exp(-(((t - 0.38) / 0.28) ** 2));
    rings.push({
      y: -t * length,
      rx: 0.068 + quad * 0.016 - t * 0.01,
      rzFront: 0.07 + quad * 0.03 - t * 0.008,
      rzBack: 0.02 + quad * 0.006,
      ridge: 0.004 * quad,
      lip: i === 0 ? 0.86 : i === steps ? 0.88 : 1,
      power: 0.48,
    });
  }
  const geo = loftArmor(rings, 36, "both");
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i);
    if (x * side < 0) pos.setX(i, x * 0.55);
    // Rear hamstring swell integrated into the thigh shell, not a floating plate.
    if (z < -0.004 && y < -0.04 && y > -0.3) {
      const ham = Math.exp(-((y + 0.16) ** 2) / 0.042) * Math.exp(-(x * x) / 0.014);
      z -= ham * 0.024;
      pos.setZ(i, z);
    }
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
      rx: 0.052 - t * 0.008,
      rzFront: 0.072 - t * 0.012,
      rzBack: 0.02 - t * 0.004,
      ridge: 0.004 * ridge,
      lip: i === 0 || i === steps ? 0.88 : 1,
      power: 0.5,
    });
  }
  const geo = loftArmor(rings, 28, "both");
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    let z = pos.getZ(i);
    // Integrated rear calf fairing — no separate floating back plate.
    if (z < -0.004) {
      const calf = Math.exp(-((y + 0.12) ** 2) / 0.028);
      z -= calf * 0.02;
      pos.setZ(i, z);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** White kneecap on the front of the joint. */
export function createKneeCap(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.042, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.68);
  geo.scale(1.15, 0.68, 0.78);
  geo.rotateX(-0.38);
  geo.computeVertexNormals();
  return geo;
}

/** Black showroom boot. Flat sole, rounded toe. */
export function createBoot(): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.02, rx: 0.036, rzFront: 0.048, rzBack: 0.04, power: 0.7, lip: 0.9 },
    { y: -0.008, rx: 0.042, rzFront: 0.086, rzBack: 0.05, power: 0.6 },
    { y: -0.03, rx: 0.046, rzFront: 0.118, rzBack: 0.054, power: 0.56 },
    { y: -0.048, rx: 0.04, rzFront: 0.102, rzBack: 0.046, power: 0.64, lip: 0.92 },
  ];
  const geo = loftArmor(rings, 24, "both");
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    if (z > 0) pos.setZ(i, z * 1.22);
  }
  pos.needsUpdate = true;
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
