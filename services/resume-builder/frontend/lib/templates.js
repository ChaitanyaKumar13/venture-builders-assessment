// Template engine: (resume data + templateId) -> a full standalone HTML document.
// The SAME output drives the live preview (iframe srcDoc) and the HTML export,
// so "what you see" is exactly "what you download". All templates are single
// column with semantic headings = ATS-friendly by construction.

export const TEMPLATES = [
  { id: 'modern', name: 'Modern' },
  { id: 'classic', name: 'Classic (ATS)' },
  { id: 'minimal', name: 'Minimal' },
];

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

// Rich fields (summary, bullets) may already be HTML from the Tiptap editor.
// Fall back to plain LLM shapes (string / string[]) if the rich form is absent.
function summaryHtml(data) {
  if (data.summaryHtml) return data.summaryHtml;
  if (data.summary) return `<p>${esc(data.summary)}</p>`;
  return '';
}
function bulletsHtml(exp) {
  if (exp.bulletsHtml) return exp.bulletsHtml;
  if (Array.isArray(exp.bullets) && exp.bullets.length)
    return `<ul>${exp.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`;
  return '';
}

function contactLine(data) {
  const parts = [data.email, data.phone, data.location].filter(Boolean).map(esc);
  const links = (data.links || [])
    .filter((l) => l && l.url)
    .map((l) => `<a href="${esc(l.url)}">${esc(l.label || l.url)}</a>`);
  return [...parts, ...links].join(' &nbsp;•&nbsp; ');
}

function sectionsHtml(data) {
  const exp = (data.experience || [])
    .map(
      (e) => `
      <div class="entry">
        <div class="entry-head">
          <span class="entry-title">${esc(e.role || '')}${e.company ? ` — ${esc(e.company)}` : ''}</span>
          <span class="entry-dates">${esc(e.start || '')}${e.end ? ` – ${esc(e.end)}` : ''}</span>
        </div>
        ${e.location ? `<div class="entry-sub">${esc(e.location)}</div>` : ''}
        <div class="rich">${bulletsHtml(e)}</div>
      </div>`
    )
    .join('');

  const edu = (data.education || [])
    .map(
      (e) => `
      <div class="entry">
        <div class="entry-head">
          <span class="entry-title">${esc(e.degree || '')}${e.school ? ` — ${esc(e.school)}` : ''}</span>
          <span class="entry-dates">${esc(e.start || '')}${e.end ? ` – ${esc(e.end)}` : ''}</span>
        </div>
        ${e.details ? `<div class="entry-sub">${esc(e.details)}</div>` : ''}
      </div>`
    )
    .join('');

  const skills = (data.skills || []).length
    ? `<div class="skills">${data.skills.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}</div>`
    : '';

  const projects = (data.projects || [])
    .filter((p) => p && (p.name || p.description))
    .map(
      (p) => `
      <div class="entry">
        <div class="entry-head">
          <span class="entry-title">${esc(p.name || '')}</span>
          ${p.link ? `<span class="entry-dates"><a href="${esc(p.link)}">${esc(p.link)}</a></span>` : ''}
        </div>
        ${p.description ? `<div class="entry-sub">${esc(p.description)}</div>` : ''}
      </div>`
    )
    .join('');

  const sec = (title, body) => (body ? `<section><h2>${title}</h2>${body}</section>` : '');

  return [
    summaryHtml(data) ? `<section><h2>Summary</h2><div class="rich">${summaryHtml(data)}</div></section>` : '',
    sec('Experience', exp),
    sec('Projects', projects),
    sec('Education', edu),
    sec('Skills', skills),
  ].join('');
}

