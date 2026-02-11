import type { SampleOption } from '../lib/app/sampleLibrary';
import { LandingHero } from './landing/LandingHero';
import { LandingUploadPanel } from './landing/LandingUploadPanel';

interface LandingScreenProps {
  isLoading: boolean;
  notice: string;
  onFileSelect: (file: File | null) => void;
  onSampleSelect: (sampleId: string) => void;
  samples: SampleOption[];
}

export function LandingScreen({ isLoading, notice, onFileSelect, onSampleSelect, samples }: LandingScreenProps) {
  return (
    <section className="landing-stage mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 md:px-8 md:py-12">
      <div aria-hidden className="landing-stage-glow" />
      <div className="grid w-full gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <LandingHero />
        <LandingUploadPanel
          isLoading={isLoading}
          notice={notice}
          onFileSelect={onFileSelect}
          onSampleSelect={onSampleSelect}
          samples={samples}
        />
      </div>
      <footer className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.4rem)] z-10 text-center text-[0.68rem] text-slate-500/85">
        <a
          className="underline decoration-slate-400/70 underline-offset-2 transition-colors hover:text-slate-600"
          href="https://github.com/ivgtr/image-decay"
          rel="noopener noreferrer"
          target="_blank"
        >
          View on GitHub · ivgtr/image-decay
        </a>
      </footer>
    </section>
  );
}
