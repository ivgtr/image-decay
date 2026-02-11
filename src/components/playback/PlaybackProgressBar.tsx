interface PlaybackProgressBarProps {
  progress?: number;
}

const clampPercentage = (progress: number): number => {
  return Math.min(100, Math.max(0, progress * 100));
};

export function PlaybackProgressBar({ progress }: PlaybackProgressBarProps) {
  if (typeof progress !== 'number' || !Number.isFinite(progress)) {
    return (
      <div className="h-1 w-full overflow-hidden bg-slate-200">
        <div className="ui-progress-indeterminate h-full w-2/5 bg-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-1 w-full bg-slate-200">
      <div
        className="h-full bg-blue-600 transition-[width] duration-200"
        style={{ width: `${clampPercentage(progress)}%` }}
      />
    </div>
  );
}
