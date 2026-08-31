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
 * Showroom chest plate: one white shield, V-collar, slight pec camber,
 * taper into the waist. Not a wrap into the arms and not two spheres.
 */
export function createPecShell(): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.305, rx: 0.086, rzFront: 0.05, rzBack: 0.03, power: 0.72, lip: 0.94 },
    { y: 0.268, rx: 0.176, rzFront: 0.072, rzBack: 0.036, power: 0.6 },
    { y: 0.22, rx: 0.216, rzFront: 0.094, rzBack: 0.042, power: 0.5 },
    { y: 0.155, rx: 0.212, rzFront: 0.112, rzBack: 0.044, power: 0.46 },
    { y: 0.08, rx: 0.188, rzFront: 0.096, rzBack: 0.038, power: 0.5 },
    { y: 0.02, rx: 0.158, rzFront: 0.076, rzBack: 0.032, power: 0.55 },
    { y: -0.04, rx: 0.132, rzFront: 0.058, rzBack: 0.026, power: 0.6, lip: 0.94 },
  ];
  const geo = loftArmor(rings, 48);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    // V-neck: drop the top-front center so the black neck reads through.
    if (y > 0.22 && z > 0.01) {
      const across = 1 - Math.min(1, Math.abs(x) / 0.13);
      const down = (y - 0.22) / 0.09;
      const v = across * across * down;
      pos.setY(i, y - v * 0.078);
      pos.setZ(i, z - v * 0.028);
    }
    // Soft center valley between pecs, not two balloons.
    if (z > 0.04 && y > 0.06 && y < 0.22) {
      const valley = Math.exp(-(x * x) / 0.004) * Math.exp(-((y - 0.15) ** 2) / 0.012);
      pos.setZ(i, z - valley * 0.012);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Beveled front shield that gives Optimus its recognizable clean chest face. */
export function createChestFace(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.128, 0.285);
  shape.lineTo(-0.19, 0.22);
  shape.lineTo(-0.184, 0.09);
  shape.lineTo(-0.145, -0.025);
  shape.lineTo(-0.082, -0.05);
  shape.lineTo(0, -0.056);
  shape.lineTo(0.082, -0.05);
  shape.lineTo(0.145, -0.025);
  shape.lineTo(0.184, 0.09);
  shape.lineTo(0.19, 0.22);
  shape.lineTo(0.128, 0.285);
  shape.lineTo(0.054, 0.3);
  shape.lineTo(0, 0.258);
  shape.lineTo(-0.054, 0.3);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.014,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.008,
    bevelThickness: 0.006,
    curveSegments: 8,
  });
  geo.translate(0, 0, -0.007);
  geo.computeVertexNormals();
  return geo;
}

/** White shoulder-blade shell seen in rear and three-quarter views. */
export function createBackShell(): THREE.BufferGeometry {
  const rings: ArmorRing[] = [
    { y: 0.28, rx: 0.105, rzFront: 0.025, rzBack: 0.048, power: 0.7, lip: 0.9 },
    { y: 0.22, rx: 0.19, rzFront: 0.034, rzBack: 0.064, power: 0.62 },
    { y: 0.13, rx: 0.2, rzFront: 0.038, rzBack: 0.072, power: 0.58 },
    { y: 0.04, rx: 0.17, rzFront: 0.03, rzBack: 0.06, power: 0.62 },
    { y: -0.03, rx: 0.13, rzFront: 0.024, rzBack: 0.046, power: 0.68, lip: 0.92 },
  ];
  const geo = loftArmor(rings, 40);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    if (z > 0) pos.setZ(i, z * 0.32);
    // Shallow center channel keeps the rear from reading as one plastic blob.
    if (z < 0) {
      const channel = Math.exp(-(x * x) / 0.0025);
      pos.setZ(i, z + channel * 0.014);
    }
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
    pos.setX(i, pos.getX(i) * 0.78);
    pos.setZ(i, z > 0 ? z * 0.62 : z * 0.4);
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
    const z = pos.getZ(i);
    pos.setZ(i, z > 0 ? z * 0.72 : z * 0.42);
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
      rzBack: rz * 0.28,
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
    if (x * side < 0) pos.setX(i, x * 0.55);
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
  return loftArmor(rings, 28, "both");
}

/** Rear calf fairing, narrower than the front shin with room for link rods. */
export function createCalfShell(length: number): THREE.BufferGeometry {
  const rings: ArmorRing[] = [];
  const steps = 10;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const calf = Math.exp(-(((t - 0.38) / 0.3) ** 2));
    rings.push({
      y: -t * length,
      rx: 0.042 + calf * 0.012 - t * 0.006,
      rzFront: 0.016,
      rzBack: 0.038 + calf * 0.028,
      power: 0.62,
      lip: i === 0 || i === steps ? 0.88 : 1,
    });
  }
  return loftArmor(rings, 24, "both");
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
