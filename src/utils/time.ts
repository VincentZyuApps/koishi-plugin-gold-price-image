const UNIT_MULTIPLIERS: Record<string, number> = {
  m: 1 / 60,
  minute: 1 / 60,
  minutes: 1 / 60,
  分: 1 / 60,
  分钟: 1 / 60,
  h: 1,
  hour: 1,
  hours: 1,
  时: 1,
  小时: 1,
  d: 24,
  day: 24,
  days: 24,
  天: 24,
  日: 24,
};

export function getTimeUnitMultiplier(unit: string): number | undefined {
  return UNIT_MULTIPLIERS[unit.toLowerCase()];
}

export function getTimeUnitDisplayName(unit: string): string {
  const unitLower = unit.toLowerCase();
  if (['m', 'minute', 'minutes'].includes(unitLower) || unit === '分' || unit === '分钟') return '分钟';
  if (['h', 'hour', 'hours'].includes(unitLower) || unit === '时' || unit === '小时') return '小时';
  return '天';
}
