'use client';

import { useState } from 'react';
import TokenTable from './components/TokenTable';
import TokenCharts from './components/TokenCharts';
import PathExplorer from './components/PathExplorer';
import CompleteGeneration from './components/CompleteGeneration';

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

interface AnalysisResult {
  topTokens: TokenInfo[];
  pathLevels: PathNode[][];
  completeGeneration: string;
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
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧠 Explorateur de Logits OpenAI
          </h1>
          <p className="text-gray-500 text-sm">
            Visualisez les probabilités de tokens générés par GPT-4o-mini
          </p>
        </header>

        {/* Input */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phrase à analyser
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
                  Analyse…
                </span>
              ) : (
                'Analyser'
              )}
            </button>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
            <strong>Erreur :</strong> {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Top tokens table */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Top tokens suivants
              </h2>
              <TokenTable tokens={result.topTokens} />
            </section>

            {/* Charts */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Visualisation des probabilités
              </h2>
              <TokenCharts tokens={result.topTokens} />
            </section>

            {/* Path explorer */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Explorateur de chemins (4 niveaux × 3 branches)
              </h2>
              <PathExplorer pathLevels={result.pathLevels} initialPhrase={phrase.trim()} />
            </section>

            {/* Complete generation */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Génération complète
              </h2>
              <CompleteGeneration
                text={result.completeGeneration}
                initialPhrase={phrase.trim()}
              />
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
