'use client';

// Intake form. Collects structured facts + free-text notes, then asks the
// backend LLM to polish everything into a resume and routes to the editor.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateResume } from '../lib/api';

const emptyExp = () => ({ role: '', company: '', location: '', start: '', end: '', notes: '' });
const emptyEdu = () => ({ degree: '', school: '', location: '', start: '', end: '' });

export default function FormPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '', title: '', email: '', phone: '', location: '',
    summaryNotes: '',
    experience: [emptyExp()],
    education: [emptyEdu()],
    skills: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setExp = (i, k, v) =>
    setForm((f) => ({ ...f, experience: f.experience.map((e, j) => (i === j ? { ...e, [k]: v } : e)) }));
  const setEdu = (i, k, v) =>
    setForm((f) => ({ ...f, education: f.education.map((e, j) => (i === j ? { ...e, [k]: v } : e)) }));

  const submit = async () => {
    setError('');
    if (!form.fullName.trim()) return setError('Please enter your name.');
    setLoading(true);
    try {
      // Shape the payload the way the prompt expects.
      const payload = {
        fullName: form.fullName,
        title: form.title,
        email: form.email,
        phone: form.phone,
        location: form.location,
        summary: form.summaryNotes,
        experience: form.experience
          .filter((e) => e.role || e.company)
          .map((e) => ({ ...e, bullets: e.notes ? [e.notes] : [] })),
        education: form.education.filter((e) => e.degree || e.school),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      };
      const resume = await generateResume(payload);
      router.push(`/editor/${resume.id}`);
    } catch (e) {
      setError(e.message || 'Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <div className="wrap">
      <div className="eyebrow">Venture Builders · Task 3</div>
      <h1 className="page">Resume Builder</h1>
      <p className="sub">Fill in the essentials — the AI will turn your notes into polished, ATS-friendly copy you can edit and restyle.</p>

      <div className="card">
        <h3>Personal</h3>
        <div className="row">
          <div><label>Full name *</label><input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Chaitanya Kumar" /></div>
          <div><label>Professional title</label><input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Full Stack Developer" /></div>
        </div>
        <div className="row-3">
          <div><label>Email</label><input value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div><label>Phone</label><input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
          <div><label>Location</label><input value={form.location} onChange={(e) => set('location', e.target.value)} /></div>
        </div>
        <label>About you (a few notes — the AI will expand this)</label>
        <textarea value={form.summaryNotes} onChange={(e) => set('summaryNotes', e.target.value)} placeholder="Full stack dev, 2 yrs, React + Node, built microservices, into AI/ML..." />
      </div>

      <div className="card">
        <h3>Experience</h3>
        {form.experience.map((e, i) => (
          <div className="repeat-item" key={i}>
            <div className="row">
              <div><label>Role</label><input value={e.role} onChange={(ev) => setExp(i, 'role', ev.target.value)} /></div>
              <div><label>Company</label><input value={e.company} onChange={(ev) => setExp(i, 'company', ev.target.value)} /></div>
            </div>
            <div className="row-3">
              <div><label>Location</label><input value={e.location} onChange={(ev) => setExp(i, 'location', ev.target.value)} /></div>
              <div><label>Start</label><input value={e.start} onChange={(ev) => setExp(i, 'start', ev.target.value)} placeholder="Jan 2024" /></div>
              <div><label>End</label><input value={e.end} onChange={(ev) => setExp(i, 'end', ev.target.value)} placeholder="Present" /></div>
            </div>
            <label>What you did (rough notes — AI turns this into bullet points)</label>
            <textarea value={e.notes} onChange={(ev) => setExp(i, 'notes', ev.target.value)} placeholder="Built booking service with Stripe, cut checkout errors, led 2 interns..." />
            {form.experience.length > 1 && (
              <button className="btn-ghost btn-sm btn-danger" onClick={() => set('experience', form.experience.filter((_, j) => j !== i))}>Remove</button>
            )}
          </div>
        ))}
        <button className="add-link" onClick={() => set('experience', [...form.experience, emptyExp()])}>+ Add experience</button>
      </div>

      <div className="card">
        <h3>Education</h3>
        {form.education.map((e, i) => (
          <div className="repeat-item" key={i}>
            <div className="row">
              <div><label>Degree</label><input value={e.degree} onChange={(ev) => setEdu(i, 'degree', ev.target.value)} placeholder="B.Tech, CSE (AI & ML)" /></div>
              <div><label>School</label><input value={e.school} onChange={(ev) => setEdu(i, 'school', ev.target.value)} /></div>
            </div>
            <div className="row-3">
              <div><label>Location</label><input value={e.location} onChange={(ev) => setEdu(i, 'location', ev.target.value)} /></div>
              <div><label>Start</label><input value={e.start} onChange={(ev) => setEdu(i, 'start', ev.target.value)} /></div>
              <div><label>End</label><input value={e.end} onChange={(ev) => setEdu(i, 'end', ev.target.value)} /></div>
            </div>
            {form.education.length > 1 && (
              <button className="btn-ghost btn-sm btn-danger" onClick={() => set('education', form.education.filter((_, j) => j !== i))}>Remove</button>
            )}
          </div>
        ))}
        <button className="add-link" onClick={() => set('education', [...form.education, emptyEdu()])}>+ Add education</button>
      </div>

      <div className="card">
        <h3>Skills</h3>
        <label>Comma-separated</label>
        <input value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="React, Node.js, PostgreSQL, Docker, Python, TensorFlow" />
      </div>

      {error && <p style={{ color: '#e0576b', fontSize: 13 }}>{error}</p>}
      <button className="btn" onClick={submit} disabled={loading}>
        {loading ? <><span className="spinner" />Generating…</> : 'Generate resume →'}
      </button>
      {loading && <p className="muted" style={{ marginTop: 10 }}>The AI is writing your resume. On a local model this can take 10–30 seconds.</p>}
    </div>
  );
}
