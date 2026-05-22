"use client";

import type { JeopardyQuestion } from "../data";
import type { PlayerState } from "../lib/types";

type LeaderboardProps = {
  title?: string;
  players: PlayerState[];
  activeQuestion?: JeopardyQuestion | null;
  gameCode?: string;
};

export default function Leaderboard({ title = "Leaderboard", players, activeQuestion, gameCode }: LeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-700 bg-slate-900/95 p-6 shadow-xl shadow-slate-950/20">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{title}</p>
            <h1 className="mt-2 text-3xl font-semibold">Live leaderboard</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Players join with the game code and wait for the host to send a question.</p>
          </div>
          <div className="rounded-3xl bg-slate-950 px-4 py-3 text-right ring-1 ring-slate-700/80">
            <p className="text-xs uppercase text-slate-500">Game ID</p>
            <p className="font-semibold text-white">{gameCode ?? "—"}</p>
          </div>
        </div>

        {activeQuestion ? (
          <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-200">Question live</p>
            <p className="mt-2 text-xl font-semibold">{activeQuestion.prompt}</p>
            <p className="mt-1 text-sm text-amber-100/80">
              {activeQuestion.categoryId} • ${activeQuestion.value}
            </p>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/95">
          <div className="grid grid-cols-[2fr_1fr] gap-0 border-b border-slate-700 bg-slate-950/95 px-6 py-4 text-slate-400">
            <span className="font-semibold">Player</span>
            <span className="font-semibold text-right">Score</span>
          </div>
          {sortedPlayers.length === 0 ? (
            <div className="px-6 py-8 text-slate-400">No players have joined yet.</div>
          ) : (
            sortedPlayers.map((player) => (
              <div key={player.id} className="grid grid-cols-[2fr_1fr] gap-0 border-b border-slate-800 px-6 py-4 last:border-b-0">
                <div>
                  <p className="font-medium text-slate-100">{player.name}</p>
                  <p className="text-sm text-slate-500">Answered {Object.keys(player.answers).length} questions</p>
                </div>
                <div className="text-right text-lg font-semibold text-white">{player.score}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
