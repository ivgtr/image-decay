interface FeatureCard {
  label: string;
  value: string;
}

const featureCards: FeatureCard[] = [
  { label: 'Mode', value: 'Local Processing' },
  { label: 'Metrics', value: 'FPS / PSNR / SSIM' },
  { label: 'Control', value: 'Speed + Compare' },
];

export function LandingHero() {
  return (
    <article className="panel-surface panel-grid relative overflow-hidden p-6 md:p-8">
      <p className="kicker">Image Decay Lab</p>
      <h1 className="mt-4 max-w-[12ch] text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-slate-900 md:text-5xl">
        JPEG劣化を可視化する
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-slate-700 md:text-base">
        画像を再エンコードしながら、品質低下の過程をリアルタイムに観察します。再生速度と比較表示を使って、劣化の進行を検証できます。
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {featureCards.map((feature) => (
          <div className="rounded-2xl border border-slate-300 bg-white px-4 py-4" key={feature.label}>
            <p className="micro-label">{feature.label}</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{feature.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
