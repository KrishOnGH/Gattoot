"use client";

import { useEffect, useState } from "react";
import type { JeopardyQuestion } from "../data";

type QuestionPanelProps = {
  question: JeopardyQuestion;
  expiresAt: number;
  onChoice?: (index: number) => void;
  selectedIndex?: number | null;
  result?: "correct" | "wrong" | "timeout" | null;
  isHost?: boolean;
};

export default function QuestionPanel({
  question,
  expiresAt,
  onChoice,
  selectedIndex = null,
  result = null,
  isHost = false,
}: QuestionPanelProps) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  const showChoices = !!onChoice && !isHost;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-6 py-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-700 bg-slate-900/95 p-8 shadow-xl shadow-slate-950/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Question</p>
            <h2 className="mt-2 text-3xl font-semibold">{question.prompt}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {question.categoryId} • ${question.value}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-950/95 px-5 py-3 text-right ring-1 ring-slate-700/80">
            <p className="text-xs uppercase text-slate-500">Time left</p>
            <p className="text-3xl font-semibold text-white">{remaining}s</p>
          </div>
        </div>

        {showChoices ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {question.choices.map((choice, index) => {
              const isSelected = selectedIndex === index;
              const showResult = result !== null;
              const isCorrect = index === question.answerIndex;
              const buttonClass = showResult
                ? isCorrect
                  ? "bg-emerald-500 text-slate-950"
                  : isSelected
                  ? "bg-rose-500 text-white"
                  : "bg-slate-800 text-slate-300"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700";

              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => onChoice?.(index)}
                  disabled={showResult || remaining <= 0}
                  className={`${buttonClass} rounded-3xl border border-slate-700 p-5 text-left transition`}
                >
                  <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>
                  <span className="ml-3">{choice}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-slate-700 bg-slate-950/90 p-6 text-slate-200">
            <p className="text-center text-lg font-medium text-slate-100">Waiting for players to answer the current question.</p>
          </div>
        )}

        {showChoices ? (
          <div className="mt-8 rounded-3xl border border-slate-700 bg-slate-950/90 p-6 text-slate-200">
            {result === "correct" ? (
              <p className="text-center text-lg font-semibold text-emerald-300">Correct! +${question.value}</p>
            ) : result === "wrong" ? (
              <p className="text-center text-lg font-semibold text-rose-300">Wrong. -${question.value}</p>
            ) : result === "timeout" ? (
              <p className="text-center text-lg font-semibold text-rose-300">Time ran out. -${question.value}</p>
            ) : (
              <p className="text-center text-slate-400">Select one answer before the timer ends.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
