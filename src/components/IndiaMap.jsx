import './IndiaMap.css';

const MIN_LON = 68;
const LAT_RANGE = 29;
const LON_RANGE = 29;

const X = (lon) => ((lon - MIN_LON) / LON_RANGE) * 300;
const Y = (lat) => ((37 - lat) / LAT_RANGE) * 300;

const OUTLINE = [
  [35.6, 76.6], [34.5, 76.5], [33.0, 77.0], [30.7, 79.1], [28.6, 80.6],
  [27.4, 88.1], [27.0, 91.8], [27.7, 96.4], [25.7, 94.5], [23.0, 93.2],
  [22.5, 92.5], [21.6, 88.1], [22.0, 89.0], [19.9, 86.1], [16.3, 80.7],
  [13.1, 80.3], [11.9, 79.8], [8.1, 77.5], [8.5, 76.9], [11.2, 75.8],
  [12.9, 74.8], [15.4, 73.8], [19.0, 72.8], [21.2, 72.8], [22.2, 69.0],
  [23.1, 68.9], [23.5, 70.9], [27.2, 70.5], [30.9, 74.3], [34.0, 74.3],
].map(([lat, lon]) => ({ x: X(lon), y: Y(lat) }));

const INDIA_PATH = "M " + OUTLINE.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ") + " Z";

const COIMBATORE = { x: X(76.96), y: Y(11.02), label: 'Coimbatore - HQ', dx: -8, anchor: 'end' };
const CHENNAI = { x: X(80.27), y: Y(13.08), label: 'Chennai - Branch', dx: 8, anchor: 'start' };

function Pin({ city }) {
  return (
    <g>
      <circle cx={city.x} cy={city.y} r="3" fill="#F4C430" className="map-ping" />
      <circle cx={city.x} cy={city.y} r="5" fill="#F4C430" className="map-ping-slow" />
      <circle cx={city.x} cy={city.y} r="3.2" fill="#F4C430" stroke="#fff" strokeWidth="1.4" />
      <text
        x={city.x + city.dx}
        y={city.y + 4}
        textAnchor={city.anchor}
        fontFamily="Urbanist, sans-serif"
        fontWeight={700}
        fontSize="12"
        fill="#26233F"
      >
        {city.label}
      </text>
    </g>
  );
}

export default function IndiaMap({ height = 320 }) {
  const midX = (COIMBATORE.x + CHENNAI.x) / 2;
  const arcY = Math.min(COIMBATORE.y, CHENNAI.y) - 74;
  return (
    <div className="india-map">
      <svg viewBox="0 0 300 300" style={{ width: '100%', height: 'auto', maxHeight: height, display: 'block' }} role="img" aria-label="Qaroo India office locations - Coimbatore and Chennai">
        <path d={INDIA_PATH} fill="rgba(23, 42, 70, 0.05)" stroke="#172A46" strokeWidth="2" strokeLinejoin="round" />
        <path d={`M ${COIMBATORE.x} ${COIMBATORE.y} Q ${midX} ${arcY} ${CHENNAI.x} ${CHENNAI.y}`} fill="none" stroke="#F4C430" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
        <Pin city={COIMBATORE} />
        <Pin city={CHENNAI} />
      </svg>
    </div>
  );
}