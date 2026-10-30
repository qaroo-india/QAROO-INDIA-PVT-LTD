import { useEffect, useRef } from 'react';
import './AtomField.css';

// The sphere mesh and the land mask are only needed when the globe is drawn,
// and the mask alone is 36KB of coastline. Every other page hero mounts this
// component for its atom field with the globe off, so these load on demand
// instead of riding in the shared bundle on every page. Resolved once and
// kept, so navigating back to the home page costs nothing.
let globeModules = null;
let globeLoad = null;

function loadGlobeModules() {
  if (globeModules) return Promise.resolve(globeModules);
  if (!globeLoad) {
    globeLoad = Promise.all([
      import('../data/worldLand.js'),
      import('../data/sphereMesh.js'),
    ]).then(([world, sphere]) => {
      globeModules = {
        getLandPoints: world.getLandPoints,
        getSphereMesh: sphere.getSphereMesh,
        ARC_SAMPLES: sphere.ARC_SAMPLES,
      };
      return globeModules;
    });
  }
  return globeLoad;
}

// Six buckets: 0-3 are interior land by how much key light they catch, 4-5 are
// coastline (shadowed, lit). Coast dots run brighter and bigger, which is what
// makes the continents read as shapes rather than as an even field.
const BUCKETS = 6;
// Same red -> yellow -> white emission logic as the rays, stepped per bucket:
// shadowed dots stay deep red, lit dots burn near-white.
const DOT_TONE = [
  '255, 58, 30',
  '255, 104, 44',
  '255, 176, 74',
  '255, 236, 206',
  '255, 132, 58',
  '255, 248, 232',
];
const DOT_ALPHA = [0.3, 0.5, 0.8, 1, 0.66, 1];
const DOT_SIZE = [1.1, 1.25, 1.4, 1.6, 1.3, 1.7];
const DOT_SIZE_SM = [1.05, 1.1, 1.25, 1.45, 1.2, 1.55];
// A wider, low-alpha pass behind the lit buckets. Under the layer's screen
// blend this reads as light coming off each dot, and it costs one extra path
// fill per bucket rather than a per-dot shadow.
const DOT_HALO = [0, 0, 0.13, 0.2, 0.08, 0.28];
// Spacing between land samples, in degrees - the dot grid of the globe. The
// land test is a coverage read over a 0.25deg mask rather than point-in-polygon,
// so a fine grid costs little at build time and is memoised after the first
// call: 0.8deg is ~19,000 dots (~4,000 of them coast), ~13,000 front-facing
// at the hero's spin. Going finer makes the dots touch on a large screen and
// the globe reads as a filled ball instead of a dot field.
const LAND_STEP = 0.8;
const LAND_STEP_SM = 1.6;
// Wireframe net woven over the land dots. At 1200 nodes the triangles land at
// roughly 33px on a 660px globe, which is the weave in the design reference;
// a denser net needs thinner, fainter lines or it reads as a blanket.
const MESH_NODES = 1200;
const MESH_NODES_SM = 340;
// Nodes that pulse as live hubs.
const HUB_COUNT = 6;

/**
 * Interactive background atoms for the hero: a slowly turning dotted globe plus
 * a field of drifting particles that lean away from the cursor.
 *
 * Everything lives on a single 2D canvas driven by one requestAnimationFrame
 * loop, so the whole layer costs one composite per frame. The loop is paused
 * when the section scrolls out of view or the tab is hidden, pointer events are
 * read into a ref (no React state, no re-renders, no per-event maths), and
 * `prefers-reduced-motion` falls back to a single static frame.
 *
 * @param {object} props
 * @param {import('react').RefObject<HTMLElement>} [props.interactionRef]
 *   Element whose pointer movement drives the field - defaults to the parent.
 */