// ---- per-template CSS ----
const CSS = {
  modern: `
    :root { --accent:#2563eb; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color:#1f2937; }
    header { border-bottom:3px solid var(--accent); padding-bottom:12px; margin-bottom:18px; }
    h1 { color:var(--accent); margin:0 0 2px; font-size:26px; }
    .role-title { color:#374151; font-weight:600; font-size:14px; }
    .contact { color:#4b5563; font-size:12px; margin-top:6px; }
    h2 { color:var(--accent); font-size:14px; text-transform:uppercase; letter-spacing:.06em;
         border-bottom:1px solid #e5e7eb; padding-bottom:3px; margin:18px 0 8px; }
    .chip { background:#eff6ff; color:#1d4ed8; border-radius:4px; padding:2px 8px; font-size:12px; }`,
  classic: `
    body { font-family: Georgia, 'Times New Roman', serif; color:#111; }
    header { text-align:center; border-bottom:2px solid #111; padding-bottom:10px; margin-bottom:16px; }
    h1 { margin:0 0 4px; font-size:24px; letter-spacing:.02em; }
    .role-title { font-style:italic; font-size:14px; }
    .contact { font-size:12px; margin-top:6px; }
    h2 { font-size:14px; text-transform:uppercase; letter-spacing:.08em;
         border-bottom:1px solid #999; padding-bottom:2px; margin:16px 0 8px; }
    .chip { border:1px solid #999; border-radius:3px; padding:2px 8px; font-size:12px; }`,
  minimal: `
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color:#222; }
    header { margin-bottom:22px; }
    h1 { margin:0 0 2px; font-size:24px; font-weight:600; }
    .role-title { color:#666; font-size:14px; }
    .contact { color:#888; font-size:12px; margin-top:6px; }
    h2 { font-size:12px; text-transform:uppercase; letter-spacing:.14em; color:#999; margin:20px 0 6px; }
    .chip { background:#f3f4f6; border-radius:12px; padding:2px 10px; font-size:12px; }`,
};

const BASE_CSS = `
  * { box-sizing:border-box; }
  body { max-width:800px; margin:0 auto; padding:40px; line-height:1.5; font-size:13.5px; }
  a { color:inherit; text-decoration:none; }
  section { margin-bottom:6px; }
  .entry { margin-bottom:12px; }
  .entry-head { display:flex; justify-content:space-between; gap:12px; align-items:baseline; }
  .entry-title { font-weight:700; }
  .entry-dates { color:#6b7280; font-size:12px; white-space:nowrap; }
  .entry-sub { color:#6b7280; font-size:12px; margin:1px 0 4px; }
  .rich ul { margin:4px 0; padding-left:18px; }
  .rich li { margin-bottom:3px; }
  .rich p { margin:4px 0; }
  .skills { display:flex; flex-wrap:wrap; gap:6px; }
  @media print { body { padding:24px; } }
`;

export function renderResume(data = {}, templateId = 'modern') {
  const css = CSS[templateId] || CSS.modern;
  const body = `
    <header>
      <h1>${esc(data.fullName || 'Your Name')}</h1>
      ${data.title ? `<div class="role-title">${esc(data.title)}</div>` : ''}
      <div class="contact">${contactLine(data)}</div>
    </header>
    ${sectionsHtml(data)}
  `;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(data.fullName || 'Resume')}</title>
<style>${BASE_CSS}${css}</style>
</head><body>${body}</body></html>`;
}

// Normalize LLM output (summary:string, bullets:string[]) into the rich shape the
// Tiptap editor binds to (summaryHtml, experience[].bulletsHtml).
export function normalizeForEditor(data = {}) {
  const d = { ...data };
  if (!d.summaryHtml) d.summaryHtml = d.summary ? `<p>${esc(d.summary)}</p>` : '<p></p>';
  d.experience = (d.experience || []).map((e) => ({
    ...e,
    bulletsHtml:
      e.bulletsHtml ||
      (Array.isArray(e.bullets) && e.bullets.length
        ? `<ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`
        : '<ul><li></li></ul>'),
  }));
  d.education = d.education || [];
  d.skills = d.skills || [];
  d.projects = d.projects || [];
  d.links = d.links || [];
  return d;
}
