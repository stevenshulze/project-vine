export const NICHES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Legal',
  'Marketing & Creative',
  'Sales',
  'Operations',
  'Engineering',
  'Education',
  'Real Estate',
  'Hospitality',
  'Media & Entertainment',
  'Science & Research',
  'Non-profit',
  'Executive & Leadership',
] as const

export type Niche = typeof NICHES[number]
