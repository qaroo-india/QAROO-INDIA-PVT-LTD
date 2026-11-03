/**
 * Node/edge lattice for the wireframe net drawn over the hero globe.
 *
 * Nodes are spread with a Fibonacci lattice (even coverage, no polar bunching)
 * and each one is linked to its nearest neighbours, which produces the
 * triangulated net in the design reference. Both the lattice and the edge list
 * are computed once per node count and memoised - per frame the renderer only
 * projects the nodes and strokes the edges.
 */

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
/** Points sampled along each long-haul arc. */
export const ARC_SAMPLES = 16;
const cache = new Map();

/**
 * @param {number} count number of nodes on the sphere
 * @param {number} links neighbours each node reaches for
 * @returns {{nodes: Float32Array, edges: Uint16Array}} unit-sphere xyz triples
 *   and index pairs
 */
export function getSphereMesh(count = 112, links = 3) {
  const key = `${count}:${links}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const nodes = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * (i + 0.5)) / count;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * GOLDEN_ANGLE;
    nodes[i * 3] = r * Math.cos(theta);
    nodes[i * 3 + 1] = y;
    nodes[i * 3 + 2] = r * Math.sin(theta);
  }

  // Nearest-neighbour links. A Fibonacci lattice is ordered by latitude, so a
  // node's neighbours always sit within about sqrt(pi * count) indices of it;
  // searching a window that size instead of the whole set keeps this linear
  // enough to raise the node count without stalling the first frame.
  const window = Math.min(count, Math.ceil(2.5 * Math.sqrt(count)) + links);
  const seen = new Set();
  const pairs = [];
  const best = new Array(links);
  for (let i = 0; i < count; i++) {
    best.fill(-1);
    const dist = new Float64Array(links).fill(Infinity);
    const ax = nodes[i * 3];
    const ay = nodes[i * 3 + 1];
    const az = nodes[i * 3 + 2];

    const lo = Math.max(0, i - window);
    const hi = Math.min(count, i + window + 1);
    for (let j = lo; j < hi; j++) {
      if (j === i) continue;
      const dx = nodes[j * 3] - ax;
      const dy = nodes[j * 3 + 1] - ay;
      const dz = nodes[j * 3 + 2] - az;
      const d = dx * dx + dy * dy + dz * dz;
      for (let k = 0; k < links; k++) {
        if (d < dist[k]) {
          for (let m = links - 1; m > k; m--) {
            dist[m] = dist[m - 1];
            best[m] = best[m - 1];
          }
          dist[k] = d;
          best[k] = j;
          break;
        }
      }
    }

    for (let k = 0; k < links; k++) {
      const j = best[k];
      if (j < 0) continue;
      const lo = i < j ? i : j;
      const hi = i < j ? j : i;
      const id = lo * count + hi;
      if (seen.has(id)) continue;
      seen.add(id);
      pairs.push(lo, hi);
    }
  }

  // Long-haul arcs: great circles between distant nodes, lifted slightly off
  // the surface so they read as links over the globe rather than more net.
  // Endpoints are picked arithmetically, not randomly, so the figure is stable
  // across reloads and identical for every visitor.
  // Arcs are a feature line, not a function of node count - cap them.
  const arcCount = Math.max(6, Math.min(18, Math.round(count / 9)));
  const span = Math.floor(count * 0.42);
  const arcs = new Float32Array(arcCount * ARC_SAMPLES * 3);
  let w = 0;
  for (let a = 0; a < arcCount; a++) {
    const i = (a * 37) % count;
    const j = (i + span + a * 11) % count;
    const ax = nodes[i * 3];
    const ay = nodes[i * 3 + 1];
    const az = nodes[i * 3 + 2];
    const bx = nodes[j * 3];
    const by = nodes[j * 3 + 1];
    const bz = nodes[j * 3 + 2];

    const dot = Math.max(-1, Math.min(1, ax * bx + ay * by + az * bz));
    const omega = Math.acos(dot);
    const sinOmega = Math.sin(omega);
    for (let k = 0; k < ARC_SAMPLES; k++) {
      const t = k / (ARC_SAMPLES - 1);
      let x;
      let y;
      let z;
      if (sinOmega < 1e-4) {
        x = ax;
        y = ay;
        z = az;
      } else {
        const w1 = Math.sin((1 - t) * omega) / sinOmega;
        const w2 = Math.sin(t * omega) / sinOmega;
        x = ax * w1 + bx * w2;
        y = ay * w1 + by * w2;
        z = az * w1 + bz * w2;
      }
      const lift = 1 + 0.05 * Math.sin(Math.PI * t);
      arcs[w++] = x * lift;
      arcs[w++] = y * lift;
      arcs[w++] = z * lift;
    }
  }

  const out = { nodes, edges: new Uint16Array(pairs), arcs };
  cache.set(key, out);
  return out;
}
