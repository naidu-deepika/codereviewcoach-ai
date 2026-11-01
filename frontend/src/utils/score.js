// Status shown next to a score. These thresholds are display labels only.
export function scoreStatus(score) {
  if (typeof score !== 'number') return { label: 'Not scored', tone: 'bg-paper-dim text-ink-soft' }
  if (score >= 80) return { label: 'Strong', tone: 'bg-moss-tint text-moss' }
  if (score >= 50) return { label: 'Fair', tone: 'bg-amber-tint text-ink' }
  return { label: 'Needs work', tone: 'bg-crimson-tint text-crimson' }
}

export const SCORE_FILTERS = [
  { value: 'any', label: 'Any score', test: () => true },
  { value: 'strong', label: 'Strong (80+)', test: (s) => s >= 80 },
  { value: 'fair', label: 'Fair (50-79)', test: (s) => s >= 50 && s < 80 },
  { value: 'low', label: 'Needs work (under 50)', test: (s) => s < 50 },
]
