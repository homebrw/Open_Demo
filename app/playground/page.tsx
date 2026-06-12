'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';

const MODEL = 'gpt-4.1-mini';

const QUICK_PROMPTS = [
  { label: 'ML pour enfant', text: 'Explique le machine learning à un enfant de 8 ans.' },
  { label: 'Slogan IA', text: 'Écris un slogan accrocheur pour une agence spécialisée en intelligence artificielle.' },
  { label: 'Produit absurde', text: 'Invente un produit absurde et inutile, avec un nom, une description et un prix.' },
  { label: 'Pirate', text: 'Raconte une courte histoire de pirate en 3 paragraphes.' },
];

interface GenerationResult {
  text: string;
  latency: number;
  usage: { input_tokens: number; output_tokens: number; total_tokens: number } | null;
  cost: number | null;
  error?: string;
}

interface HistoryEntry {
  id: number;
  prompt: string;
  params: Params;
  results: GenerationResult[];
}

interface Params {
  temperature: number;
  top_p: number;
  max_output_tokens: number;
  seed: string;
  count: number;
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span
          className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
          style={{ backgroundColor: '#EBF4FF', color: '#378ADD' }}
        >
          {value.toFixed(step < 0.1 ? 2 : 1)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{ accentColor: '#378ADD' }}
      />
      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function ResultCard({
  index,
  result,
  params,
}: {
  index: number;
  result: GenerationResult;
  params: Params;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">Génération {index + 1}</span>
        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono">
          <span>{result.latency}ms</span>
          {result.usage && (
            <span>{result.usage.total_tokens} tokens</span>
          )}
          {result.cost !== null && result.cost !== undefined && (
            <span>${result.cost.toFixed(6)}</span>
          )}
        </div>
      </div>
      <div className="p-4 flex-1">
        {result.error ? (
          <p className="text-red-600 text-sm">{result.error}</p>
        ) : (
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{result.text}</p>
        )}
      </div>
    </div>
  );
}

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState('');
  const [params, setParams] = useState<Params>({
    temperature: 0.7,
    top_p: 1.0,
    max_output_tokens: 300,
    seed: '',
    count: 1,
  });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(0);

  const setParam = useCallback(<K extends keyof Params>(key: K, value: Params[K]) => {
    setParams((p) => ({ ...p, [key]: value }));
  }, []);

