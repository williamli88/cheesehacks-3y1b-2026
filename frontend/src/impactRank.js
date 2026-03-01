export const IMPACT_RANKS = [
  { minCo2: 0, icon: '🌱', label: 'Seedling' },
  { minCo2: 2, icon: '🌿', label: 'Sprout' },
  { minCo2: 8, icon: '🪴', label: 'Budding Plant' },
  { minCo2: 20, icon: '🌾', label: 'Sapling' },
  { minCo2: 50, icon: '🌲', label: 'Young Tree' },
  { minCo2: 100, icon: '🌳', label: 'Tree' }
];

export function getImpactRank(totalCo2Saved) {
  const co2 = Number.isFinite(totalCo2Saved) ? totalCo2Saved : 0;
  let selected = IMPACT_RANKS[0];
  for (const rank of IMPACT_RANKS) {
    if (co2 >= rank.minCo2) selected = rank;
  }
  return selected;
}
