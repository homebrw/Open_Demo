'use client';

import { useState } from 'react';
import TokenTable from './components/TokenTable';
import ProbabilityTree from './components/ProbabilityTree';
import type { TreeNode } from './components/ProbabilityTree';

interface TokenInfo {
  token: string;
  prob: number;
  logprob: number;
}

interface AnalysisResult {
  topTokens: TokenInfo[];
  tree: TreeNode[];
}

export default function Home() {
  const [phrase, setPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  async function handleAnalyze() {
    if (!phrase.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: phrase.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧠 Explorateur de Logits OpenAI
          </h1>
          <p className="text-gray-500 text-sm">
            Visualisez l&apos;arbre de probabilités des tokens générés par GPT-4o-mini
          </p>
        </header>

        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phrase à compléter
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#378ADD] focus:border-transparent transition"
            rows={3}
            placeholder="Ex: La vie est"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAnalyze();
            }}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-400">Ctrl+Enter pour analyser</span>
            <button
              onClick={handleAnalyze}
              disabled={loading || !phrase.trim()}
              className="px-6 py-2 rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#378ADD' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Construction de l&apos;arbre…
                </span>
              ) : (
                'Analyser'
              )}
            </button>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
            <strong>Erreur :</strong> {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Top tokens — premier niveau
              </h2>
              <TokenTable tokens={result.topTokens} />
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-1">
                Arbre de probabilités (profondeur 3 × 3 branches)
              </h2>
              <p className="text-xs text-gray-400 mb-5">
                Chemin glouton en bleu · hover sur un token pour voir la phrase complète et la probabilité cumulée · scroll horizontal disponible
              </p>
              <ProbabilityTree roots={result.tree} initialPhrase={phrase.trim()} />
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
