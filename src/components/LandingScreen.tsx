interface SampleCard {
  id: string;
  title: string;
}

interface LandingScreenProps {
  isLoading: boolean;
  notice: string;
  onFileSelect: (file: File | null) => void;
  onSampleSelect: (sampleId: string) => void;
  samples: SampleCard[];
}

const cardClass =
  'ui-btn ui-btn-secondary group relative w-full justify-start overflow-hidden rounded-2xl border px-4 text-left disabled:cursor-not-allowed disabled:opacity-50';

export function LandingScreen({ isLoading, notice, onFileSelect, onSampleSelect, samples }: LandingScreenProps) {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 md:px-8 md:py-12">
      <div className="grid w-full gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="panel-surface panel-grid relative overflow-hidden p-6 md:p-8">
          <p className="kicker">Image Decay Lab</p>
          <h1 className="mt-4 max-w-[12ch] text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-slate-900 md:text-5xl">
            JPEG劣化を可視化する
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-700 md:text-base">
            画像を再エンコードしながら、品質低下の過程をリアルタイムに観察します。再生速度と比較表示を使って、劣化の進行を検証できます。
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-300 bg-white px-4 py-4">
              <p className="micro-label">Mode</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Local Processing</p>
            </div>
            <div className="rounded-2xl border border-slate-300 bg-white px-4 py-4">
              <p className="micro-label">Metrics</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">FPS / PSNR / SSIM</p>
            </div>
            <div className="rounded-2xl border border-slate-300 bg-white px-4 py-4">
              <p className="micro-label">Control</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Speed + Compare</p>
            </div>
          </div>
        </article>

        <aside className="panel-surface p-4 md:p-6">
          <label
            className="ui-upload-drop group flex min-h-[208px] cursor-pointer flex-col items-center justify-center rounded-2xl px-4 py-6 text-center"
            htmlFor="image-input"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white text-3xl text-slate-700 transition group-hover:border-blue-500 group-hover:text-blue-700">
              +
            </span>
            <span className="mt-4 text-lg font-semibold text-slate-900">Upload Image</span>
            <span className="mt-2 text-xs text-slate-600">JPEG / PNG / WebP / GIF</span>
            <span className="mt-2 text-xs text-slate-500">max 10MB</span>
          </label>

          <div className="mt-4 rounded-2xl border border-slate-300 bg-slate-100/70 p-4">
            <p className="micro-label">Samples</p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {samples.map((sample) => (
                <button
                  className={cardClass}
                  disabled={isLoading}
                  key={sample.id}
                  onClick={() => onSampleSelect(sample.id)}
                  type="button"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-blue-600" />
                  <p className="pl-4 text-sm font-semibold text-slate-900">{sample.title}</p>
                </button>
              ))}
            </div>
          </div>

          <input
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={isLoading}
            id="image-input"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              onFileSelect(file);
              event.currentTarget.value = '';
            }}
            type="file"
          />

          <p className="mt-4 min-h-6 text-xs text-amber-700">{isLoading ? 'loading...' : notice}</p>
        </aside>
      </div>
    </section>
  );
}
