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
  const response = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Continue le texte naturellement avec le prochain token seulement.' },
      { role: 'user', content: phrase },
    ],
    max_tokens: 1,
    logprobs: true,
    top_logprobs: 10,
  });

  const logprobContent = response.choices[0]?.logprobs?.content?.[0]?.top_logprobs ?? [];
  return logprobContent.map((lp) => ({
    token: lp.token,
    prob: Math.exp(lp.logprob),
    logprob: lp.logprob,
  }));
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
