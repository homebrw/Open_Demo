import { getOpenAIClient } from '@/lib/openai';

interface TokenInfo {
  token: string;
  prob: number;
  logprob: number;
}

interface PathNode {
  token: string;
  prob: number;
  cumulative: number;
  phrase: string;
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

async function buildPathLevel(
  phrase: string,
  topN: number = 3
): Promise<PathNode[]> {
  const tokens = await getTopLogprobs(phrase);
  return tokens.slice(0, topN).map((t) => ({
    token: t.token,
    prob: t.prob,
    cumulative: t.prob,
    phrase: phrase + t.token,
  }));
}

async function buildPathLevels(
  phrase: string,
  depth: number = 4,
  topN: number = 3
): Promise<PathNode[][]> {
  const levels: PathNode[][][] = [];

  // Level 0: branches from initial phrase
  const firstLevel = await buildPathLevel(phrase, topN);
  levels.push([firstLevel]);

  // Subsequent levels: expand each branch at the previous level
  for (let d = 1; d < depth; d++) {
    const prevBranches = levels[d - 1];
    const nextBranchGroups: PathNode[][] = [];

    for (const branch of prevBranches) {
      const expansions = await Promise.all(
        branch.map(async (node) => {
          const children = await buildPathLevel(node.phrase, topN);
          return children.map((child) => ({
            ...child,
            cumulative: node.cumulative * child.prob,
          }));
        })
      );
      nextBranchGroups.push(...expansions);
    }
    levels.push(nextBranchGroups);
  }

  // Flatten each depth level to top-N paths by cumulative probability
  return levels.map((branchGroups) => {
    const all = branchGroups.flat();
    all.sort((a, b) => b.cumulative - a.cumulative);
    return all.slice(0, topN);
  });
}

async function generateComplete(phrase: string): Promise<string> {
  const response = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Continue le texte naturellement avec le prochain token seulement.' },
      { role: 'user', content: phrase },
    ],
    max_tokens: 20,
  });
  return phrase + (response.choices[0]?.message?.content ?? '');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phrase: string = body?.phrase?.trim();

    if (!phrase) {
      return Response.json({ error: 'Le champ "phrase" est requis.' }, { status: 400 });
    }

    const [topTokens, pathLevels, completeGeneration] = await Promise.all([
      getTopLogprobs(phrase),
      buildPathLevels(phrase, 4, 3),
      generateComplete(phrase),
    ]);

    return Response.json({ topTokens, pathLevels, completeGeneration });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return Response.json({ error: message }, { status: 500 });
  }
}
