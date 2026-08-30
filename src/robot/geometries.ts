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

/**
 * Pectoral volume with front depth. The collar is front-only so the
 * neck is not wrapped in a white ring; the lower pec still has a back.
 * Sides stay wide through the deltoid line so pec and shoulder read as
 * one mass, not a T of boxes.
 */
export function createPecShell(): THREE.BufferGeometry {
  const segsV = 24;
  const segsU = 48;
  const cols = segsU + 1;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= segsV; iy += 1) {
    const t = iy / segsV;
    const y = t * 0.32;
    let rMax = 0.1;
    if (t < 0.14) rMax = 0.1 + (t / 0.14) * 0.12;
    else if (t < 0.42) rMax = 0.22 + ((t - 0.14) / 0.28) * 0.055;
    else if (t < 0.88) rMax = 0.275;
    else rMax = 0.275 - ((t - 0.88) / 0.12) * 0.02;

    for (let ix = 0; ix <= segsU; ix += 1) {
      const a = (ix / segsU) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      let r = rMax;
      if (t > 0.76 && sin < 0) {
        const lift = (t - 0.76) / 0.24;
        r *= 1 - lift * 0.9;
      }
      const x = r * cos;
      let z = r * sin * 0.52;
      if (z > 0) z *= 1.12;
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

/** Deltoid + upper-arm start as one rounded mass that dumps down the arm. */
export function createDeltoid(): THREE.BufferGeometry {
  const radial = 32;
  const rings = 14;
  const cols = radial + 1;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= rings; i += 1) {
    const t = i / rings;
    const y = 0.055 - t * 0.24;
    const rx = 0.138 - t * 0.055;
    const rz = 0.11 - t * 0.04;
    for (let j = 0; j <= radial; j += 1) {
      const a = (j / radial) * Math.PI * 2;
      const x = rx * Math.cos(a);
      let z = rz * Math.sin(a);
      if (z < 0) z *= 0.55;
      else z *= 1.08;
      positions.push(x, y, z);
    }
  }

  for (let i = 0; i < rings; i += 1) {
    for (let j = 0; j < radial; j += 1) {
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

/** Flattened-oval limb plate with real thickness, scooped back, hard lips. */
export function createLimbShell(
  length: number,
  rxTop: number,
  rxBot: number,
  rz: number,
): THREE.BufferGeometry {
  const radial = 28;
  const rings = 12;
  const cols = radial + 1;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= rings; i += 1) {
    const t = i / rings;
    const y = -t * length;
    const lip = i === 0 || i === rings ? 0.88 : 1;
    const rx = (rxTop + (rxBot - rxTop) * t) * lip;
    const rzi = rz * lip;
    for (let j = 0; j <= radial; j += 1) {
      const a = (j / radial) * Math.PI * 2;
      const x = rx * Math.cos(a);
      let z = rzi * Math.sin(a);
      const mid = 1 - Math.abs(t - 0.38) * 1.4;
      if (z > 0) z *= 1.55 + Math.max(0, mid) * 0.35;
      else z *= 0.48;
      positions.push(x, y, z);
    }
  }

  stitchLoft(positions, indices, rings, cols, radial, length);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * D-shaped thigh: wide sides, scooped back, anterior plate about as
 * deep as the pec. Flattened front so the side still is a cap, not a pipe.
 */
export function createThighShell(length: number): THREE.BufferGeometry {
  const radial = 32;
  const rings = 16;
  const cols = radial + 1;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= rings; i += 1) {
    const t = i / rings;
    const y = -t * length;
    const lip = i === 0 || i === rings ? 0.9 : 1;
    const rx = (0.108 - t * 0.028) * lip;
    const quad = Math.exp(-(((t - 0.3) / 0.26) ** 2));
    const rzFront = (0.142 + quad * 0.028) * lip;
    const rzBack = 0.052 * lip;
    for (let j = 0; j <= radial; j += 1) {
      const a = (j / radial) * Math.PI * 2;
      const s = Math.sin(a);
      const x = rx * Math.cos(a);
      const z = s >= 0 ? rzFront * s ** 0.5 : rzBack * s;
      positions.push(x, y, z);
    }
  }

  stitchLoft(positions, indices, rings, cols, radial, length);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Shin with a tibial ridge. Same D idea, smaller than the thigh.
 */
export function createShinShell(length: number): THREE.BufferGeometry {
  const radial = 28;
  const rings = 14;
  const cols = radial + 1;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= rings; i += 1) {
    const t = i / rings;
    const y = -t * length;
    const lip = i === 0 || i === rings ? 0.9 : 1;
    const rx = (0.086 - t * 0.02) * lip;
    const ridge = 1 + Math.max(0, 1 - Math.abs(t - 0.4) * 2) * 0.18;
    const rzFront = 0.1 * ridge * lip;
    const rzBack = 0.042 * lip;
    for (let j = 0; j <= radial; j += 1) {
      const a = (j / radial) * Math.PI * 2;
      const s = Math.sin(a);
      const x = rx * Math.cos(a);
      const z = s >= 0 ? rzFront * s ** 0.55 : rzBack * s;
      positions.push(x, y, z);
    }
  }

  stitchLoft(positions, indices, rings, cols, radial, length);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * One white dorsal mitten: palm back plus four finger lobes. Reads as a
 * hand from studio distance, not a postage-stamp plate with black nubs.
 */
export function createMittenDorsal(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const half = 0.058;
  shape.moveTo(-half * 0.84, 0.012);
  shape.lineTo(-half, -0.055);
  shape.lineTo(-half * 1.04, -0.13);

  const tips = [-0.0435, -0.0145, 0.0145, 0.0435];
  const tipY = -0.198;
  const tipR = 0.015;
  for (const x of tips) {
    shape.lineTo(x - tipR, tipY + tipR * 0.35);
    shape.absarc(x, tipY, tipR, Math.PI, 0, false);
  }

  shape.lineTo(half * 1.04, -0.13);
  shape.lineTo(half, -0.055);
  shape.lineTo(half * 0.84, 0.012);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.024,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 12,
  });
  geo.computeVertexNormals();
  return geo;
}

function stitchLoft(
  positions: number[],
  indices: number[],
  rings: number,
  cols: number,
  radial: number,
  length: number,
): void {
  for (let i = 0; i < rings; i += 1) {
    for (let j = 0; j < radial; j += 1) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const topCenter = positions.length / 3;
  positions.push(0, 0, 0);
  const botCenter = positions.length / 3;
  positions.push(0, -length, 0);
  for (let j = 0; j < radial; j += 1) {
    indices.push(topCenter, j, j + 1);
    const b = rings * cols + j;
    indices.push(botCenter, b + 1, b);
  }
}
