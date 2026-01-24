// Helper function to get width class for progress bars
export const getWidthClass = (percentage: number): string => {
  const rounded = Math.round(percentage);
  if (rounded <= 0) return 'w-0';
  if (rounded <= 10) return 'w-10';
  if (rounded <= 20) return 'w-20';
  if (rounded <= 30) return 'w-30';
  if (rounded <= 40) return 'w-40';
  if (rounded <= 50) return 'w-50';
  if (rounded <= 60) return 'w-60';
  if (rounded <= 70) return 'w-70';
  if (rounded <= 80) return 'w-80';
  if (rounded <= 90) return 'w-90';
  return 'w-100';
};
