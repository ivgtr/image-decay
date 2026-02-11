import { LandingScreen } from './components/LandingScreen';
import { ViewerScreen } from './components/viewer/ViewerScreen';
import { useDecayController } from './hooks/useDecayController';
import { useSessionSettings } from './hooks/useSessionSettings';
import { shouldShowWarningNotice } from './lib/app/constants';
import { formatElapsed } from './lib/app/formatters';
import { sampleOptions } from './lib/app/sampleLibrary';

function App() {
  const { settings, settingsRef, hasLoadError, mergeSettings } = useSessionSettings();
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
    shiftSpeed,
  } = useDecayController({
    settings,
    settingsRef,
    hasLoadError,
    mergeSettings,
  });

  const shouldShowNotice = shouldShowWarningNotice(notice);

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
          elapsedLabel={formatElapsed(playback.elapsedMs)}
          fileName={upload?.fileName ?? 'Untitled'}
          frameVersion={frameVersion}
          generation={playback.generation}
          hasEnded={hasEnded}
          isPlaying={playback.isPlaying}
          notice={notice}
          onBack={handleBackToLanding}
          onCompareToggle={handleCompareToggle}
          onFaster={() => shiftSpeed(1)}
          onPlayPause={handlePlayPause}
          onReset={handleReset}
          onSlower={() => shiftSpeed(-1)}
          originalCanvas={originalCanvas}
          playback={playback}
          shouldShowNotice={shouldShowNotice}
          showOriginal={showOriginal}
          speed={settings.speed}
          speedLabel={`x${settings.speed}`}
        />
      )}
    </main>
  );
}

export default App;
