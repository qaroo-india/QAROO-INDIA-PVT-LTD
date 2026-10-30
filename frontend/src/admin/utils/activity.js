// Turns the record lists the dashboard already fetches into the series the
// charts draw.
//
// The dashboard calls every list endpoint to get its counts and then throws the
// records away. Every model is saved with `timestamps: true`, so those same
// responses carry a real `createdAt` on every row - enough to plot when things
// were actually added without a single extra request. Nothing here invents a
// data point: a bucket with no records is a zero.

/** Local midnight for a date, so day buckets follow the admin's own clock. */
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

const parsed = (value) => {
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
};

/**
 * Buckets records into consecutive periods ending with the one `now` sits in.
 *
 * @param {Array<object>} records rows carrying a createdAt
 * @param {{span: 'day'|'month', count: number, now?: Date}} options
 * @returns {Array<{start: Date, label: string, value: number}>}
 */
export function bucket(records, { span, count, now = new Date() }) {
  const isDay = span === 'day';
  const first = isDay
    ? addDays(startOfDay(now), -(count - 1))
    : addMonths(startOfMonth(now), -(count - 1));

  const buckets = [];
  for (let i = 0; i < count; i += 1) {
    const start = isDay ? addDays(first, i) : addMonths(first, i);
    const end = isDay ? addDays(first, i + 1) : addMonths(first, i + 1);
    buckets.push({
      start,
      end: end.getTime(),
      value: 0,
      label: isDay
        ? start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
        : start.toLocaleDateString(undefined, { month: 'short' }),
    });
  }

  const from = first.getTime();
  for (const record of records || []) {
    const at = parsed(record?.createdAt);
    if (at === null || at < from) continue;
    // Walking back from the end is cheapest: rows arrive newest-first.
    for (let i = buckets.length - 1; i >= 0; i -= 1) {
      if (at >= buckets[i].start.getTime() && at < buckets[i].end) {
        buckets[i].value += 1;
        break;
      }
    }
  }

  return buckets.map(({ start, label, value }) => ({ start, label, value }));
}

/**
 * How many records landed in the current period against the one before it.
 * Returns null when there is nothing to compare against, so the UI can say so
 * rather than showing a misleading 0%.
 */
export function trend(series) {
  if (!series || series.length < 2) return null;
  const current = series[series.length - 1].value;
  const previous = series[series.length - 2].value;
  if (previous === 0) return current === 0 ? { pct: 0, dir: 'flat' } : { pct: null, dir: 'up' };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { pct, dir: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' };
}

/**
 * The newest rows across every section, newest first.
 *
 * @param {Array<{key, label, tone, to, records, title}>} groups
 * @param {number} limit
 */
export function recentAcross(groups, limit = 8) {
  const all = [];
  for (const group of groups || []) {
    for (const record of group.records || []) {
      const at = parsed(record?.createdAt);
      if (at === null) continue;
      all.push({
        at,
        id: record._id || record.id,
        group: group.key,
        label: group.label,
        tone: group.tone,
        to: group.to,
        title: group.title(record) || group.label,
        meta: group.meta ? group.meta(record) : '',
      });
    }
  }
  all.sort((a, b) => b.at - a.at);
  return all.slice(0, limit);
}

const MINUTE = 60e3;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "just now", "12m ago", "3h ago", "5d ago", then a plain date. */
export function relativeTime(at, now = Date.now()) {
  const diff = now - at;
  if (diff < 0 || diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/**
 * Builds an SVG path for a series scaled into a box.
 * `area` closes the path along the baseline so it can be filled.
 */
export function linePath(values, width, height, { area = false, pad = 2 } = {}) {
  if (!values || values.length === 0) return '';
  const max = Math.max(1, ...values);
  const inner = height - pad * 2;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const pt = (v, i) => [i * step, pad + inner - (v / max) * inner];

  // A Catmull-Rom style midpoint curve: smooth without overshooting a zero.
  let d = '';
  values.forEach((v, i) => {
    const [x, y] = pt(v, i);
    if (i === 0) { d += `M${x.toFixed(2)},${y.toFixed(2)}`; return; }
    const [px, py] = pt(values[i - 1], i - 1);
    const cx = (px + x) / 2;
    d += `C${cx.toFixed(2)},${py.toFixed(2)} ${cx.toFixed(2)},${y.toFixed(2)} ${x.toFixed(2)},${y.toFixed(2)}`;
  });

  if (area) d += `L${((values.length - 1) * step).toFixed(2)},${height} L0,${height} Z`;
  return d;
}
