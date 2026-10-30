/* global process, console */
/**
 * Regenerates src/data/worldLand.js — the land mask the hero globe plots.
 *
 * Natural Earth data (public domain) is rasterised to a lat/lon bitmask and
 * run-length encoded, so the site ships ~12KB of source instead of fetching or
 * bundling megabytes of coastline geometry, and the runtime land test is an
 * array lookup rather than point-in-polygon over thousands of vertices.
 *
 * Usage, from the project root:
 *   curl -o /tmp/land-10m.json https://cdn.jsdelivr.net/npm/world-atlas@2/land-10m.json
 *   curl -o /tmp/lakes-10m.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_lakes.geojson
 *   node tools/build-world-mask.mjs /tmp/land-10m.json 1440 /tmp/lakes-10m.geojson
 *
 * These are the arguments the shipped mask was built from; 1:50m at 720
 * columns loses the smaller islands and most of the coastline shape.
 *
 * Args: <land topojson> [grid columns, default 720] [lakes geojson]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const topo = JSON.parse(readFileSync(process.argv[2] || 'land-50m.json', 'utf8'));
const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;

// --- decode delta-encoded, quantised arcs into [lon, lat] rings ---
const arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => {
    x += dx; y += dy;
    return [x * sx + tx, y * sy + ty];
  });
});
const ringOf = (indices) => {
  const pts = [];
  for (const i of indices) {
    const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
    // arcs share endpoints; drop the duplicate join
    pts.push(...(pts.length ? a.slice(1) : a));
  }
  return pts;
};
const rings = [];
for (const geom of topo.objects.land.geometries) {
  const polys = geom.type === 'Polygon' ? [geom.arcs] : geom.arcs;
  for (const poly of polys) for (const ring of poly) rings.push(ringOf(ring));
}

// --- flatten every ring into an edge list once ---
const edges = [];
for (const r of rings) {
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [x1, y1] = r[j], [x2, y2] = r[i];
    if (y1 !== y2) edges.push([x1, y1, x2, y2]);
  }
}

// --- lakes, subtracted from the land mask (NE's land layer keeps them filled) ---
const lakeEdges = [];
try {
  const lakes = JSON.parse(readFileSync(process.argv[4] || 'lakes.geojson', 'utf8'));
  for (const f of lakes.features) {
    if ((f.properties.scalerank ?? 9) > 1) continue;   // significant lakes only
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) for (const ring of poly) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [x1, y1] = ring[j], [x2, y2] = ring[i];
        if (y1 !== y2) lakeEdges.push([x1, y1, x2, y2]);
      }
    }
  }
  console.log('lake edges:', lakeEdges.length);
} catch (err) {
  console.warn('WARNING: lakes not subtracted -', err.message);
  console.warn('The Great Lakes and similar will render as land. Pass the lakes geojson as arg 4.');
}

// Natural Earth publishes land at 1:110m, 1:50m and 1:10m; the detail of the
// coastline comes from that choice as much as from the grid size, so the
// generated header records which one was used.
const SOURCE = (/(\d+m)/.exec(process.argv[2] || '') || ['', '50m'])[1];
const COLS = Number(process.argv[3] || 720);
const ROWS = COLS / 2;
const dLon = 360 / COLS, dLat = 180 / ROWS;

// --- scanline fill, even-odd across all rings so holes (inland seas) drop out ---
const bits = new Uint8Array(COLS * ROWS);
for (let row = 0; row < ROWS; row++) {
  const lat = 90 - (row + 0.5) * dLat;
  const xs = [];
  for (const [x1, y1, x2, y2] of edges) {
    if ((y1 <= lat && y2 > lat) || (y2 <= lat && y1 > lat)) {
      xs.push(x1 + ((lat - y1) / (y2 - y1)) * (x2 - x1));
    }
  }
  if (!xs.length) continue;
  xs.sort((a, b) => a - b);
  for (let k = 0; k + 1 < xs.length; k += 2) {
    let c0 = Math.ceil((xs[k] + 180) / dLon - 0.5);
    let c1 = Math.floor((xs[k + 1] + 180) / dLon - 0.5);
    if (c1 < 0 || c0 >= COLS) continue;
    c0 = Math.max(0, c0); c1 = Math.min(COLS - 1, c1);
    bits.fill(1, row * COLS + c0, row * COLS + c1 + 1);
  }
}

// --- carve the lakes back out ---
for (let row = 0; row < ROWS; row++) {
  const lat = 90 - (row + 0.5) * dLat;
  const xs = [];
  for (const [x1, y1, x2, y2] of lakeEdges) {
    if ((y1 <= lat && y2 > lat) || (y2 <= lat && y1 > lat)) {
      xs.push(x1 + ((lat - y1) / (y2 - y1)) * (x2 - x1));
    }
  }
  if (!xs.length) continue;
  xs.sort((a, b) => a - b);
  for (let k = 0; k + 1 < xs.length; k += 2) {
    let c0 = Math.ceil((xs[k] + 180) / dLon - 0.5);
    let c1 = Math.floor((xs[k + 1] + 180) / dLon - 0.5);
    if (c1 < 0 || c0 >= COLS) continue;
    c0 = Math.max(0, c0); c1 = Math.min(COLS - 1, c1);
    bits.fill(0, row * COLS + c0, row * COLS + c1 + 1);
  }
}

// --- run-length encode; base36 lengths, alternating water/land, '.' separator ---
const runs = [];
let cur = 0, len = 0;
for (let i = 0; i < bits.length; i++) {
  if (bits[i] === cur) { len++; continue; }
  runs.push(len); cur = bits[i]; len = 1;
}
runs.push(len);
const rle = runs.map((n) => n.toString(36)).join('.');

const land = bits.reduce((a, b) => a + b, 0);
console.log(`grid ${COLS}x${ROWS} (${dLon.toFixed(3)}deg)  land ${(land / bits.length * 100).toFixed(1)}%  rle ${(rle.length / 1024).toFixed(1)}KB  runs ${runs.length}`);

const module = `/**
 * Land mask for the hero globe.
 *
 * GENERATED FILE — do not hand-edit. Rebuild with:
 *   node tools/build-world-mask.mjs <land-${SOURCE}.json> ${COLS} <lakes.geojson>
 *
 * Source: Natural Earth 1:${SOURCE} land and lakes (public domain). Rasterised
 * to a ${COLS}x${ROWS} lat/lon grid (${dLon.toFixed(3)}deg per cell) and run-length encoded:
 * base36 run lengths, '.' separated, alternating water/land from the top-left
 * cell. Land covers ${(land / bits.length * 100).toFixed(1)}% of the grid, which matches Earth.
 */
