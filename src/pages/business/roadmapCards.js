// Card faces for the roadmap carousel.
//
// FlexCarousel draws every card as a WebGL texture taken from `src`, so the
// only way to put words on a card is to draw them into an image first. These
// are painted on a canvas rather than written as SVG for two reasons: canvas
// can measure text, so lines wrap where they should instead of at a guessed
// character count, and it can use a font the page has already loaded, which an
// SVG used as an image cannot.
//
// A face is always drawn 620px wide and then scaled to whatever the row gives
// it, so the type that matters is the type *after* scaling. On a phone the
// card lands about 0.47 of its drawn size, which put the body text under 10px
// - hence the compact layout: fewer things, drawn much larger, so they arrive
// legible. Nothing here invents content; it all comes from the solution's own
// record.

const FONT = "'Urbanist', 'Segoe UI', system-ui, sans-serif";

// Navy, brand red, gold - rotated so no two neighbouring cards match. Ink and
// accent are chosen to clear AA against their own background.
const TONES = [
  { bg: '#172A46', ink: '#FFFFFF', muted: 'rgba(255,255,255,0.74)', accent: '#F4C430', rule: 'rgba(255,255,255,0.22)' },
  { bg: '#B3262D', ink: '#FFFFFF', muted: 'rgba(255,255,255,0.80)', accent: '#F4C430', rule: 'rgba(255,255,255,0.26)' },
  { bg: '#F4C430', ink: '#172A46', muted: 'rgba(23,42,70,0.78)', accent: '#B3262D', rule: 'rgba(23,42,70,0.22)' },
];

/** Card size in layout pixels. Drawn at twice this, so it stays sharp. */
export const CARD_W = 620;
export const CARD_H = 826;   // the 0.75 portrait ratio the carousel is set to
const PAD = 52;
const SCALE = 2;

// Two layouts over the same face. `compact` is for a card that will be shown
// small: everything is drawn larger, the per-stage detail lines and the
// outcome are dropped, and the description is cut to three lines - there is
// only so much that can be read on a phone-sized card.
const LAYOUTS = {
  full: {
    stage: 17, stageTrack: 3,
    title: 40, titleLine: 46, titleLines: 3,
    desc: 21, descLine: 31, descLines: 5,
    label: 15, labelTrack: 2.4,
    step: 20, stepGap: 54, node: 13, nodeText: 14,
    detail: 17, showDetail: true,
    outcome: 18, outcomeLabel: 13, showOutcome: true,
  },
  compact: {
    stage: 25, stageTrack: 4,
    title: 54, titleLine: 60, titleLines: 2,
    desc: 30, descLine: 43, descLines: 3,
    label: 22, labelTrack: 3.2,
    step: 30, stepGap: 62, node: 19, nodeText: 20,
    detail: 0, showDetail: false,
    // No outcome line on a small card. Drawn this large the stages already
    // reach the foot of the face, and the two collided on six of the eight.
    outcome: 27, outcomeLabel: 19, showOutcome: false,
  },
};

/** Splits text into lines that fit `maxWidth`, up to `maxLines`. */
function wrap(ctx, text, maxWidth, maxLines) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
      continue;
    }
    lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.length) {
    // Trim the last line until the ellipsis fits, so it never runs past the edge.
    let last = lines[maxLines - 1];
    const used = lines.join(' ').split(/\s+/).length;
    if (used < words.length) {
      while (last && ctx.measureText(`${last}...`).width > maxWidth) {
        last = last.slice(0, -1).trimEnd();
      }
      lines[maxLines - 1] = `${last}...`;
    }
  }
  return lines;
}

function setFont(ctx, weight, size, tracking = 0) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  // Supported in current Chrome and Firefox; harmless where it is not.
  try {
    ctx.letterSpacing = `${tracking}px`;
  } catch {
    /* older engine: the label simply sits tighter */
  }
}

/**
 * Paints one solution onto a card and returns it as a data URL.
 *
 * @param {{idx: string, title: string, desc: string, process: Array}} solution
 * @param {number} index position in the row, which picks the colour
 * @param {{compact?: boolean}} [options] compact for a card shown small
 * @returns {string}
 */