  async function runGenerate(runPrompt: string, runParams: Params) {
    if (!runPrompt.trim()) return;
    setLoading(true);
    setError(null);

    const seed = runParams.seed.trim() !== '' ? parseInt(runParams.seed, 10) : undefined;

    try {
      const calls = Array.from({ length: runParams.count }, () =>
        fetch('/api/playground', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: runPrompt.trim(),
            temperature: runParams.temperature,
            top_p: runParams.top_p,
            max_output_tokens: runParams.max_output_tokens,
            seed,
          }),
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok) return { text: '', usage: null, latency: 0, cost: null, error: data.error ?? 'Erreur serveur' };
          return data as GenerationResult;
        })
      );

      const results = await Promise.all(calls);
      const entry: HistoryEntry = { id: nextId.current++, prompt: runPrompt.trim(), params: { ...runParams }, results };
      setHistory((h) => [entry, ...h]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  function handleGenerate() {
    runGenerate(prompt, params);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/"
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              ← Explorateur de Logits
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎛️ Playground de paramètres
          </h1>
          <p className="text-gray-500 text-sm">
            Expérimentez l&apos;impact de la température, top_p et des autres paramètres sur les sorties de{' '}
            <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{MODEL}</span>
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          {/* Left column: params + prompt */}
          <div className="space-y-5">
            {/* Prompt */}
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt
              </label>

              {/* Quick prompts */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => setPrompt(q.text)}
                    className="text-xs px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 text-gray-600 transition"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <textarea
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#378ADD] focus:border-transparent transition"
                rows={5}
                placeholder="Entrez votre prompt ici…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate();
                }}
              />
              <p className="text-[10px] text-gray-400 mt-1">Ctrl+Enter pour générer</p>
            </section>

            {/* Parameters */}
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-5">
              <h2 className="text-sm font-semibold text-gray-800">Paramètres</h2>

              <SliderField
                label="Temperature"
                value={params.temperature}
                min={0}
                max={2}
                step={0.1}
                onChange={(v) => setParam('temperature', v)}
              />
              <SliderField
                label="Top_p"
                value={params.top_p}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => setParam('top_p', v)}
              />

              {/* Max tokens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max output tokens
                </label>
                <input
                  type="number"
                  min={1}
                  max={4096}
                  value={params.max_output_tokens}
                  onChange={(e) => setParam('max_output_tokens', Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#378ADD] focus:border-transparent transition"
                />
              </div>

              {/* Seed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seed <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={params.seed}
                    onChange={(e) => setParam('seed', e.target.value)}
                    placeholder="Vide = aléatoire"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#378ADD] focus:border-transparent transition"
                  />
                  <button
                    onClick={() => setParam('seed', String(Math.floor(Math.random() * 1_000_000)))}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition whitespace-nowrap"
                    title="Générer un seed aléatoire"
                  >
                    🎲
                  </button>
                </div>
              </div>

              {/* Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de générations
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setParam('count', n)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border"
                      style={{
                        backgroundColor: params.count === n ? '#378ADD' : 'white',
                        color: params.count === n ? 'white' : '#6b7280',
                        borderColor: params.count === n ? '#378ADD' : '#e5e7eb',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#378ADD' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Génération en cours…
                  </span>
                ) : (
                  'Générer'
                )}
              </button>
            </section>

            {/* Pedagogy card */}
            <section className="bg-white rounded-xl border border-blue-100 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">💡 Guide des paramètres</h2>
              <dl className="space-y-3 text-xs text-gray-600">
                <div>
                  <dt className="font-semibold text-gray-700 mb-0.5">Temperature</dt>
                  <dd>Contrôle la créativité. À 0, le modèle choisit toujours le token le plus probable. À 2, il explore des alternatives improbables — plus surprenant mais moins cohérent.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-700 mb-0.5">Top_p</dt>
                  <dd>Filtre le vocabulaire candidat. À 0.1, seuls les tokens représentant les 10 % de probabilité cumulée sont éligibles. À 1.0, tout le vocabulaire est disponible.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-700 mb-0.5">Max output tokens</dt>
                  <dd>Longueur maximale de la réponse en tokens (≈ ¾ d&apos;un mot en français). Une valeur trop basse tronque la réponse.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-700 mb-0.5">Seed</dt>
                  <dd>Fixe le générateur aléatoire. Deux appels avec le même seed et les mêmes paramètres produisent (en théorie) la même réponse — utile pour reproduire un résultat.</dd>
                </div>
              </dl>
            </section>
          </div>

          {/* Right column: history */}
          <div className="flex flex-col gap-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                <strong>Erreur :</strong> {error}
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-3">
                <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#378ADD" strokeWidth="4" />
                  <path className="opacity-75" fill="#378ADD" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="text-sm text-gray-500">Génération en cours…</span>
              </div>
            )}

            {history.map((entry) => (
              <div key={entry.id} className="space-y-3">
                {/* Entry header: prompt + params + rerun */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-mono truncate mb-2">
                        &ldquo;{entry.prompt}&rdquo;
                      </p>
                      <div className="flex items-center flex-wrap gap-1.5">
                        {[
                          ['temp', entry.params.temperature.toFixed(1)],
                          ['top_p', entry.params.top_p.toFixed(2)],
                          ['max_tokens', String(entry.params.max_output_tokens)],
                          ['seed', entry.params.seed || 'aléatoire'],
                        ].map(([k, v]) => (
                          <span
                            key={k}
                            className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{ backgroundColor: '#EBF4FF', color: '#378ADD' }}
                          >
                            {k}={v}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => runGenerate(entry.prompt, entry.params)}
                      disabled={loading}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition shrink-0"
                    >
                      🔄 Relancer
                    </button>
                  </div>
                </div>

                {/* Result cards */}
                <div
                  className={`grid gap-3 ${
                    entry.results.length === 1
                      ? 'grid-cols-1'
                      : entry.results.length === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : entry.results.length === 3
                      ? 'grid-cols-1 sm:grid-cols-3'
                      : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
                  }`}
                >
                  {entry.results.map((r, i) => (
                    <ResultCard key={i} index={i} result={r} params={entry.params} />
                  ))}
                </div>
              </div>
            ))}

            {history.length === 0 && !loading && (
              <div className="flex-1 flex items-center justify-center min-h-[300px]">
                <p className="text-gray-400 text-sm text-center">
                  Entrez un prompt et cliquez sur <strong>Générer</strong> pour voir les résultats ici.
                  <br />
                  <span className="text-xs">Chaque génération s&apos;empile en haut pour faciliter la comparaison.</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
