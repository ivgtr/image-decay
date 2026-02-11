export const formatElapsed = (elapsedMs: number): string => {
  const totalSec = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSec % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

export const formatDateTime = (timeMs: number | null): string => {
  if (timeMs === null) {
    return '--';
  }
  return dateTimeFormatter.format(timeMs);
};
