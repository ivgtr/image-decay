export interface RatePolicyInput {
  targetGenPerSec: number;
  avgGenerationCostMs: number;
}

export const computeEffectiveGenPerSec = ({ targetGenPerSec, avgGenerationCostMs }: RatePolicyInput): number => {
  const safeTarget = Math.max(0, targetGenPerSec);
  const safeAvgCost = Math.max(1, avgGenerationCostMs);
  const capacityGenPerSec = 1000 / safeAvgCost;
  return Math.min(safeTarget, capacityGenPerSec);
};
