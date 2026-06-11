'use client';

import { displayToken, formatPercentage } from '@/lib/utils';

export interface TreeNode {
  token: string;
  prob: number;
  cumulative: number;
  phrase: string;
  children: TreeNode[];
}

const LEAF_WIDTH = 80;
const CONNECTOR_H = 18;

function countLeaves(node: TreeNode): number {
  if (node.children.length === 0) return 1;
  return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
}

type Rank = 0 | 1 | 2;

const RANK: Record<Rank, { text: string; bg: string; border: string }> = {
  0: { text: '#378ADD', bg: '#EBF4FF', border: '#378ADD' },
  1: { text: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
  2: { text: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' },
};

function NodeCard({
  node,
  rank,
  isGreedy,
}: {
  node: TreeNode;
  rank: Rank;
  isGreedy: boolean;
}) {
  const s = RANK[rank];
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="rounded text-xs font-mono font-semibold text-center px-1.5 py-1 truncate"
        style={{
          color: s.text,
          backgroundColor: isGreedy ? '#DBEAFE' : s.bg,
          border: `1.5px solid ${isGreedy ? '#378ADD' : s.border}`,
          maxWidth: 68,
          minWidth: 40,
          boxShadow: isGreedy ? '0 1px 4px #378ADD30' : undefined,
        }}
        title={`${node.phrase}\nCumulé: ${formatPercentage(node.cumulative)}`}
      >
        {displayToken(node.token)}
      </div>
      <span className="text-[10px] font-medium tabular-nums" style={{ color: s.text }}>
        {formatPercentage(node.prob)}
      </span>
    </div>
  );
}

function VLine({ isGreedy }: { isGreedy: boolean }) {
  return (
    <div
      style={{
        width: 1,
        height: CONNECTOR_H,
        flexShrink: 0,
        background: isGreedy ? '#378ADD' : '#d1d5db',
      }}
    />
  );
}

function HBridge({
  children,
  totalWidth,
}: {
  children: TreeNode[];
  totalWidth: number;
}) {
  if (children.length <= 1) return null;
  const leftOffset = (countLeaves(children[0]) * LEAF_WIDTH) / 2;
  const rightOffset = (countLeaves(children[children.length - 1]) * LEAF_WIDTH) / 2;
  return (
    <div
      className="absolute"
      style={{
        top: 0,
        left: leftOffset,
        right: rightOffset,
        height: 1,
        background: '#d1d5db',
      }}
    />
  );
}

function SubTree({
  node,
  rank,
  isGreedy,
}: {
  node: TreeNode;
  rank: Rank;
  isGreedy: boolean;
}) {
  const leafCount = countLeaves(node);
  const width = leafCount * LEAF_WIDTH;

  return (
    <div style={{ width, flexShrink: 0 }} className="flex flex-col items-center">
      <NodeCard node={node} rank={rank} isGreedy={isGreedy} />

      {node.children.length > 0 && (
        <>
          <VLine isGreedy={isGreedy} />

          <div className="relative flex" style={{ width, flexShrink: 0 }}>
            <HBridge children={node.children} totalWidth={width} />

            {node.children.map((child, i) => {
              const childLeaves = countLeaves(child);
              const childIsGreedy = isGreedy && i === 0;
              const childRank = (Math.min(i, 2)) as Rank;
              return (
                <div
                  key={i}
                  style={{ width: childLeaves * LEAF_WIDTH, flexShrink: 0 }}
                  className="flex flex-col items-center"
                >
                  <VLine isGreedy={childIsGreedy} />
                  <SubTree node={child} rank={childRank} isGreedy={childIsGreedy} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function ProbabilityTree({
  roots,
  initialPhrase,
}: {
  roots: TreeNode[];
  initialPhrase: string;
}) {
  if (roots.length === 0) return null;

  const totalLeaves = roots.reduce((sum, r) => sum + countLeaves(r), 0);
  const totalWidth = totalLeaves * LEAF_WIDTH;

  return (
    <div className="overflow-x-auto">
      <div
        style={{ minWidth: totalWidth, paddingBottom: 24 }}
        className="flex flex-col items-center"
      >
        {/* Root phrase node */}
        <div className="px-4 py-2 rounded-lg border border-blue-300 bg-blue-50 text-sm font-mono text-gray-800 shadow-sm text-center">
          {initialPhrase}
        </div>

        {/* Line from root phrase down to bridge */}
        <VLine isGreedy={true} />

        {/* Bridge + level-1 nodes */}
        <div className="relative flex" style={{ width: totalWidth, flexShrink: 0 }}>
          <HBridge children={roots} totalWidth={totalWidth} />

          {roots.map((root, i) => {
            const leafCount = countLeaves(root);
            const isGreedy = i === 0;
            const rank = (Math.min(i, 2)) as Rank;
            return (
              <div
                key={i}
                style={{ width: leafCount * LEAF_WIDTH, flexShrink: 0 }}
                className="flex flex-col items-center"
              >
                <VLine isGreedy={isGreedy} />
                <SubTree node={root} rank={rank} isGreedy={isGreedy} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
