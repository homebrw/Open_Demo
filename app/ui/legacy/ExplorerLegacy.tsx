'use client';

import { useState } from 'react';
import TokenTable from '../../components/TokenTable';
import ProbabilityTree from '../../components/ProbabilityTree';
import { useT } from '../../locale/useT';
import { useLocale } from '../../locale/LocaleProvider';
import type { AnalysisResult, TreeNode } from '@/lib/types';

function getGreedyCompletion(roots: TreeNode[], initialPhrase: string) {
  if (roots.length === 0) return null;
  let node = roots[0];
  while (node.children.length > 0) node = node.children[0];
  return { full: node.phrase, added: node.phrase.slice(initialPhrase.length) };
}

const DEPTH_OPTIONS = [2, 3, 4, 5];

export default function ExplorerLegacy() {
  const t = useT();
  const locale = useLocale();
  const [phrase, setPhrase] = useState('');
  const [depth, setDepth] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [usedPhrase, setUsedPhrase] = useState('');

  async function handleAnalyze() {
    if (!phrase.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: phrase.trim(), depth, locale }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.common.unknownError);
      setResult(data);
      setUsedPhrase(phrase.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.unknownError);
    } finally {
      setLoading(false);
    }
  }

  const greedy = result ? getGreedyCompletion(result.tree, usedPhrase) : null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t.explorerLegacy.title}
          </h1>
          <p className="text-gray-500 text-sm">
            {t.explorerLegacy.subtitle}
          </p>
        </header>

        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.explorerLegacy.phraseLabel}
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#378ADD] focus:border-transparent transition"
            rows={3}
            placeholder={t.explorerLegacy.phrasePlaceholder}
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAnalyze();
            }}
          />

          <div className="flex items-center justify-between mt-4">
            {/* Depth selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">{t.explorerLegacy.depthLabel}</span>
              <div className="flex gap-1">
                {DEPTH_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDepth(d)}
                    className="w-8 h-8 rounded-lg text-xs font-semibold transition-all border"
                    style={{
                      backgroundColor: depth === d ? '#378ADD' : 'white',
                      color: depth === d ? 'white' : '#6b7280',
                      borderColor: depth === d ? '#378ADD' : '#e5e7eb',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-400">
                {t.explorerLegacy.depthSuffix(Math.pow(3, depth), (Math.pow(3, depth) - 1) / 2 + 1)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{t.explorerLegacy.ctrlEnter}</span>
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
                    {t.explorerLegacy.building}
                  </span>
                ) : (
                  t.explorerLegacy.analyze
                )}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
            <strong>{t.explorerLegacy.errorLabel}</strong> {error}
          </div>
        )}

        {result && greedy && (
          <div className="space-y-6">
            {/* Greedy completion */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-3">
                {t.explorerLegacy.greedyTitle}
              </h2>
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                <span className="text-gray-600">{usedPhrase}</span>
                <span className="text-[#378ADD] font-semibold">{greedy.added}</span>
              </div>
            </section>

            {/* Top tokens table */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                {t.explorerLegacy.topTokensTitle}
              </h2>
              <TokenTable tokens={result.topTokens} />
            </section>

            {/* Probability tree */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-1">
                {t.explorerLegacy.treeTitle(depth)}
              </h2>
              <p className="text-xs text-gray-400 mb-5">
                {t.explorerLegacy.treeHint}
              </p>
              <ProbabilityTree roots={result.tree} initialPhrase={usedPhrase} />
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
