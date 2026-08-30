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
 */
export function createPecShell(): THREE.BufferGeometry {
  const segsV = 22;
  const segsU = 44;
  const cols = segsU + 1;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= segsV; iy += 1) {
    const t = iy / segsV;
    const y = t * 0.3;
    let rMax = 0.08;
    if (t < 0.18) rMax = 0.08 + (t / 0.18) * 0.09;
    else if (t < 0.55) rMax = 0.17 + ((t - 0.18) / 0.37) * 0.03;
    else if (t < 0.8) rMax = 0.2 - ((t - 0.55) / 0.25) * 0.02;
    else rMax = 0.18 - ((t - 0.8) / 0.2) * 0.04;

    for (let ix = 0; ix <= segsU; ix += 1) {
      const a = (ix / segsU) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      let r = rMax;
      if (t > 0.7) {
        const lift = (t - 0.7) / 0.3;
        const frontness = Math.max(0, sin);
        r *= (1 - lift) + lift * Math.max(0.12, frontness);
      }
      const depth = t > 0.7 ? 0.36 : 0.42;
      const x = r * cos;
      let z = r * sin * depth;
      if (z > 0) z *= 1.05;
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

/** Rounded shoulder cap that dumps onto the upper arm — not a vertical box. */
export function createPauldron(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.62);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) * 0.088;
    const y = pos.getY(i) * 0.048;
    const z = pos.getZ(i) * 0.078;
    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate = true;
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
      if (z < 0) z *= 0.58;
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

  const topCenter = positions.length / 3;
  positions.push(0, 0, 0);
  const botCenter = positions.length / 3;
  positions.push(0, -length, 0);
  for (let j = 0; j < radial; j += 1) {
    indices.push(topCenter, j, j + 1);
    const b = rings * cols + j;
    indices.push(botCenter, b + 1, b);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
