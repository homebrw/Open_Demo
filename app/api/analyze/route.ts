import { getOpenAIClient } from '@/lib/openai';

export const maxDuration = 30;

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

async function getTopLogprobs(phrase: string): Promise<TokenInfo[]> {
  // Legacy completions API (gpt-3.5-turbo-instruct) gives true text-continuation
  // logprobs, unlike chat completions which generates conversational responses.
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
}

async function buildTree(
  phrase: string,
  depth: number,
  cumulative: number,
  topN = 3
): Promise<TreeNode[]> {
  if (depth === 0) return [];

  const tokens = await getTopLogprobs(phrase);

  return Promise.all(
    tokens.slice(0, topN).map(async (t) => {
      const childPhrase = phrase + t.token;
      const childCumulative = cumulative * t.prob;
      return {
        token: t.token,
        prob: t.prob,
        cumulative: childCumulative,
        phrase: childPhrase,
        children: await buildTree(childPhrase, depth - 1, childCumulative, topN),
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

    // Single root call — reused for both the table and tree root level
    const allRootTokens = await getTopLogprobs(phrase);

    // Build the tree: top 3 root tokens expanded 2 more levels in parallel
    const tree = await Promise.all(
      allRootTokens.slice(0, 3).map(async (t) => {
        const childPhrase = phrase + t.token;
        const childCumulative = t.prob;
        return {
          token: t.token,
          prob: t.prob,
          cumulative: childCumulative,
          phrase: childPhrase,
          children: await buildTree(childPhrase, 2, childCumulative, 3),
        };
      })
    );

    return Response.json({ topTokens: allRootTokens, tree });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return Response.json({ error: message }, { status: 500 });
  }
}
