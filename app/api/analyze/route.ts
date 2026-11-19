import { getOpenAIClient } from '@/lib/openai';
import { checkRateLimit, clientIp } from '@/lib/rateLimit';
import { serverErrors, parseLocaleFromBody } from '@/lib/i18n';
import type { TokenInfo, TreeNode } from '@/lib/types';
import { ANALYZE_MODEL } from '@/lib/models';

export const maxDuration = 60;

const MAX_PHRASE_LENGTH = 400;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 10 * 60 * 1000;

class Semaphore {
  private queue: (() => void)[] = [];
  private running = 0;
  constructor(private limit: number) {}
  async acquire() {
    if (this.running < this.limit) { this.running++; return; }
    await new Promise<void>(resolve => this.queue.push(resolve));
    this.running++;
  }
  release() { this.running--; this.queue.shift()?.(); }
}

async function getTopLogprobs(phrase: string, sem: Semaphore): Promise<TokenInfo[]> {
  await sem.acquire();
  try {
    // gpt-3.5-turbo-instruct (legacy completions API) is deprecated: use Chat Completions
    // with logprobs, prompting the model to continue the text verbatim.
    const response = await getOpenAIClient().chat.completions.create({
      model: ANALYZE_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a text-continuation engine. Continue the user text exactly where it stops, ' +
            'as if you were completing the same sentence. Output only the continuation, with no ' +
            'quotes, preamble or repetition of the input. Include a leading space if the next word needs one.',
        },
        { role: 'user', content: phrase },
      ],
      max_completion_tokens: 1,
      temperature: 0,
      logprobs: true,
      top_logprobs: 5,
    });
    const topLogprobs = Object.fromEntries(
      (response.choices[0]?.logprobs?.content?.[0]?.top_logprobs ?? []).map(t => [t.token, t.logprob]),
    );
    return Object.entries(topLogprobs)
      .map(([token, logprob]) => ({ token, prob: Math.exp(logprob), logprob }))
      .sort((a, b) => b.prob - a.prob);
  } finally {
    sem.release();
  }
}

async function buildTree(
  phrase: string,
  depth: number,
  cumulative: number,
  sem: Semaphore,
  topN = 3
): Promise<TreeNode[]> {
  if (depth === 0) return [];

  const tokens = await getTopLogprobs(phrase, sem);

  return Promise.all(
    tokens.slice(0, topN).map(async (t) => {
      const childPhrase = phrase + t.token;
      const childCumulative = cumulative * t.prob;
      return {
        token: t.token,
        prob: t.prob,
        cumulative: childCumulative,
        phrase: childPhrase,
        children: await buildTree(childPhrase, depth - 1, childCumulative, sem, topN),
      };
    })
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const errors = serverErrors[parseLocaleFromBody(body?.locale)];

  try {
    if (!checkRateLimit(`analyze:${clientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
      return Response.json({ error: errors.tooManyRequests }, { status: 429 });
    }

    const phrase: string = body?.phrase?.trim();

    if (!phrase) {
      return Response.json({ error: errors.phraseRequired }, { status: 400 });
    }

    if (phrase.length > MAX_PHRASE_LENGTH) {
      return Response.json(
        { error: errors.phraseTooLong(MAX_PHRASE_LENGTH) },
        { status: 400 },
      );
    }

    const depth: number = Math.min(Math.max(Number(body?.depth) || 4, 1), 5);
    const sem = new Semaphore(6);

    // Single root call — reused for both the table and tree root level
    const allRootTokens = await getTopLogprobs(phrase, sem);

    // Build the tree: top 3 root tokens expanded (depth-1) more levels in parallel
    const tree = await Promise.all(
      allRootTokens.slice(0, 3).map(async (t) => {
        const childPhrase = phrase + t.token;
        const childCumulative = t.prob;
        return {
          token: t.token,
          prob: t.prob,
          cumulative: childCumulative,
          phrase: childPhrase,
          children: await buildTree(childPhrase, depth - 1, childCumulative, sem, 3),
        };
      })
    );

    return Response.json({ topTokens: allRootTokens, tree });
  } catch (err) {
    const message = err instanceof Error ? err.message : errors.unknownError;
    return Response.json({ error: message }, { status: 500 });
  }
}
