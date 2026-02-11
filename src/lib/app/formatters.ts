export const formatElapsed = (elapsedMs: number): string => {
  const totalSec = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSec % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};
