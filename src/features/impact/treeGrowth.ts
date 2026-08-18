export const TREE_GROWTH_STORAGE_KEY = 'looper:tree-growth';
export const LAST_TREE_COUNT_STORAGE_KEY = 'looper:tree-growth-last-count';

export type TreeGrowthStage = 'seed' | 'growing' | 'complete';

export function getTreeGrowthState(
  forest: {
    current_trees: number;
    progress_to_next_tree: number;
    carbon_toward_next_tree_kg_co2e: number;
    next_tree_threshold_kg_co2e: number;
  },
  previousCurrentTrees?: number,
) {
  const percent = Math.min(
    100,
    Math.max(0, Math.round((forest.progress_to_next_tree ?? 0) * 100)),
  );
  const visibleTreeCount = Math.min(Math.max(forest.current_trees, 0), 6);
  const hasNewTree =
    typeof previousCurrentTrees === 'number' &&
    forest.current_trees > previousCurrentTrees;

  let stage: TreeGrowthStage = 'seed';
  if (percent > 0 && percent < 100) stage = 'growing';
  if (percent >= 100) stage = 'complete';

  return {
    percent,
    stage,
    visibleTreeCount,
    hasNewTree,
  };
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

export function shouldSkipTreeGrowth(
  activityId?: string | null,
  storage: Pick<Storage, 'getItem'> = getStorage() ?? {
    getItem: () => null,
  },
): boolean {
  if (!activityId) return false;

  const raw = storage.getItem(TREE_GROWTH_STORAGE_KEY);
  if (!raw) return false;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.includes(activityId);
    return raw === activityId || parsed === activityId;
  } catch {
    return raw === activityId;
  }
}

export function markTreeGrowthPlayed(
  activityId?: string | null,
  storage: Pick<Storage, 'getItem' | 'setItem'> = getStorage() ?? {
    getItem: () => null,
    setItem: () => undefined,
  },
): void {
  if (!activityId) return;

  const raw = storage.getItem(TREE_GROWTH_STORAGE_KEY);
  let seen: string[] = [];

  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        seen = parsed.filter(
          (value): value is string => typeof value === 'string',
        );
      } else if (typeof parsed === 'string') {
        seen = [parsed];
      }
    } catch {
      seen = raw
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    }
  }

  if (!seen.includes(activityId)) {
    seen.push(activityId);
    storage.setItem(TREE_GROWTH_STORAGE_KEY, JSON.stringify(seen));
  }
}

export function getPreviousCurrentTrees(
  storage: Pick<Storage, 'getItem'> = getStorage() ?? {
    getItem: () => null,
  },
): number | null {
  const raw = storage.getItem(LAST_TREE_COUNT_STORAGE_KEY);
  if (raw == null || raw === '') return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function setPreviousCurrentTrees(
  currentTrees: number,
  storage: Pick<Storage, 'setItem'> = getStorage() ?? {
    setItem: () => undefined,
  },
): void {
  storage.setItem(LAST_TREE_COUNT_STORAGE_KEY, String(currentTrees));
}
