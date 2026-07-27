// LLM provider abstraction.
// Ownership/reasoning: the rest of the app depends ONLY on streamChat().
// Swapping Ollama <-> any OpenAI-compatible API is an env flag, not a code change.
// Both paths are async generators that yield plain text tokens as they arrive.

const PROVIDER = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();

/**
 * @param {{role:string, content:string}[]} messages
 * @returns {AsyncGenerator<string>} yields text chunks
 */
export async function* streamChat(messages) {
  if (PROVIDER === 'openai') {
    yield* streamOpenAI(messages);
  } else {
    yield* streamOllama(messages);
  }
}

export function activeModel() {
  return PROVIDER === 'openai'
    ? process.env.OPENAI_MODEL || 'gpt-4o-mini'
    : process.env.OLLAMA_MODEL || 'llama3.2';
}

// ---- Ollama (local, default) ----
// Uses the /api/chat endpoint which streams newline-delimited JSON objects.
async function* streamOllama(messages) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2';

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!res.ok || !res.body) {
    const detail = await safeText(res);
    throw new Error(`Ollama request failed (${res.status}): ${detail}`);
  }

  for await (const line of readLines(res.body)) {
    if (!line.trim()) continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      continue; // ignore partial/non-JSON keep-alives
    }
    const token = obj?.message?.content;
    if (token) yield token;
    if (obj?.done) return;
  }
}

// ---- OpenAI-compatible (OpenAI, Groq, Together, OpenRouter, ...) ----
// Uses SSE ("data: {json}\n\n"); tokens live in choices[0].delta.content.
async function* streamOpenAI(messages) {
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!res.ok || !res.body) {
    const detail = await safeText(res);
    throw new Error(`OpenAI request failed (${res.status}): ${detail}`);
  }

  for await (const line of readLines(res.body)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const payload = trimmed.slice(5).trim();
    if (payload === '[DONE]') return;
    try {
      const obj = JSON.parse(payload);
      const token = obj?.choices?.[0]?.delta?.content;
      if (token) yield token;
    } catch {
      continue;
    }
  }
}

// ---- helpers ----
// Turn a byte stream into a line stream (works for NDJSON and SSE alike).
async function* readLines(stream) {
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      yield buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
    }
  }
  if (buffer) yield buffer;
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return '<no body>';
  }
}
