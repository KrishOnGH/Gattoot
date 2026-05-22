"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { boardValues, categories, getQuestionById, JeopardyQuestion } from "../data";
import { getSocket } from "../lib/socket";
import type { GameState } from "../lib/types";
import QuestionPanel from "../components/QuestionPanel";

function makeJoinCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += characters[Math.floor(Math.random() * characters.length)];
  }
  return code;
}

export default function HostPage() {
  const [gameCode, setGameCode] = useState(makeJoinCode());
  const [socketConnected, setSocketConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<{ question: JeopardyQuestion; expiresAt: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const createGame = (code: string) => {
      socket.emit("create_game", { code }, (response) => {
        if (!response.success) {
          setGameCode(makeJoinCode());
          return;
        }
        setGameState(response.state ?? null);
      });
    };

    const handleConnected = () => {
      setSocketConnected(true);
      createGame(gameCode);
    };

    const handleDisconnected = () => setSocketConnected(false);

    socket.on("connect", handleConnected);
    socket.on("disconnect", handleDisconnected);
    socket.on("game_state", (state: GameState) => {
      setGameState(state);
      if (!state.activeQuestionId) {
        setCurrentQuestion(null);
      }
    });
    socket.on("question_started", (payload: { question: JeopardyQuestion; expiresAt: number }) => {
      setCurrentQuestion(payload);
    });
    socket.on("game_closed", ({ message }) => setError(message));

    if (socket.connected) {
      createGame(gameCode);
    }

    return () => {
      socket.off("connect", handleConnected);
      socket.off("disconnect", handleDisconnected);
      socket.off("game_state");
      socket.off("question_started");
      socket.off("game_closed");
    };
  }, [gameCode]);

  const activeQuestionId = gameState?.activeQuestionId ?? currentQuestion?.question.id ?? null;
  const activeQuestion = activeQuestionId ? getQuestionById(activeQuestionId) : null;
  const expiresAt = currentQuestion?.expiresAt ?? gameState?.expiresAt ?? Date.now();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-700 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Jeopardy Host</p>
            <h1 className="mt-2 text-4xl font-semibold">Choose a clue to open the question</h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="rounded-3xl bg-slate-950 px-4 py-3 text-sm text-slate-200 ring-1 ring-slate-700/80">Code: {gameCode}</span>
            <span className={`rounded-3xl px-4 py-3 text-sm ${socketConnected ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-white"}`}>
              {socketConnected ? "Connected" : "Connecting..."}
            </span>
            <Link href="/leaderboard" className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
              Open leaderboard
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 text-rose-100">{error}</div>
        ) : null}

        {activeQuestion ? <QuestionPanel question={activeQuestion} expiresAt={expiresAt} isHost /> : null}

        <div className="overflow-x-auto rounded-3xl border border-slate-700 bg-slate-900/95 p-4">
          <div className="grid min-w-[860px] grid-cols-4 gap-3">
            {categories.map((category) => (
              <div key={category.id} className="space-y-3">
                <div className="rounded-3xl bg-slate-800 px-4 py-5 text-center text-lg font-semibold text-white shadow-inner shadow-black/20">
                  {category.label}
                </div>
                {boardValues.map((value) => {
                  const question = getQuestionById(`${category.id}-${value}`);
                  const used = question ? !!gameState?.usedQuestionIds.includes(question.id) : true;
                  return (
                    <button
                      key={`${category.id}-${value}`}
                      type="button"
                      onClick={() => {
                        if (!question || used) return;
                        getSocket().emit("start_question", { code: gameCode, questionId: question.id }, (response) => {
                          if (!response.success) {
                            setError(response.message ?? "Unable to start question.");
                          }
                        });
                      }}
                      disabled={used}
                      className={`w-full rounded-3xl px-4 py-6 text-xl font-semibold transition ${used ? "cursor-not-allowed bg-slate-800 text-slate-500" : "bg-amber-500 text-slate-950 hover:bg-amber-400"}`}>
                      ${value}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
