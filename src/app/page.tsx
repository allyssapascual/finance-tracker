export default function Home() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="animate-drift pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,#c8e8db_0%,transparent_50%),radial-gradient(ellipse_at_80%_10%,#e8f0ea_0%,transparent_45%),linear-gradient(165deg,#f3f6f4_0%,#e7efe9_55%,#dce8e1_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(15,31,26,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,31,26,0.04)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16 sm:px-10">
        <p className="animate-rise font-mono text-sm tracking-[0.2em] text-accent uppercase">
          Finance Tracker
        </p>
        <h1 className="animate-rise-delayed mt-6 max-w-2xl text-4xl leading-tight font-semibold tracking-tight text-foreground sm:text-6xl">
          See where your money goes.
        </h1>
        <p className="animate-rise-late mt-5 max-w-lg text-lg leading-relaxed text-muted">
          A clean base for income, expenses, and balances — ready to extend and
          deploy on Vercel.
        </p>
        <div className="animate-rise-late mt-10 flex flex-wrap gap-3">
          <a
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-[#146349]"
          >
            Deploy to Vercel
          </a>
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center border border-foreground/15 bg-surface px-6 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:border-foreground/30"
          >
            Next.js docs
          </a>
        </div>
      </main>
    </div>
  );
}