export function renderRoadmapCard(solution, index, { compact = false } = {}) {
  const L = compact ? LAYOUTS.compact : LAYOUTS.full;
  const tone = TONES[index % TONES.length];
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W * SCALE;
  canvas.height = CARD_H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = tone.bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const inner = CARD_W - PAD * 2;
  let y = PAD + 18;

  // Stage
  setFont(ctx, 700, L.stage, L.stageTrack);
  ctx.fillStyle = tone.accent;
  ctx.fillText(`STAGE ${solution.idx}`, PAD, y);
  y += L.stage + 21;

  // Title
  setFont(ctx, 800, L.title);
  ctx.fillStyle = tone.ink;
  for (const line of wrap(ctx, solution.title, inner, L.titleLines)) {
    ctx.fillText(line, PAD, y);
    y += L.titleLine;
  }

  // Rule
  y += 14;
  ctx.fillStyle = tone.accent;
  ctx.fillRect(PAD, y, compact ? 74 : 56, compact ? 5 : 4);
  y += 38;

  // Description
  setFont(ctx, 400, L.desc);
  ctx.fillStyle = tone.muted;
  for (const line of wrap(ctx, solution.desc, inner, L.descLines)) {
    ctx.fillText(line, PAD, y);
    y += L.descLine;
  }

  // The stages of the work, if the record carries them
  const steps = (solution.process || []).slice(0, 4);
  if (steps.length) {
    y += 26;
    setFont(ctx, 700, L.label, L.labelTrack);
    ctx.fillStyle = tone.accent;
    ctx.fillText('HOW WE RUN IT', PAD, y);
    y += L.label + 15;

    steps.forEach((step, n) => {
      const cy = y - L.node * 0.55;
      ctx.strokeStyle = tone.accent;
      ctx.lineWidth = compact ? 2 : 1.4;
      ctx.beginPath();
      ctx.arc(PAD + L.node, cy, L.node, 0, Math.PI * 2);
      ctx.stroke();

      // The line joining this stage to the next, drawn between nodes only.
      if (n < steps.length - 1) {
        ctx.strokeStyle = tone.rule;
        ctx.beginPath();
        ctx.moveTo(PAD + L.node, cy + L.node + 1);
        ctx.lineTo(PAD + L.node, cy + L.stepGap - L.node - 1);
        ctx.stroke();
      }

      setFont(ctx, 700, L.nodeText);
      ctx.fillStyle = tone.accent;
      ctx.textAlign = 'center';
      ctx.fillText(String(n + 1), PAD + L.node, cy + L.nodeText * 0.36);
      ctx.textAlign = 'left';

      const textX = PAD + L.node * 2 + 14;
      setFont(ctx, 700, L.step);
      ctx.fillStyle = tone.ink;
      ctx.fillText(step.title || '', textX, y);

      const detail = step.items?.[0];
      if (L.showDetail && detail) {
        setFont(ctx, 400, L.detail);
        ctx.fillStyle = tone.muted;
        const [first] = wrap(ctx, detail, inner - (textX - PAD), 1);
        ctx.fillText(first, textX, y + 23);
      }
      y += L.stepGap;
    });
  }

  // Outcome, along the foot of the card
  const outcome = solution.benefits?.[0];
  const footTop = CARD_H - PAD - (compact ? 72 : 44);
  if (L.showOutcome && outcome && y < footTop - 20) {
    ctx.strokeStyle = tone.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, footTop - 26);
    ctx.lineTo(CARD_W - PAD, footTop - 26);
    ctx.stroke();

    setFont(ctx, 700, L.outcomeLabel, compact ? 3 : 2.2);
    ctx.fillStyle = tone.accent;
    ctx.fillText('WHAT YOU END UP WITH', PAD, footTop);

    setFont(ctx, 500, L.outcome);
    ctx.fillStyle = tone.ink;
    const lines = wrap(ctx, outcome, inner, compact ? 2 : 1);
    lines.forEach((line, i) => ctx.fillText(line, PAD, footTop + 28 + i * (L.outcome + 8)));
  }

  return canvas.toDataURL('image/png');
}
