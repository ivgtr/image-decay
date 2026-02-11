interface PlaybackProgressBarProps {
  progress: number;
}

const clampPercentage = (progress: number): number => {
  return Math.min(100, Math.max(0, progress * 100));
};

export function PlaybackProgressBar({ progress }: PlaybackProgressBarProps) {
  return (
    <div className="h-1 w-full bg-slate-200">
      <div
        className="h-full bg-blue-600 transition-[width] duration-200"
        style={{ width: `${clampPercentage(progress)}%` }}
      />
    </div>
  );
}
