import * as THREE from "three";

/** Seamless visor-skull: tall ovoid, flattened face, no plates or sockets. */
export function createVisorSkull(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.0, -0.116),
    new THREE.Vector2(0.018, -0.115),
    new THREE.Vector2(0.036, -0.11),
    new THREE.Vector2(0.052, -0.098),
    new THREE.Vector2(0.066, -0.08),
    new THREE.Vector2(0.076, -0.056),
    new THREE.Vector2(0.082, -0.028),
    new THREE.Vector2(0.085, 0.002),
    new THREE.Vector2(0.084, 0.032),
    new THREE.Vector2(0.078, 0.06),
    new THREE.Vector2(0.068, 0.084),
    new THREE.Vector2(0.052, 0.104),
    new THREE.Vector2(0.032, 0.118),
    new THREE.Vector2(0.012, 0.128),
    new THREE.Vector2(0.0, 0.132),
  ];
  const geo = new THREE.LatheGeometry(profile, 64);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const z = pos.getZ(i);
    pos.setZ(i, z > 0 ? z * 0.7 : z * 0.86);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Wide, shallow pectoral plate — not a sphere. */
export function createPecShell(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.05, 0.0),
    new THREE.Vector2(0.1, 0.02),
    new THREE.Vector2(0.15, 0.055),
    new THREE.Vector2(0.178, 0.105),
    new THREE.Vector2(0.188, 0.16),
    new THREE.Vector2(0.185, 0.21),
    new THREE.Vector2(0.16, 0.252),
    new THREE.Vector2(0.11, 0.28),
    new THREE.Vector2(0.058, 0.295),
    new THREE.Vector2(0.026, 0.302),
  ];
  const geo = new THREE.LatheGeometry(profile, 48);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    pos.setZ(i, pos.getZ(i) * 0.38);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Low shoulder cap that sits on the joint, not a bowling ball. */
export function createPauldron(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.6);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    pos.setXYZ(i, pos.getX(i) * 0.102, pos.getY(i) * 0.034, pos.getZ(i) * 0.09);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Tapered flattened-oval limb plate with a scooped back and hard end lips. */
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
      if (z < 0) z *= 0.48;
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
