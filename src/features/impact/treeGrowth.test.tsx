import { describe, expect, it } from 'vitest';

import {
  getTreeGrowthState,
  shouldSkipTreeGrowth,
} from '@/features/impact/treeGrowth';

describe('tree growth animation helpers', () => {
  it('0% 진행률은 아직 씨앗 단계로 표시한다', () => {
    expect(
      getTreeGrowthState({
        current_trees: 2,
        progress_to_next_tree: 0,
        carbon_toward_next_tree_kg_co2e: 0,
        next_tree_threshold_kg_co2e: 60,
      }),
    ).toMatchObject({
      percent: 0,
      visibleTreeCount: 2,
      stage: 'seed',
      hasNewTree: false,
    });
  });

  it('중간 진행률은 진행 바와 상태가 함께 반영한다', () => {
    expect(
      getTreeGrowthState({
        current_trees: 2,
        progress_to_next_tree: 0.42,
        carbon_toward_next_tree_kg_co2e: 25,
        next_tree_threshold_kg_co2e: 60,
      }),
    ).toMatchObject({
      percent: 42,
      stage: 'growing',
      visibleTreeCount: 2,
    });
  });

  it('current_trees 증가 시 완성된 나무가 한 그루 추가된다', () => {
    expect(
      getTreeGrowthState(
        {
          current_trees: 3,
          progress_to_next_tree: 0.94,
          carbon_toward_next_tree_kg_co2e: 56,
          next_tree_threshold_kg_co2e: 60,
        },
        2,
      ),
    ).toMatchObject({
      percent: 94,
      visibleTreeCount: 3,
      hasNewTree: true,
    });
  });

  it('같은 activity_id가 세션에 있으면 재실행을 막는다', () => {
    const storage = {
      getItem: (key: string) =>
        key === 'looper:tree-growth' ? 'act-42' : null,
      setItem: () => undefined,
    } as unknown as Storage;

    expect(shouldSkipTreeGrowth('act-42', storage)).toBe(true);
    expect(shouldSkipTreeGrowth('act-99', storage)).toBe(false);
  });
});
