const BRAND = {
  name: 'Qaroo India Private Limited',
  primary: '#B3262D',
  navy: '#172A46',
  gold: '#F4C430',
  bg: '#F7F7F5',
};

// Escape text before it is interpolated into the downloadable HTML document.
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));

function list(items) {
  return Array.isArray(items)
    ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
    : '';
}

const STYLE = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Segoe UI', Arial, sans-serif; color: #26233F; background: ${BRAND.bg}; line-height: 1.6; }
  .cover { background: linear-gradient(120deg, #8F151B, ${BRAND.primary}); color: #fff; padding: 56px 48px; }
  .cover h1 { margin: 0 0 10px; font-size: 32px; letter-spacing: -0.5px; }
  .cover p { margin: 0; color: #F7E9E9; max-width: 640px; }
  .cover .brand { font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: ${BRAND.gold}; font-weight: 700; margin-bottom: 14px; }
  .content { padding: 40px 48px 24px; }
  section { margin-bottom: 28px; page-break-inside: avoid; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 0.1em; color: ${BRAND.primary}; border-bottom: 2px solid ${BRAND.gold}; padding-bottom: 6px; margin: 0 0 10px; }
  ul { margin: 0; padding-left: 18px; column-width: 220px; column-gap: 28px; }
  li { margin-bottom: 4px; font-size: 13.5px; }
  .foot { background: ${BRAND.navy}; color: #fff; padding: 24px 48px; font-size: 12.5px; display: flex; justify-content: space-between; gap: 18px; flex-wrap: wrap; }
  @media print { body { background: #fff; } .cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;

/**
 * Builds a brochure from a programme or solution's own content.
 *
 * @param {object} options
 * @param {boolean} [options.print]
 *   Open it in a window and raise the print dialog, where the browser's own
 *   "Save as PDF" writes the file. That is how a PDF is produced here without
 *   pulling in a PDF library: the document already carries print styles. Left
 *   off, the brochure downloads as a self-contained HTML file instead.
 */
export function downloadBrochure({ title, subtitle, sections, print = false }) {
  const body = (sections || [])
    .filter((s) => s && s.items && s.items.length)
    .map(
      (s) => `
  <section>
    <h2>${esc(s.heading)}</h2>
    ${list(s.items)}
  </section>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(BRAND.name)} - ${esc(title)}</title>
<style>${STYLE}</style>
</head>
<body>
  <div class="cover">
    <div class="brand">${esc(BRAND.name)}</div>
    <h1>${esc(title)}</h1>
    <p>${esc(subtitle)}</p>
  </div>
  <div class="content">${body}</div>
  <div class="foot">
    <div><strong>${esc(BRAND.name)}</strong><br />Head Office: No.3A, 3rd Floor, Sri Ram Towers, Lakshmi Mills Junction, P N Palayam, Coimbatore - 641 037</div>
    <div>Branch: No.13/4, Chavadi Street, Pallavaram, Chennai - 600 043</div>
  </div>
</body>
</html>`;

  if (print) {
    const view = window.open('', '_blank', 'noopener,width=900,height=1000');
    if (view) {
      view.document.write(html);
      view.document.close();
      // Give the document a moment to lay out before the dialog opens, or it
      // can be measured mid-parse and paginate badly.
      view.addEventListener('load', () => {
        view.focus();
        view.print();
      });
      setTimeout(() => {
        if (!view.closed) {
          view.focus();
          view.print();
        }
      }, 600);
      return;
    }
    // Popup blocked: fall through and hand over the file instead of nothing.
  }

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase()}-qaroo-brochure.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}