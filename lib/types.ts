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

export interface AnalysisResult {
  topTokens: TokenInfo[];
  tree: TreeNode[];
}

export interface GenerationResult {
  text: string;
  latency: number;
  usage: { input_tokens: number; output_tokens: number; total_tokens: number } | null;
  cost: number | null;
  error?: string;
}

export interface Params {
  temperature: number;
  top_p: number;
  max_output_tokens: number;
  count: number;
}

export interface HistoryEntry {
  id: number;
  prompt: string;
  params: Params;
  results: GenerationResult[];
}
