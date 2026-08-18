import { useEffect, useMemo, useState } from 'react';

import type { ForestProgress } from '@/entities/impact/types';
import { cn } from '@/shared/lib/cn';

import {
  getPreviousCurrentTrees,
  getTreeGrowthState,
  markTreeGrowthPlayed,
  setPreviousCurrentTrees,
  shouldSkipTreeGrowth,
} from './treeGrowth';

export function SaplingGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('h-12 w-12', className)}
      aria-hidden="true"
    >
      <circle cx="24" cy="18" r="11" className="fill-brand-500" />
      <circle cx="16" cy="23" r="7" className="fill-brand-600" />
      <circle cx="32" cy="23" r="7" className="fill-brand-600" />
      <rect
        x="22"
        y="27"
        width="4"
        height="14"
        rx="1.5"
        className="fill-brand-800"
      />
    </svg>
  );
}

function TreeSeed({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        'tree-seed transition-transform duration-300',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      aria-hidden="true"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg text-brand-700">
        🌱
      </div>
    </div>
  );
}

export function TreeGrowthAnimation({
  forest,
  activityId,
  autoPlay = false,
  className,
  compact = false,
}: {
  forest: ForestProgress;
  activityId?: string | null;
  autoPlay?: boolean;
  className?: string;
  compact?: boolean;
}) {
  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const [isMounted, setIsMounted] = useState(false);
  const previousCurrentTrees = getPreviousCurrentTrees();
  const { percent, stage, visibleTreeCount, hasNewTree } = getTreeGrowthState(
    forest,
    previousCurrentTrees ?? undefined,
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!autoPlay || reducedMotion || !activityId) return;
    if (shouldSkipTreeGrowth(activityId)) return;
    markTreeGrowthPlayed(activityId);
  }, [activityId, autoPlay, reducedMotion]);

  useEffect(() => {
    if (autoPlay && !reducedMotion) {
      setPreviousCurrentTrees(forest.current_trees);
    }
  }, [autoPlay, forest.current_trees, reducedMotion]);

  const shouldAnimate = autoPlay
    ? !reducedMotion && !shouldSkipTreeGrowth(activityId)
    : false;
  const barWidth = `${Math.min(100, Math.max(0, percent))}%`;

  return (
    <>
      <style>{`
        @keyframes tree-seed-pop {
          0% { transform: scale(0.6); opacity: 0; }
          55% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes tree-stem-grow {
          0% { transform: scaleY(0.18); opacity: 0; }
          65% { transform: scaleY(0.98); opacity: 1; }
          100% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes tree-leaf-bloom {
          0% { transform: scale(0.3) rotate(-8deg); opacity: 0; }
          55% { transform: scale(1.12) rotate(4deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes tree-progress-fill {
          0% { width: 0%; }
          100% { width: var(--progress-width); }
        }
        .tree-growth-shell {
          --progress-width: 0%;
        }
        .tree-growth-shell[data-stage='seed'] .tree-seed {
          animation: tree-seed-pop 0.35s cubic-bezier(0.2, 0.9, 0.2, 1) both;
        }
        .tree-growth-shell[data-stage='growing'] .tree-progress-bar-fill {
          animation: tree-progress-fill 0.6s ease-out 0.9s both;
        }
        .tree-growth-shell[data-stage='growing'] .tree-emblem {
          animation: tree-stem-grow 0.5s ease-out 0.35s both;
        }
        .tree-growth-shell[data-stage='growing'] .tree-branch {
          animation: tree-leaf-bloom 0.35s ease-out 0.8s both;
        }
        .tree-growth-shell[data-stage='complete'] .tree-progress-bar-fill {
          animation: tree-progress-fill 0.6s ease-out 0.9s both;
        }
        .tree-growth-shell[data-stage='complete'] .tree-emblem {
          animation: tree-stem-grow 0.5s ease-out 0.35s both;
        }
        .tree-growth-shell[data-stage='complete'] .tree-branch {
          animation: tree-leaf-bloom 0.35s ease-out 0.8s both;
        }
        @media (prefers-reduced-motion: reduce) {
          .tree-growth-shell * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div
        className={cn('tree-growth-shell grid gap-2', className)}
        data-stage={shouldAnimate && isMounted ? stage : 'complete'}
        style={{
          ['--progress-width' as string]: barWidth,
        }}
      >
        <div className="flex min-h-16 items-end justify-center gap-1">
          {Array.from({ length: visibleTreeCount }, (_, index) => (
            <div
              key={`tree-${index}`}
              className={cn(
                'tree-emblem flex items-center justify-center rounded-full bg-brand-100 p-1',
                compact ? 'h-10 w-10' : 'h-12 w-12',
              )}
            >
              <span className="tree-branch">
                <SaplingGlyph className={compact ? 'h-8 w-8' : 'h-10 w-10'} />
              </span>
            </div>
          ))}
          {visibleTreeCount === 0 && (
            <TreeSeed visible={!reducedMotion && shouldAnimate} />
          )}
          {visibleTreeCount > 0 &&
            !reducedMotion &&
            shouldAnimate &&
            hasNewTree && (
              <div className="tree-burst flex items-center justify-center rounded-full bg-brand-200 p-1 text-brand-700">
                <span className="tree-branch">
                  <SaplingGlyph className={compact ? 'h-8 w-8' : 'h-10 w-10'} />
                </span>
              </div>
            )}
          {visibleTreeCount > 0 && !shouldAnimate && (
            <div className="tree-emblem flex items-center justify-center rounded-full bg-brand-100 p-1">
              <SaplingGlyph className={compact ? 'h-8 w-8' : 'h-10 w-10'} />
            </div>
          )}
        </div>

        <div className="grid gap-1.5">
          <div className="flex items-baseline justify-between text-[11px] sm:text-xs">
            <span className="text-ink-600">
              다음 나무까지{' '}
              <strong className="font-bold text-ink-900">{percent}%</strong>
            </span>
            <span className="text-ink-500 tabular-nums">
              {Math.round(forest.carbon_toward_next_tree_kg_co2e)} /{' '}
              {Math.round(forest.next_tree_threshold_kg_co2e)} kgCO₂e
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-chip bg-brand-100">
            <div
              className="tree-progress-bar-fill h-full rounded-chip bg-brand-500 transition-[width] duration-300"
              style={{ width: barWidth }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
