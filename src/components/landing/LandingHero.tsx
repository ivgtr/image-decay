const flowSteps = ['Upload image', 'Watch quality decay'];

export function LandingHero() {
  return (
    <article className="panel-surface landing-hero panel-grid relative overflow-hidden p-6 md:p-8">
      <h1 className="max-w-[16ch] text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-slate-900 md:text-5xl">
        IMAGE Decay
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-slate-700 md:text-base">
        画像をブラウザ内で再圧縮し、崩れていく変化を観察。
      </p>

      <section className="landing-terminal mt-7">
        <p className="landing-terminal-prompt">$ decay.run --source ./image.jpg</p>
        <ol className="mt-3 space-y-2">
          {flowSteps.map((step, index) => (
            <li className="landing-terminal-line" key={step}>
              <span className="landing-terminal-index">{`0${index + 1}`}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
