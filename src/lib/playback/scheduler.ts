import { computeEffectiveGenPerSec } from './ratePolicy';

export interface SchedulerState {
  generationDebt: number;
  avgGenerationCostMs: number;
}

export interface SchedulerPlanInput {
  scheduler: SchedulerState;
  deltaMs: number;
  targetGenPerSec: number;
  batch: number;
}

export interface SchedulerPlan {
  effectiveGenPerSec: number;
  stepsToRun: number;
  scheduler: SchedulerState;
}

const EMA_PREV_WEIGHT = 0.8;
const EMA_NEXT_WEIGHT = 0.2;

export const createSchedulerState = (avgGenerationCostMs: number): SchedulerState => {
  return {
    generationDebt: 0,
    avgGenerationCostMs: Math.max(1, avgGenerationCostMs),
  };
};

export const planSchedulerTick = ({ scheduler, deltaMs, targetGenPerSec, batch }: SchedulerPlanInput): SchedulerPlan => {
  const safeBatch = Math.max(1, Math.floor(batch));
  const safeDeltaMs = Math.max(0, deltaMs);
  const effectiveGenPerSec = computeEffectiveGenPerSec({
    targetGenPerSec,
    avgGenerationCostMs: scheduler.avgGenerationCostMs,
  });
  const nextDebtRaw = scheduler.generationDebt + (safeDeltaMs / 1000) * effectiveGenPerSec;
  const maxDebt = Math.max(safeBatch, targetGenPerSec);
  const generationDebt = Math.min(nextDebtRaw, maxDebt);
  const stepsToRun = Math.min(safeBatch, Math.floor(generationDebt));

  return {
    effectiveGenPerSec,
    stepsToRun,
    scheduler: {
      ...scheduler,
      generationDebt,
    },
  };
};

export const settleSchedulerAfterProcess = (
  scheduler: SchedulerState,
  processed: number,
  tickCostMs: number,
): SchedulerState => {
  if (processed <= 0) {
    return scheduler;
  }

  const generationDebt = Math.max(0, scheduler.generationDebt - processed);
  const generationCostMs = Math.max(1, tickCostMs / processed);
  const avgGenerationCostMs = scheduler.avgGenerationCostMs * EMA_PREV_WEIGHT + generationCostMs * EMA_NEXT_WEIGHT;

  return {
    generationDebt,
    avgGenerationCostMs,
  };
};
