// LLM provider abstraction (shared pattern with the AI Query Assistant service).
// Resume generation needs a single JSON completion, so the key export here is
// complete() — a non-streaming call that returns the full model output as text.
const PROVIDER = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();

export function activeModel() {
  return PROVIDER === 'openai'
    ? process.env.OPENAI_MODEL || 'gpt-4o-mini'
    : process.env.OLLAMA_MODEL || 'llama3.2';
}

/**
 * Single-shot completion. `format: 'json'` nudges providers toward valid JSON.
 * @param {{role:string, content:string}[]} messages
 * @returns {Promise<string>} full text of the model reply
 */
export async function complete(messages, { json = false } = {}) {
  return PROVIDER === 'openai'
    ? completeOpenAI(messages, json)
    : completeOllama(messages, json);
}

async function completeOllama(messages, json) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2';
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      ...(json ? { format: 'json' } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Ollama request failed (${res.status}): ${await safeText(res)}`);
  const data = await res.json();
  return data?.message?.content ?? '';
}

async function completeOpenAI(messages, json) {
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`OpenAI request failed (${res.status}): ${await safeText(res)}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

async function safeText(res) {
  try { return await res.text(); } catch { return '<no body>'; }
}
