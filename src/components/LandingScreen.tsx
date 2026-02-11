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
    <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 md:px-8 md:py-12">
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
    </section>
  );
}
