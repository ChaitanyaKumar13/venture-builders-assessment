const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

export async function generateResume(form) {
  const r = await fetch(`${API}/api/resumes/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || 'Generation failed');
  return r.json();
}

export async function getResume(id) {
  const r = await fetch(`${API}/api/resumes/${id}`);
  if (!r.ok) throw new Error('Could not load resume');
  return r.json();
}

export async function saveResume(id, payload) {
  const r = await fetch(`${API}/api/resumes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('Could not save resume');
  return r.json();
}
