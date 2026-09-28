// Groq LLM integration for stateless generation

import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? '';
// Primary model as specified; fallback if not available
const GROQ_MODEL = process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'llama-3.3-70b-versatile';

function getGroqClient(): Groq {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');
  return new Groq({ apiKey: GROQ_API_KEY });
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callGroq(messages: GroqMessage[], jsonMode = false): Promise<string> {
  const client = getGroqClient();
  const model = GROQ_MODEL;

  const tryCall = async (m: string): Promise<string> => {
    const completion = await client.chat.completions.create({
      model: m,
      messages,
      temperature: 0.3,
      max_tokens: 2048,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    });
    return completion.choices[0]?.message?.content ?? '';
  };

  try {
    return await tryCall(model);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // If primary model unavailable, try fallback
    if (msg.includes('model') || msg.includes('404') || msg.includes('not found')) {
      console.warn(`[groq] Primary model ${model} unavailable, falling back to ${FALLBACK_MODEL}`);
      return await tryCall(FALLBACK_MODEL);
    }
    throw err;
  }
}

export async function checkGroqHealth(): Promise<{ ok: boolean; model: string; error?: string }> {
  if (!GROQ_API_KEY) return { ok: false, model: GROQ_MODEL, error: 'GROQ_API_KEY not configured' };
  try {
    const result = await callGroq([
      { role: 'user', content: 'Reply with exactly: ok' },
    ]);
    return { ok: result.toLowerCase().includes('ok'), model: GROQ_MODEL };
  } catch (err: unknown) {
    return { ok: false, model: GROQ_MODEL, error: err instanceof Error ? err.message : String(err) };
  }
}