const MASK_COLS = ${COLS};
const MASK_ROWS = ${ROWS};
const MASK_RLE =
  '${rle}';

/** Decoded lazily and kept, so repeated sampling is a plain array read. */
let mask = null;

function getMask() {
  if (mask) return mask;
  const bits = new Uint8Array(MASK_COLS * MASK_ROWS);
  let at = 0;
  let value = 0;
  for (const token of MASK_RLE.split('.')) {
    const run = parseInt(token, 36);
    if (value) bits.fill(1, at, at + run);
    at += run;
    value ^= 1;
  }
  mask = bits;
  return mask;
}

/**
 * Is there land at this coordinate?
 * Longitude wraps, so callers can probe past the antimeridian.
 *
 * @param {number} lon degrees east
 * @param {number} lat degrees north
 * @returns {boolean}
 */
export function isLand(lon, lat) {
  const bits = getMask();
  const wrapped = (((lon + 180) % 360) + 360) % 360;
  const col = Math.min(MASK_COLS - 1, Math.floor((wrapped / 360) * MASK_COLS));
  const row = Math.min(
    MASK_ROWS - 1,
    Math.max(0, Math.floor(((90 - lat) / 180) * MASK_ROWS)),
  );
  return bits[row * MASK_COLS + col] === 1;
}

const DEG = Math.PI / 180;
const D_LON = 360 / MASK_COLS;
const D_LAT = 180 / MASK_ROWS;
const cache = new Map();

