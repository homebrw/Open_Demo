import { getOpenAIClient } from '@/lib/openai';

export const maxDuration = 60;

// gpt-4.1-mini pricing (per token)
const PRICE_INPUT_PER_TOKEN = 0.40 / 1_000_000;
const PRICE_OUTPUT_PER_TOKEN = 1.60 / 1_000_000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt: string = body?.prompt?.trim();

    if (!prompt) {
      return Response.json({ error: 'Le champ "prompt" est requis.' }, { status: 400 });
    }

    const temperature: number = Math.min(Math.max(Number(body?.temperature ?? 0.7), 0), 2);
    const top_p: number = Math.min(Math.max(Number(body?.top_p ?? 1.0), 0), 1);
    const max_output_tokens: number = Math.min(Math.max(Number(body?.max_output_tokens ?? 300), 1), 4096);

    const start = Date.now();

    const response = await getOpenAIClient().responses.create({
      model: 'gpt-4.1-mini',
      input: prompt,
      temperature,
      top_p,
      max_output_tokens,
    });

    const latency = Date.now() - start;

    const text = response.output_text ?? '';
    const usage = response.usage ?? null;

    let cost: number | null = null;
    if (usage) {
      const inputCost = (usage.input_tokens ?? 0) * PRICE_INPUT_PER_TOKEN;
      const outputCost = (usage.output_tokens ?? 0) * PRICE_OUTPUT_PER_TOKEN;
      cost = inputCost + outputCost;
    }

    return Response.json({ text, usage, latency, cost });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return Response.json({ error: message }, { status: 500 });
  }
}