export default function AtomField({
  className = '',
  interactionRef = null,
  showGlobe = true,
  landTone = '255, 96, 58',
  atomTone = '255, 188, 150',
  accentTone = '255, 205, 72',
  flareTone = '255, 232, 208',
}) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return undefined;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const coarsePointer = !!window.matchMedia?.('(pointer: coarse)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let small = false;

    /* ---- globe -------------------------------------------------------- */
    // Set once the globe's modules arrive; null means draw atoms only.
    let globe = globeModules;
    let land = null;
    let globeR = 0;
    let globeX = 0;
    let globeY = 0;
    let haze = null;
    let limb = null;
    let flare = null;
    let flareBox = 0;
    let flareX = 0;
    let flareY = 0;

    // Wireframe net: node lattice and edge list are static, only the
    // projection is recomputed per frame into meshXY as [x, y, light] triples
    // (light < 0 marks a node facing away from the viewer).
    let mesh = null;
    let meshXY = null;
    let arcXY = null;
    let coast = null;
    let elapsed = 0;
    // Longitude ~20 deg E faces the viewer at this offset, so the first paint shows
    // Africa and Europe the way the design reference does.
    let spin = -1.22;
    let spinNudge = 0;
    let tiltNudge = 0;

    // Drag-to-rotate. While the pointer is down on the globe it drives the
    // rotation directly; on release the throw velocity decays back into the
    // ambient spin, so the globe never stops responding or stops moving.
    let dragging = false;
    let dragX = 0;
    let dragY = 0;
    let dragAt = 0;
    let tiltDrag = 0;
    let momentum = 0;
    let overGlobe = false;

    // Land dots are bucketed by how much key light they catch, so each bucket
    // is one fillStyle change followed by a tight fillRect loop.
    let bucketXY = [];
    const bucketLen = new Int32Array(BUCKETS);

    /* ---- atoms -------------------------------------------------------- */
    let atoms = [];

    /* ---- pointer ------------------------------------------------------ */
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, ease: 0, target: 0 };
    let hostRect = null;

    const buildAtoms = () => {
      const count = Math.round(Math.min(54, Math.max(16, (width * height) / 23000)));
      atoms = new Array(count);
      for (let i = 0; i < count; i++) {
        atoms[i] = {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 7,
          vy: (Math.random() - 0.5) * 7,
          r: 0.7 + Math.random() * 1.5,
          a: 0.22 + Math.random() * 0.42,
          gold: Math.random() < 0.35,
          ox: 0,
          oy: 0,
          lift: 0,
        };
      }
    };

    const measure = () => {
      const rect = host.getBoundingClientRect();
      hostRect = rect;
      const nextW = Math.max(1, Math.round(rect.width));
      const nextH = Math.max(1, Math.round(rect.height));
      small = nextW < 768;
      const nextDpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
      if (nextW === width && nextH === height && nextDpr === dpr) return false;

      width = nextW;
      height = nextH;
      dpr = nextDpr;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Without the globe this is a plain atom field - what the other page
      // heroes use - so none of the sphere is built: no 19,000-point land
      // array, no per-bucket buffers, and globeR stays 0 so a drag never tries
      // to spin something that is not drawn.
      if (showGlobe && globe) buildGlobe();

      buildAtoms();
      return true;
    };

    // Sized from the current width/height, so this runs again on resize and
    // once more when the globe's data finishes loading.
    const buildGlobe = () => {
      mesh = globe.getSphereMesh(small ? MESH_NODES_SM : MESH_NODES);
      const nodeCount = mesh.nodes.length / 3;
      if (!meshXY || meshXY.length < nodeCount * 3) {
        meshXY = new Float32Array(nodeCount * 3);
      }
      const arcPoints = mesh.arcs.length / 3;
      if (!arcXY || arcXY.length < arcPoints * 3) {
        arcXY = new Float32Array(arcPoints * 3);
      }

      const landData = globe.getLandPoints(small ? LAND_STEP_SM : LAND_STEP);
      land = landData.points;
      coast = landData.coast;
      const points = land.length / 3;
      if (bucketXY.length !== BUCKETS || bucketXY[0].length < points * 2) {
        bucketXY = Array.from({ length: BUCKETS }, () => new Float32Array(points * 2));
      }

      globeR = small
        ? Math.min(height * 0.34, width * 0.46)
        : Math.min(height * 0.46, width * 0.3);
      globeX = small ? width * 0.64 : width * 0.72;
      globeY = small ? height * 0.28 : height * 0.45;

      haze = ctx.createRadialGradient(globeX, globeY, globeR * 0.25, globeX, globeY, globeR * 1.6);
      haze.addColorStop(0, `rgba(${landTone}, 0.42)`);
      haze.addColorStop(0.4, `rgba(${landTone}, 0.2)`);
      haze.addColorStop(0.72, `rgba(${landTone}, 0.07)`);
      haze.addColorStop(1, `rgba(${landTone}, 0)`);

      // Atmospheric rim: a bright band hugging the limb of the sphere.
      limb = ctx.createRadialGradient(globeX, globeY, globeR * 0.74, globeX, globeY, globeR * 1.14);
      limb.addColorStop(0, `rgba(${landTone}, 0)`);
      limb.addColorStop(0.62, `rgba(${landTone}, 0.3)`);
      limb.addColorStop(0.78, `rgba(${landTone}, 0.16)`);
      limb.addColorStop(1, `rgba(${landTone}, 0)`);

      // Flare where the background rays converge on the globe.
      flareX = globeX - globeR * 0.2;
      flareY = globeY + globeR * 0.05;
      flareBox = globeR * 0.6;
      flare = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, flareBox);
      flare.addColorStop(0, `rgba(${flareTone}, 0.4)`);
      flare.addColorStop(0.26, `rgba(255, 140, 90, 0.15)`);
      flare.addColorStop(1, `rgba(255, 110, 70, 0)`);
    };

    const drawGlobe = () => {
      // Cursor parallax stays inside +/-9px so the globe leans, never slides.
      const cx = globeX + spinNudge * 88;
      const cy = globeY + tiltNudge * 88;
      const cosS = Math.cos(spin + spinNudge);
      const sinS = Math.sin(spin + spinNudge);
      const tilt = 0.36 + tiltNudge + tiltDrag;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      // Soft atmosphere behind the dots, then the rim light on the limb.
      const box = globeR * 1.7;
      ctx.fillStyle = haze;
      ctx.fillRect(globeX - box, globeY - box, box * 2, box * 2);
      ctx.fillStyle = limb;
      ctx.fillRect(globeX - box, globeY - box, box * 2, box * 2);

      // Wireframe net over the sphere: project every node once, then stroke
      // the edges in two passes (lit and shadowed) so the whole net costs two
      // path strokes rather than one per segment.
      const nodes = mesh.nodes;
      for (let i = 0, q = 0; i < nodes.length; i += 3, q += 3) {
        const x = nodes[i];
        const y = nodes[i + 1];
        const z = nodes[i + 2];
        const xr = x * cosS + z * sinS;
        const zs = z * cosS - x * sinS;
        const yr = y * cosT - zs * sinT;
        const zr = y * sinT + zs * cosT;
        meshXY[q] = cx + xr * globeR;
        meshXY[q + 1] = cy - yr * globeR;
        meshXY[q + 2] = zr < 0 ? -1 : xr * -0.45 + yr * 0.28 + zr * 0.85;
      }

      const edges = mesh.edges;
      ctx.lineWidth = 0.55;
      for (let pass = 0; pass < 2; pass++) {
        const lit = pass === 1;
        let drew = false;
        ctx.beginPath();
        for (let e = 0; e < edges.length; e += 2) {
          const a = edges[e] * 3;
          const b = edges[e + 1] * 3;
          const la = meshXY[a + 2];
          const lb = meshXY[b + 2];
          if (la < 0 || lb < 0) continue;
          if (((la + lb) * 0.5 > 0.42) !== lit) continue;
          ctx.moveTo(meshXY[a], meshXY[a + 1]);
          ctx.lineTo(meshXY[b], meshXY[b + 1]);
          drew = true;
        }
        if (drew) {
          ctx.strokeStyle = lit ? `rgba(${DOT_TONE[2]}, 0.24)` : `rgba(${DOT_TONE[0]}, 0.09)`;
          ctx.stroke();
        }
      }

      // Points at the net's vertices - kept small and faint so the land dots
      // stay the dominant texture.
      ctx.beginPath();
      for (let q = 0; q < meshXY.length; q += 3) {
        if (meshXY[q + 2] < 0.12) continue;
        ctx.rect(meshXY[q] - 0.6, meshXY[q + 1] - 0.6, 1.2, 1.2);
      }
      ctx.fillStyle = `rgba(${DOT_TONE[2]}, 0.3)`;
      ctx.fill();

      // Long-haul arcs: great circles lifted off the surface. Projected once,
      // then drawn as one polyline path with segments culled at the limb.
      const arcs = mesh.arcs;
      for (let i = 0, q = 0; i < arcs.length; i += 3, q += 3) {
        const x = arcs[i];
        const y = arcs[i + 1];
        const z = arcs[i + 2];
        const xr = x * cosS + z * sinS;
        const zs = z * cosS - x * sinS;
        const yr = y * cosT - zs * sinT;
        const zr = y * sinT + zs * cosT;
        arcXY[q] = cx + xr * globeR;
        arcXY[q + 1] = cy - yr * globeR;
        arcXY[q + 2] = zr;
      }
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = `rgba(${accentTone}, 0.34)`;
      ctx.beginPath();
      for (let a = 0; a < arcXY.length; a += globe.ARC_SAMPLES * 3) {
        let open = false;
        for (let k = 0; k < globe.ARC_SAMPLES; k++) {
          const q = a + k * 3;
          if (arcXY[q + 2] < 0) {
            open = false;
            continue;
          }
          if (open) ctx.lineTo(arcXY[q], arcXY[q + 1]);
          else {
            ctx.moveTo(arcXY[q], arcXY[q + 1]);
            open = true;
          }
        }
      }
      ctx.stroke();

      // A handful of nodes pulse as live hubs.
      for (let hub = 0; hub < HUB_COUNT; hub++) {
        const q = ((hub * 23) % (meshXY.length / 3)) * 3;
        if (meshXY[q + 2] < 0) continue;
        const beat = 0.5 + 0.5 * Math.sin(elapsed * 1.6 + hub * 1.9);
        ctx.beginPath();
        ctx.arc(meshXY[q], meshXY[q + 1], 1.6 + beat * 3.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${DOT_TONE[5]}, ${0.06 + (1 - beat) * 0.16})`;
        ctx.fill();
      }

      bucketLen.fill(0);

      for (let i = 0; i < land.length; i += 3) {
        const x = land[i];
        const y = land[i + 1];
        const z = land[i + 2];

        const xr = x * cosS + z * sinS;
        const zs = z * cosS - x * sinS;
        const yr = y * cosT - zs * sinT;
        const zr = y * sinT + zs * cosT;
        if (zr < -0.02) continue;

        // Key light sits where the background glow is - upper left, in front.
        const lit = xr * -0.45 + yr * 0.28 + zr * 0.85;
        let level;
        if (coast[i / 3]) {
          level = lit > 0.42 ? 5 : 4;
        } else {
          level = ((lit + 0.35) * 2.6) | 0;
          if (level < 0) level = 0;
          else if (level > 3) level = 3;
        }

        const idx = bucketLen[level];
        const arr = bucketXY[level];
        arr[idx] = cx + xr * globeR;
        arr[idx + 1] = cy - yr * globeR;
        bucketLen[level] = idx + 2;
      }

      // One path and one fill per brightness bucket - four rasterer passes for
      // the whole globe instead of thousands of individual draw calls.
      const sizes = small ? DOT_SIZE_SM : DOT_SIZE;
      for (let b = 0; b < BUCKETS; b++) {
        const len = bucketLen[b];
        if (!len) continue;
        const arr = bucketXY[b];
        const size = sizes[b];
        const half = size / 2;
        const halo = DOT_HALO[b];
        if (halo) {
          const hs = size * 2.4;
          const hh = hs / 2;
          ctx.beginPath();
          for (let i = 0; i < len; i += 2) {
            ctx.rect(arr[i] - hh, arr[i + 1] - hh, hs, hs);
          }
          ctx.fillStyle = `rgba(${DOT_TONE[b]}, ${halo})`;
          ctx.fill();
        }

        ctx.beginPath();
        for (let i = 0; i < len; i += 2) {
          ctx.rect(arr[i] - half, arr[i + 1] - half, size, size);
        }
        ctx.fillStyle = `rgba(${DOT_TONE[b]}, ${DOT_ALPHA[b]})`;
        ctx.fill();
      }

      // Convergence flare, over the surface so it blooms across the dots.
      ctx.fillStyle = flare;
      ctx.fillRect(flareX - flareBox, flareY - flareBox, flareBox * 2, flareBox * 2);
    };

    const drawAtoms = () => {
      for (let i = 0; i < atoms.length; i++) {
        const a = atoms[i];
        const x = a.x + a.ox;
        const y = a.y + a.oy;
        const lift = a.lift;
        const tone = a.gold ? accentTone : atomTone;

        // Displaced atoms carry a soft halo, so the push reads as light being
        // disturbed rather than dots sliding around.
        if (lift > 0.04) {
          ctx.beginPath();
          ctx.arc(x, y, (a.r + 1.3) * (1 + lift * 2.6), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${tone}, ${lift * 0.17})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, a.r + lift * 1.7, 0, Math.PI * 2);
        ctx.fillStyle = a.gold
          ? `rgba(${tone}, ${Math.min(1, a.a + lift * 0.6)})`
          : `rgba(${tone}, ${Math.min(1, a.a * 0.9 + lift * 0.55)})`;
        ctx.fill();
      }
    };

    const step = (dt) => {
      // The pointer is eased inside the frame loop rather than handled per
      // event: no maths runs on mousemove and the motion stays fluid at any
      // event rate.
      pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 7);
      pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 7);
      pointer.ease += (pointer.target - pointer.ease) * Math.min(1, dt * 3.2);

      elapsed += dt;

      if (!dragging) {
        // Ambient rotation, plus whatever throw is left from the last drag.
        spin += dt * 0.055;
        if (momentum !== 0) {
          spin += momentum * dt;
          momentum *= Math.exp(-dt * 2.6);
          if (Math.abs(momentum) < 0.003) momentum = 0;
        }
      }

      // The cursor lean would fight the drag, so it only applies when idle.
      const leaning = pointer.target && !dragging;
      const spinTarget = leaning ? (pointer.tx / width - 0.5) * 0.2 : 0;
      const tiltTarget = leaning ? (pointer.ty / height - 0.5) * -0.1 : 0;
      spinNudge += (spinTarget - spinNudge) * Math.min(1, dt * 1.6);
      tiltNudge += (tiltTarget - tiltNudge) * Math.min(1, dt * 1.6);

      // Pointer repulsion. The target displacement is applied through a
      // per-atom easing that is quick outward and slow back in, so hovering
      // pushes the field open and it drifts closed again behind the cursor.
      const reach = small ? 120 : 210;
      const reachSq = reach * reach;
      const push = small ? 30 : 54;
      const active = pointer.ease > 0.01;

      for (let i = 0; i < atoms.length; i++) {
        const a = atoms[i];
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        if (a.x < -12) a.x = width + 12;
        else if (a.x > width + 12) a.x = -12;
        if (a.y < -12) a.y = height + 12;
        else if (a.y > height + 12) a.y = -12;

        let tx = 0;
        let ty = 0;
        let tl = 0;
        if (active) {
          const dx = a.x - pointer.x;
          const dy = a.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < reachSq && d2 > 0.0001) {
            const d = Math.sqrt(d2);
            const f = (1 - d / reach) ** 2 * pointer.ease;
            tx = (dx / d) * f * push;
            ty = (dy / d) * f * push;
            tl = f;
          }
        }

        const outward = tx * tx + ty * ty > a.ox * a.ox + a.oy * a.oy;
        const k = Math.min(1, dt * (outward ? 9 : 2.2));
        a.ox += (tx - a.ox) * k;
        a.oy += (ty - a.oy) * k;
        a.lift += (tl - a.lift) * k;
      }
    };

    const paint = () => {
      ctx.clearRect(0, 0, width, height);
      if (showGlobe && globe && land && mesh && globeR > 0) drawGlobe();
      drawAtoms();
    };

    /* ---- loop --------------------------------------------------------- */
    let raf = 0;
    let last = 0;
    let onScreen = true;
    let tabVisible = !document.hidden;
    let reduced = !!motionQuery?.matches;

    const frame = (now) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      step(dt);
      paint();
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (reduced || raf || !onScreen || !tabVisible) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const applyMotionMode = () => {
      reduced = !!motionQuery?.matches;
      if (reduced) {
        stop();
        spinNudge = 0;
        tiltNudge = 0;
        pointer.ease = 0;
        paint();
      } else {
        start();
      }
    };

    /* ---- events ------------------------------------------------------- */
    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (measure() && (reduced || !raf)) paint();
      }, 120);
    });
    ro.observe(host);

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(host);

    const onVisibility = () => {
      tabVisible = !document.hidden;
      if (tabVisible) start();
      else stop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Touch devices keep the ambient drift but skip cursor tracking - a finger
    // is not a hover, and chasing touch points would fight with scrolling.
    const zone = interactionRef?.current || host.parentElement || host;
    const invalidateRect = () => {
      hostRect = null;
    };
    const onPointerMove = (e) => {
      if (e.pointerType === 'touch') return;
      if (!hostRect) hostRect = host.getBoundingClientRect();
      pointer.tx = e.clientX - hostRect.left;
      pointer.ty = e.clientY - hostRect.top;
      if (pointer.x < -1000) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
      pointer.target = 1;
      if (!dragging) setGrab(onGlobe(pointer.tx, pointer.ty));
    };
    const onPointerLeave = () => {
      pointer.target = 0;
      if (!dragging) setGrab(false);
    };

    /* ---- drag to rotate ------------------------------------------------ */
    const DRAG_MAX_TILT = 0.55;
    const DRAG_MIN_TILT = -0.32;

    const setGrab = (on) => {
      if (on === overGlobe) return;
      overGlobe = on;
      zone.classList.toggle('atom-field-grab', on);
    };

    const localPoint = (e) => {
      if (!hostRect) hostRect = host.getBoundingClientRect();
      return [e.clientX - hostRect.left, e.clientY - hostRect.top];
    };

    const onGlobe = (lx, ly) => {
      if (!globeR) return false;
      const dx = lx - globeX;
      const dy = ly - globeY;
      return dx * dx + dy * dy <= globeR * globeR;
    };

    const onPointerDown = (e) => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      // Never swallow a click meant for the hero's own links or buttons.
      if (e.target.closest && e.target.closest('a, button, input, textarea, select')) return;
      const [lx, ly] = localPoint(e);
      if (!onGlobe(lx, ly)) return;

      dragging = true;
      dragX = lx;
      dragY = ly;
      dragAt = performance.now();
      momentum = 0;
      zone.classList.add('atom-field-grabbing');
      // Stops the drag from selecting the hero copy underneath.
      e.preventDefault();
      window.addEventListener('pointermove', onDragMove, { passive: false });
      window.addEventListener('pointerup', onDragEnd);
      window.addEventListener('pointercancel', onDragEnd);
    };

    const onDragMove = (e) => {
      if (!dragging) return;
      const [lx, ly] = localPoint(e);
      // A drag across the globe's diameter turns it half a revolution.
      const sens = Math.PI / (globeR * 2);
      const dx = lx - dragX;
      const dy = ly - dragY;
      const now = performance.now();
      const moveDt = Math.max((now - dragAt) / 1000, 0.008);

      spin += dx * sens;
      tiltDrag = Math.max(DRAG_MIN_TILT, Math.min(DRAG_MAX_TILT, tiltDrag + dy * sens * 0.5));

      const v = (dx * sens) / moveDt;
      momentum = Math.max(-3, Math.min(3, momentum * 0.55 + v * 0.45));

      dragX = lx;
      dragY = ly;
      dragAt = now;
      e.preventDefault();
      // Reduced motion has no running loop, so a drag repaints on demand.
      if (reduced) paint();
    };

    const onDragEnd = () => {
      if (!dragging) return;
      dragging = false;
      zone.classList.remove('atom-field-grabbing');
      window.removeEventListener('pointermove', onDragMove);
      window.removeEventListener('pointerup', onDragEnd);
      window.removeEventListener('pointercancel', onDragEnd);
      if (reduced) momentum = 0;
    };

    if (!coarsePointer) {
      zone.addEventListener('pointermove', onPointerMove, { passive: true });
      zone.addEventListener('pointerleave', onPointerLeave, { passive: true });
      zone.addEventListener('pointerdown', onPointerDown, { passive: false });
      window.addEventListener('scroll', invalidateRect, { passive: true });
      window.addEventListener('resize', invalidateRect, { passive: true });
    }

    const onMotionChange = () => applyMotionMode();
    motionQuery?.addEventListener?.('change', onMotionChange);

    measure();
    applyMotionMode();

    // Fetches the mesh and the land mask on first use. The atom field is
    // already running by the time they arrive; the globe joins it a frame
    // later rather than holding up the first paint.
    let cancelled = false;
    if (showGlobe && !globe) {
      loadGlobeModules().then((modules) => {
        if (cancelled) return;
        globe = modules;
        if (width && height) {
          buildGlobe();
          paint();
        }
      });
    }

    return () => {
      cancelled = true;
      stop();
      clearTimeout(resizeTimer);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery?.removeEventListener?.('change', onMotionChange);
      if (!coarsePointer) {
        onDragEnd();
        zone.classList.remove('atom-field-grab', 'atom-field-grabbing');
        zone.removeEventListener('pointermove', onPointerMove);
        zone.removeEventListener('pointerleave', onPointerLeave);
        zone.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('scroll', invalidateRect);
        window.removeEventListener('resize', invalidateRect);
      }
    };
  }, [interactionRef, showGlobe, landTone, atomTone, accentTone, flareTone]);

  return (
    <div ref={hostRef} className={`atom-field ${className}`.trim()} aria-hidden="true">
      <canvas ref={canvasRef} className="atom-field__canvas" />
    </div>
  );
}