/**
 * What share of a lat/lon cell is land, from 0 to 1.
 *
 * Reading a single mask cell per sample throws away most of the mask and drops
 * anything narrower than the sample step, which is most of the world's
 * islands. Measuring the cells a sample actually covers keeps them.
 *
 * @param {number} lon centre longitude, degrees east
 * @param {number} lat centre latitude, degrees north
 * @param {number} lonSpan cell width in degrees
 * @param {number} latSpan cell height in degrees
 * @returns {number}
 */
function landCover(lon, lat, lonSpan, latSpan) {
  const bits = getMask();
  const rowAt = (l) =>
    Math.min(MASK_ROWS - 1, Math.max(0, Math.floor((90 - l) / D_LAT)));
  const top = rowAt(lat + latSpan / 2);
  const bottom = rowAt(lat - latSpan / 2);
  const wrapped = ((((lon - lonSpan / 2) + 180) % 360) + 360) % 360;
  const first = Math.floor(wrapped / D_LON) % MASK_COLS;
  const span = Math.max(1, Math.round(lonSpan / D_LON));

  let hit = 0;
  let total = 0;
  for (let row = top; row <= bottom; row++) {
    const base = row * MASK_COLS;
    for (let k = 0; k < span; k++) {
      hit += bits[base + ((first + k) % MASK_COLS)];
      total++;
    }
  }
  return total ? hit / total : 0;
}

/** A cell reads as land once this much of it is land. */
const SOLID = 0.25;

/**
 * Unit-sphere positions for every land cell, plus a coast flag per point.
 *
 * Rings are sampled with a cosine-corrected longitude step so dot density stays
 * even instead of bunching at the poles. A point is marked as coast when its
 * cell is not wholly land or any neighbour is water; drawing those brighter is
 * what makes the continents legible at small sizes instead of reading as a
 * blob. Results are memoised per step, so remounting the hero costs nothing.
 *
 * @param {number} stepDeg spacing between samples, in degrees
 * @returns {{points: Float32Array, coast: Uint8Array}}
 */
export function getLandPoints(stepDeg = 3.4) {
  const key = String(stepDeg);
  const hit = cache.get(key);
  if (hit) return hit;

  const points = [];
  const coast = [];
  for (let lat = -78; lat <= 84; lat += stepDeg) {
    const latRad = lat * DEG;
    const cosLat = Math.cos(latRad);
    const count = Math.max(1, Math.round((360 / stepDeg) * cosLat));
    const lonStep = 360 / count;
    for (let i = 0; i < count; i++) {
      const lon = -180 + i * lonStep;
      const here = landCover(lon, lat, lonStep, stepDeg);
      if (here <= 0) continue;

      const solidNear =
        landCover(lon + lonStep, lat, lonStep, stepDeg) > SOLID ||
        landCover(lon - lonStep, lat, lonStep, stepDeg) > SOLID ||
        landCover(lon, lat + stepDeg, lonStep, stepDeg) > SOLID ||
        landCover(lon, lat - stepDeg, lonStep, stepDeg) > SOLID;

      let edge;
      if (here > SOLID) {
        edge = here < 0.999 || !solidNear;
      } else if (solidNear) {
        // Barely land, with solid land beside it: the fringe of a coastline
        // that is already drawn. Including it fattens every shore by a dot.
        continue;
      } else {
        // Barely land with nothing solid around it is an island smaller than
        // the grid. Dropping these loses the likes of Malta or Mauritius.
        edge = true;
      }

      const lonRad = lon * DEG;
      // +x east, +y north, +z out of the map at the prime meridian. The
      // renderer's camera sits on +z, so this is what puts east on the
      // right; swapping the sin and cos here mirrors every continent.
      points.push(cosLat * Math.sin(lonRad), Math.sin(latRad), cosLat * Math.cos(lonRad));
      coast.push(edge ? 1 : 0);
    }
  }

  const out = { points: new Float32Array(points), coast: new Uint8Array(coast) };
  cache.set(key, out);
  return out;
}

`;
writeFileSync('src/data/worldLand.js', module);
console.log('wrote src/data/worldLand.js');
