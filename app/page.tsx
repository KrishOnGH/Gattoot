import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-6 py-16">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-800 bg-slate-900/95 p-10 shadow-2xl shadow-slate-950/40">
        <div className="space-y-6 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Jeopardy game</p>
          <h1 className="text-5xl font-semibold tracking-tight text-white">Host or join a live Jeopardy session</h1>
          <p className="mx-auto max-w-2xl text-base leading-8 text-slate-400">
            Pick whether you want to create the board as the host or join as a player. Questions, categories, and scores are hard-coded for a focused demo experience.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          <Link
            href="/host"
            className="rounded-[2rem] border border-amber-500 bg-amber-500/10 px-8 py-10 text-center text-2xl font-semibold text-amber-200 transition hover:border-amber-400 hover:bg-amber-500/20"
          >
            Host a game
          </Link>
          <Link
            href="/player"
            className="rounded-[2rem] border border-slate-700 bg-slate-800 px-8 py-10 text-center text-2xl font-semibold text-white transition hover:border-slate-500 hover:bg-slate-700"
          >
            Join as a player
          </Link>
        </div>
      </div>
    </main>
  );
}
