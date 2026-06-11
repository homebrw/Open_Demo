'use client';

import { displayToken, formatPercentage } from '@/lib/utils';

interface PathNode {
  token: string;
  prob: number;
  cumulative: number;
  phrase: string;
}

interface PathExplorerProps {
  pathLevels: PathNode[][];
  initialPhrase: string;
}

export default function PathExplorer({ pathLevels, initialPhrase }: PathExplorerProps) {
  return (
    <div className="space-y-4">
      {pathLevels.map((levelNodes, depth) => (
        <div key={depth}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Niveau {depth + 1}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {levelNodes.map((node, i) => (
              <div
                key={i}
                className="rounded-lg border p-3 text-sm"
                style={{
                  borderColor: i === 0 ? '#378ADD' : '#e5e7eb',
                  backgroundColor: i === 0 ? '#378ADD08' : '#fafafa',
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="font-mono text-xs px-1.5 py-0.5 rounded font-semibold"
                    style={{
                      backgroundColor: i === 0 ? '#378ADD20' : '#f3f4f6',
                      color: i === 0 ? '#378ADD' : '#6b7280',
                    }}
                  >
                    {displayToken(node.token)}
                  </span>
                  <span className="text-gray-400 text-xs">{formatPercentage(node.prob)}</span>
                </div>
                <p
                  className="text-gray-700 text-xs font-mono truncate"
                  title={node.phrase}
                >
                  {node.phrase}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Cumulé: {formatPercentage(node.cumulative)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
