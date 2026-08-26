export const MAX_CAMPAIGN_ROUNDS = 30;
export const PAYMENT_INTERVAL = 3;

// Costs are indexed by payment checkpoint: rounds 3, 6, 9, ..., 30.
export const PAYMENT_COSTS = [20, 25, 30, 35, 40, 45, 50, 55, 60, 80];

export function getPaymentCost(round) {
  if (round <= 0 || round % PAYMENT_INTERVAL !== 0) return 0;

  const checkpointIndex = (round / PAYMENT_INTERVAL) - 1;
  return PAYMENT_COSTS[checkpointIndex] || 0;
}