import { LandingScreen } from './components/LandingScreen';
import { ViewerScreen } from './components/viewer/ViewerScreen';
import { useDecayController } from './hooks/useDecayController';
import { useSessionSettings } from './hooks/useSessionSettings';
import { shouldShowWarningNotice } from './lib/app/constants';
import { formatDateTime } from './lib/app/formatters';
import { sampleOptions } from './lib/app/sampleLibrary';

function App() {
  const { settings, settingsRef, hasLoadError } = useSessionSettings();
  const {
    playback,
    upload,
    frameVersion,
    screenMode,
    isLoading,
    showOriginal,
    hasEnded,
    notice,
    originalCanvas,
    currentCanvas,
    handleUpload,
    handleSampleSelect,
    handlePlayPause,
    handleBackToLanding,
    handleReset,
    handleCompareToggle,
    handleDownload,
    shiftSpeed,
  } = useDecayController({
    settings,
    settingsRef,
    hasLoadError,
  });

  const shouldShowNotice = shouldShowWarningNotice(notice);
  const sessionStartedAtMs = playback.wallClock.sessionStartedAtMs;
  const simulatedNowMs = sessionStartedAtMs === null ? null : sessionStartedAtMs + playback.simulation.elapsedSimMs;
  const startedAtLabel = formatDateTime(sessionStartedAtMs);
  const imageTimeLabel = formatDateTime(simulatedNowMs);
  const processingLabel =
    playback.processing.processingWidth > 0 && playback.processing.processingHeight > 0
      ? `${playback.processing.processingWidth}x${playback.processing.processingHeight}`
      : '--';

  const viewerSpeed = playback.simulation.targetGenPerSec;

  return (
    <main className="app-shell">
      {screenMode === 'landing' ? (
        <LandingScreen
          isLoading={isLoading}
          notice={notice}
          onFileSelect={handleUpload}
          onSampleSelect={handleSampleSelect}
          samples={sampleOptions}
        />
      ) : (
        <ViewerScreen
          currentCanvas={currentCanvas}
          imageTimeLabel={imageTimeLabel}
          fileName={upload?.fileName ?? 'Untitled'}
          frameVersion={frameVersion}
          generation={playback.simulation.appliedGeneration}
          hasEnded={hasEnded}
          isPlaying={playback.isPlaying}
          notice={notice}
          onBack={handleBackToLanding}
          onCompareToggle={handleCompareToggle}
          onDownload={handleDownload}
          onFaster={() => shiftSpeed(1)}
          onPlayPause={handlePlayPause}
          onReset={handleReset}
          onSlower={() => shiftSpeed(-1)}
          originalCanvas={originalCanvas}
          playback={playback}
          processingLabel={processingLabel}
          startedAtLabel={startedAtLabel}
          shouldShowNotice={shouldShowNotice}
          showOriginal={showOriginal}
          speed={viewerSpeed}
          speedLabel={`x${viewerSpeed}`}
        />
      )}
    </main>
  );
}

export default App;
