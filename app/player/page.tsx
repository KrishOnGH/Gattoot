"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Leaderboard from "../components/Leaderboard";
import QuestionPanel from "../components/QuestionPanel";
import { getQuestionById, JeopardyQuestion } from "../data";
import { getSocket } from "../lib/socket";
import type { GameState, QuestionStartedPayload } from "../lib/types";

export default function PlayerPage() {
  const [socketConnected, setSocketConnected] = useState(false);
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionStartedPayload | null>(null);
  const [savedGameCode, setSavedGameCode] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | "timeout" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSavedGameCode(window.localStorage.getItem("jeopardy_game_code"));

    const socket = getSocket();

    const handleConnected = () => setSocketConnected(true);
    const handleDisconnected = () => setSocketConnected(false);

    socket.on("connect", handleConnected);
    socket.on("disconnect", handleDisconnected);
    socket.on("game_state", (state: GameState) => {
      setGameState(state);
      if (!state.activeQuestionId) {
        setCurrentQuestion(null);
        setSelectedIndex(null);
        setResult(null);
      }
    });
    socket.on("question_started", (payload: QuestionStartedPayload) => {
      setCurrentQuestion(payload);
      setSelectedIndex(null);
      setResult(null);
    });
    socket.on("game_closed", ({ message }) => setError(message));

    return () => {
      socket.off("connect", handleConnected);
      socket.off("disconnect", handleDisconnected);
      socket.off("game_state");
      socket.off("question_started");
      socket.off("game_closed");
    };
  }, []);

  const player = useMemo(() => gameState?.players.find((player) => player.id === playerId) ?? null, [gameState, playerId]);
  const activeQuestion = currentQuestion ? currentQuestion.question : gameState?.activeQuestionId ? getQuestionById(gameState.activeQuestionId) : null;
  const hasAnswered = Boolean(player && activeQuestion && player.answers[activeQuestion.id]);
  const showQuestion = Boolean(activeQuestion && !hasAnswered && playerId);

  const submitJoin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = joinCode.trim().toUpperCase();
    if (!name.trim() || !normalizedCode) {
      setError("Name and game code are required.");
      return;
    }

    const socket = getSocket();
    socket.emit("join_game", { code: normalizedCode, name: name.trim() }, (response) => {
      if (!response.success) {
        setError(response.message ?? "Unable to join game.");
        return;
      }
      setPlayerId(response.playerId ?? null);
      setGameState(response.state ?? null);
      setError(null);
      localStorage.setItem("jeopardy_player_name", name.trim());
      localStorage.setItem("jeopardy_game_code", normalizedCode);
      setSavedGameCode(normalizedCode);
    });
  };

  const handleAnswer = (index: number) => {
    if (!activeQuestion) return;
    setSelectedIndex(index);
    const socket = getSocket();
    socket.emit("submit_answer", { code: localStorage.getItem("jeopardy_game_code") ?? "", questionId: activeQuestion.id, answerIndex: index }, (response) => {
      if (!response.success) {
        setError(response.message ?? "Unable to submit answer.");
        return;
      }
      setResult(response.correct ? "correct" : "wrong");
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-700 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Player portal</p>
            <h1 className="mt-2 text-4xl font-semibold">Join the game and wait for the next clue</h1>
          </div>
          <Link href="/leaderboard" className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
            Full leaderboard
          </Link>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 text-rose-100">{error}</div>
        ) : null}

        {!playerId ? (
          <form onSubmit={submitJoin} className="rounded-3xl border border-slate-700 bg-slate-900/95 p-8 shadow-xl shadow-slate-950/20">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Enter your name and game code</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Player name"
                className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-slate-100 outline-none focus:border-amber-500"
              />
              <input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="Game code"
                className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-slate-100 outline-none focus:border-amber-500"
              />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="submit" className="rounded-3xl bg-amber-500 px-6 py-4 font-semibold text-slate-950 transition hover:bg-amber-400">
                Join game
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-3xl border border-slate-700 bg-slate-900/95 p-6 shadow-xl shadow-slate-950/20">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Signed in as</p>
            <p className="mt-2 text-2xl font-semibold">{name}</p>
            <p className="mt-2 text-sm text-slate-500">Game code: {savedGameCode ?? ""}</p>
          </div>
        )}

        {showQuestion && activeQuestion ? (
          <QuestionPanel
            question={activeQuestion}
            expiresAt={currentQuestion?.expiresAt ?? gameState?.expiresAt ?? Date.now()}
            onChoice={handleAnswer}
            selectedIndex={selectedIndex}
            result={result}
          />
        ) : (
          <Leaderboard title="Current leaderboard" players={gameState?.players ?? []} activeQuestion={activeQuestion} gameCode={savedGameCode ?? undefined} />
        )}
      </div>
    </div>
  );
}
