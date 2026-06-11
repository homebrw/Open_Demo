import { getOpenAIClient } from '@/lib/openai';

export const maxDuration = 60;

export interface TokenInfo {
  token: string;
  prob: number;
  logprob: number;
}

export interface TreeNode {
  token: string;
  prob: number;
  cumulative: number;
  phrase: string;
  children: TreeNode[];
}

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
    // Legacy completions API (gpt-3.5-turbo-instruct) gives true text-continuation logprobs
    const response = await getOpenAIClient().completions.create({
      model: 'gpt-3.5-turbo-instruct',
      prompt: phrase,
      max_tokens: 1,
      logprobs: 5,
    });
    const topLogprobs = response.choices[0]?.logprobs?.top_logprobs?.[0] ?? {};
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
  try {
    const body = await request.json();
    const phrase: string = body?.phrase?.trim();

    if (!phrase) {
      return Response.json({ error: 'Le champ "phrase" est requis.' }, { status: 400 });
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
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return Response.json({ error: message }, { status: 500 });
  }
}
