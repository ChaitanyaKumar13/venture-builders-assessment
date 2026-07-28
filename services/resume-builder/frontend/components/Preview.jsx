'use client';

// Renders the generated resume HTML in a sandboxed iframe so the template's
// CSS is fully isolated from the app shell. This is literally the export output.
import { useMemo } from 'react';
import { renderResume } from '../lib/templates';

export default function Preview({ data, template }) {
  const html = useMemo(() => renderResume(data, template), [data, template]);
  return (
    <iframe
      title="Resume preview"
      srcDoc={html}
      className="preview-frame"
      sandbox="allow-same-origin"
    />
  );
}
