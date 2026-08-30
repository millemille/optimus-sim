import * as THREE from "three";

/** Motorcycle-visor skull: wider than tall, one black mesh, no sockets. */
export function createVisorSkull(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.0, -0.064),
    new THREE.Vector2(0.034, -0.062),
    new THREE.Vector2(0.068, -0.052),
    new THREE.Vector2(0.096, -0.034),
    new THREE.Vector2(0.114, -0.012),
    new THREE.Vector2(0.122, 0.01),
    new THREE.Vector2(0.12, 0.03),
    new THREE.Vector2(0.108, 0.048),
    new THREE.Vector2(0.088, 0.062),
    new THREE.Vector2(0.058, 0.072),
    new THREE.Vector2(0.028, 0.078),
    new THREE.Vector2(0.0, 0.082),
  ];
  const geo = new THREE.LatheGeometry(profile, 64);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setX(i, x * 1.12);
    pos.setZ(i, z > 0 ? z * 0.42 : z * 0.5);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Athletic pec plate: wide and shallow. The back collapses at the collar
 * so a lathe does not form a white donut around the neck.
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
    let rMax = 0.072;
    if (t < 0.18) rMax = 0.072 + (t / 0.18) * 0.1;
    else if (t < 0.58) rMax = 0.172 + ((t - 0.18) / 0.4) * 0.04;
    else if (t < 0.84) rMax = 0.212 - ((t - 0.58) / 0.26) * 0.028;
    else rMax = 0.184 - ((t - 0.84) / 0.16) * 0.06;

    for (let ix = 0; ix <= segsU; ix += 1) {
      const a = (ix / segsU) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      let r = rMax;
      if (t > 0.48) {
        const lift = (t - 0.48) / 0.52;
        const frontness = Math.max(0, sin);
        r *= (1 - lift) + lift * frontness;
      }
      const x = r * cos;
      let z = r * sin * 0.2;
      if (z > 0) z *= 0.78;
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

/** Shoulder shell that dumps down onto the upper arm. */
export function createPauldron(): THREE.BufferGeometry {
  const radial = 26;
  const rings = 10;
  const cols = radial + 1;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= rings; i += 1) {
    const t = i / rings;
    const y = -t * 0.1;
    const rx = 0.074 - t * 0.024;
    const rz = 0.056 - t * 0.03;
    for (let j = 0; j <= radial; j += 1) {
      const a = (j / radial) * Math.PI * 2;
      const x = rx * Math.cos(a);
      let z = rz * Math.sin(a);
      if (z < 0) z *= 0.55;
      let yy = y;
      if (t < 0.35) yy += (1 - t / 0.35) * 0.012 * Math.max(0, Math.sin(a));
      positions.push(x, yy, z);
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

/** Flattened-oval limb plate, scooped back, hard panel lips at the joints. */
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
    const lip = i === 0 || i === rings ? 0.84 : 1;
    const rx = (rxTop + (rxBot - rxTop) * t) * lip;
    const rzi = rz * lip;
    for (let j = 0; j <= radial; j += 1) {
      const a = (j / radial) * Math.PI * 2;
      const x = rx * Math.cos(a);
      let z = rzi * Math.sin(a);
      if (z < 0) z *= 0.42;
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
