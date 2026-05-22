"use client";

import { useEffect, useState } from "react";
import Leaderboard from "../components/Leaderboard";
import { getSocket } from "../lib/socket";
import type { GameState } from "../lib/types";
import { getQuestionById } from "../data";

export default function LeaderboardPage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const savedCode = window.localStorage.getItem("jeopardy_game_code");
    if (!savedCode) {
      setError("No game code found. Join a host or player first.");
      return;
    }

    setGameCode(savedCode);
    socket.emit("watch_game", { code: savedCode }, (response) => {
      if (!response.success) {
        setError(response.message ?? "Unable to watch game.");
        return;
      }
      setGameState(response.state ?? null);
    });

    socket.on("game_state", (state: GameState) => setGameState(state));
    socket.on("game_closed", ({ message }) => setError(message));

    return () => {
      socket.off("game_state");
      socket.off("game_closed");
    };
  }, []);

  const activeQuestion = gameState?.activeQuestionId ? getQuestionById(gameState.activeQuestionId) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-6 py-8">
      {error ? (
        <div className="mx-auto max-w-6xl rounded-3xl border border-rose-500/40 bg-rose-500/10 p-8 text-rose-100">{error}</div>
      ) : (
        <Leaderboard title="Leaderboard" players={gameState?.players ?? []} activeQuestion={activeQuestion} gameCode={gameCode ?? undefined} />
      )}
    </div>
  );
}
