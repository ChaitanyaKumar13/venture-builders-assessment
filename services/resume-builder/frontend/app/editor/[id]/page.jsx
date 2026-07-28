'use client';

// Editor + live preview. Left: structured fields with Tiptap for the rich parts.
// Right: the exact HTML that will be exported, rendered in an isolated iframe.
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RichText from '../../../components/RichText';
import Preview from '../../../components/Preview';
import { getResume, saveResume } from '../../../lib/api';
import { renderResume, normalizeForEditor, TEMPLATES } from '../../../lib/templates';

export default function EditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [template, setTemplate] = useState('modern');
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await getResume(id);
        setData(normalizeForEditor(r.data || {}));
        setTemplate(r.template || 'modern');
        setStatus('ready');
      } catch {
        setStatus('error');
      }
    })();
  }, [id]);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const setExp = (i, k, v) =>
    setData((d) => ({ ...d, experience: d.experience.map((e, j) => (i === j ? { ...e, [k]: v } : e)) }));
  const setEdu = (i, k, v) =>
    setData((d) => ({ ...d, education: d.education.map((e, j) => (i === j ? { ...e, [k]: v } : e)) }));

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await saveResume(id, { data, template });
      setSavedAt(new Date());
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  }, [id, data, template]);

  const download = () => {
    const html = renderResume(data, template);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(data.fullName || 'resume').replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPdf = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(renderResume(data, template));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  if (status === 'loading') return <div className="wrap"><p className="muted">Loading resume…</p></div>;
  if (status === 'error') return <div className="wrap"><p className="muted">Couldn’t load this resume. <a onClick={() => router.push('/')} style={{cursor:'pointer'}}>Start over</a></p></div>;

  return (
    <div className="wrap" style={{ maxWidth: 1180 }}>
      <div className="toolbar">
        <div className="eyebrow">Editing</div>
        <div className="tpl-select">
          {TEMPLATES.map((t) => (
            <button key={t.id} className={`tpl-btn ${template === t.id ? 'active' : ''}`} onClick={() => setTemplate(t.id)}>{t.name}</button>
          ))}
        </div>
        <div className="spacer" />
        {savedAt && <span className="muted">Saved {savedAt.toLocaleTimeString()}</span>}
        <button className="btn-ghost" onClick={download}>Export HTML</button>
        <button className="btn-ghost" onClick={printPdf}>Print / PDF</button>
        <button className="btn btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>

      <div className="editor-layout">
        <div className="editor-col">
          <div className="card">
            <h3>Personal</h3>
            <div className="row">
              <div><label>Full name</label><input value={data.fullName || ''} onChange={(e) => set('fullName', e.target.value)} /></div>
              <div><label>Title</label><input value={data.title || ''} onChange={(e) => set('title', e.target.value)} /></div>
            </div>
            <div className="row-3">
              <div><label>Email</label><input value={data.email || ''} onChange={(e) => set('email', e.target.value)} /></div>
              <div><label>Phone</label><input value={data.phone || ''} onChange={(e) => set('phone', e.target.value)} /></div>
              <div><label>Location</label><input value={data.location || ''} onChange={(e) => set('location', e.target.value)} /></div>
            </div>
          </div>

          <div className="card">
            <h3>Summary</h3>
            <RichText value={data.summaryHtml} onChange={(html) => set('summaryHtml', html)} />
          </div>

          <div className="card">
            <h3>Experience</h3>
            {(data.experience || []).map((e, i) => (
              <div className="repeat-item" key={i}>
                <div className="row">
                  <div><label>Role</label><input value={e.role || ''} onChange={(ev) => setExp(i, 'role', ev.target.value)} /></div>
                  <div><label>Company</label><input value={e.company || ''} onChange={(ev) => setExp(i, 'company', ev.target.value)} /></div>
                </div>
                <div className="row-3">
                  <div><label>Location</label><input value={e.location || ''} onChange={(ev) => setExp(i, 'location', ev.target.value)} /></div>
                  <div><label>Start</label><input value={e.start || ''} onChange={(ev) => setExp(i, 'start', ev.target.value)} /></div>
                  <div><label>End</label><input value={e.end || ''} onChange={(ev) => setExp(i, 'end', ev.target.value)} /></div>
                </div>
                <label>Bullet points</label>
                <RichText value={e.bulletsHtml} onChange={(html) => setExp(i, 'bulletsHtml', html)} />
                <button className="btn-ghost btn-sm btn-danger" onClick={() => set('experience', data.experience.filter((_, j) => j !== i))}>Remove</button>
              </div>
            ))}
            <button className="add-link" onClick={() => set('experience', [...(data.experience || []), { role: '', company: '', bulletsHtml: '<ul><li></li></ul>' }])}>+ Add experience</button>
          </div>

          <div className="card">
            <h3>Education</h3>
            {(data.education || []).map((e, i) => (
              <div className="repeat-item" key={i}>
                <div className="row">
                  <div><label>Degree</label><input value={e.degree || ''} onChange={(ev) => setEdu(i, 'degree', ev.target.value)} /></div>
                  <div><label>School</label><input value={e.school || ''} onChange={(ev) => setEdu(i, 'school', ev.target.value)} /></div>
                </div>
                <div className="row-3">
                  <div><label>Location</label><input value={e.location || ''} onChange={(ev) => setEdu(i, 'location', ev.target.value)} /></div>
                  <div><label>Start</label><input value={e.start || ''} onChange={(ev) => setEdu(i, 'start', ev.target.value)} /></div>
                  <div><label>End</label><input value={e.end || ''} onChange={(ev) => setEdu(i, 'end', ev.target.value)} /></div>
                </div>
                <button className="btn-ghost btn-sm btn-danger" onClick={() => set('education', data.education.filter((_, j) => j !== i))}>Remove</button>
              </div>
            ))}
            <button className="add-link" onClick={() => set('education', [...(data.education || []), { degree: '', school: '' }])}>+ Add education</button>
          </div>

          <div className="card">
            <h3>Skills</h3>
            <label>Comma-separated</label>
            <input value={(data.skills || []).join(', ')} onChange={(e) => set('skills', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
          </div>
        </div>

        <div className="editor-col preview-col">
          <Preview data={data} template={template} />
          <p className="muted" style={{ marginTop: 8 }}>Live preview — this is exactly what exports. Single-column + semantic headings keep it ATS-friendly.</p>
        </div>
      </div>
    </div>
  );
}
