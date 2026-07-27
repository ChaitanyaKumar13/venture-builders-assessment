// Thin client for the backend microservice, including the SSE stream consumer.
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export async function listSessions() {
  const r = await fetch(`${API}/api/sessions`);
  if (!r.ok) throw new Error('Could not load sessions');
  return r.json();
}

export async function createSession() {
  const r = await fetch(`${API}/api/sessions`, { method: 'POST' });
  if (!r.ok) throw new Error('Could not create session');
  return r.json();
}

export async function getMessages(sessionId) {
  const r = await fetch(`${API}/api/sessions/${sessionId}/messages`);
  if (!r.ok) throw new Error('Could not load messages');
  return r.json();
}

export async function deleteSession(sessionId) {
  const r = await fetch(`${API}/api/sessions/${sessionId}`, { method: 'DELETE' });
  if (!r.ok) throw new Error('Could not delete session');
}

/**
 * Stream a reply. Parses the SSE frames the backend sends
 * ("data: {json}\n\n") and fires callbacks as tokens arrive.
 */
export async function streamMessage(sessionId, content, handlers = {}) {
  const { onMeta, onToken, onDone, onError } = handlers;

  const res = await fetch(`${API}/api/sessions/${sessionId}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!res.ok || !res.body) {
    onError?.(new Error(`Request failed (${res.status})`));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);

      const dataLine = frame.split('\n').find((l) => l.startsWith('data:'));
      if (!dataLine) continue;

      let data;
      try {
        data = JSON.parse(dataLine.slice(5).trim());
      } catch {
        continue;
      }

      if (data.error) onError?.(new Error(data.error));
      else if (data.token) onToken?.(data.token);
      else if (data.done) onDone?.(data);
      else if (data.model) onMeta?.(data);
    }
  }
}
