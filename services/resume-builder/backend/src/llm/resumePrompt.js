// Builds the prompt that turns raw form input into a polished, structured resume.
// We ask for STRICT JSON matching our schema so templates can map over it and
// the output stays ATS-friendly (plain text content, no decorative markup).

export const RESUME_SCHEMA_HINT = `{
  "fullName": string,
  "title": string,                      // professional headline, e.g. "Full Stack Developer"
  "email": string,
  "phone": string,
  "location": string,
  "links": [{ "label": string, "url": string }],
  "summary": string,                    // 2-3 sentence professional summary
  "experience": [{
    "role": string, "company": string, "location": string,
    "start": string, "end": string,     // e.g. "Jan 2024", "Present"
    "bullets": [string]                 // 3-5 achievement-oriented bullet points
  }],
  "education": [{
    "degree": string, "school": string, "location": string,
    "start": string, "end": string, "details": string
  }],
  "skills": [string],
  "projects": [{ "name": string, "description": string, "link": string }]
}`;

export function buildResumeMessages(form) {
  const system = {
    role: 'system',
    content:
      'You are an expert technical resume writer. You transform raw candidate ' +
      'details into a polished, ATS-friendly resume. Rules: use strong action ' +
      'verbs; quantify impact where plausible; keep bullets concise and truthful ' +
      '(never invent employers, degrees, or metrics that contradict the input); ' +
      'write in a professional tone. Respond with ONLY valid JSON — no markdown, ' +
      'no commentary — matching exactly this shape:\n' + RESUME_SCHEMA_HINT,
  };
  const user = {
    role: 'user',
    content:
      'Here are the raw candidate details as JSON. Enhance the wording, expand ' +
      'terse notes into strong bullet points, and produce a professional summary. ' +
      'Preserve all factual data (names, dates, companies). Return the structured ' +
      'resume JSON.\n\n' + JSON.stringify(form, null, 2),
  };
  return [system, user];
}

// Providers sometimes wrap JSON in ```json fences or add stray text — extract safely.
export function parseResumeJson(raw) {
  let text = (raw || '').trim();
  text = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) text = text.slice(start, end + 1);
  return JSON.parse(text);
}
