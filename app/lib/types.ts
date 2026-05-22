import type { JeopardyQuestion } from "../data";

export type PlayerState = {
  id: string;
  name: string;
  score: number;
  answers: Record<string, "correct" | "wrong">;
};

export type GameState = {
  code: string;
  players: PlayerState[];
  activeQuestionId: string | null;
  expiresAt: number | null;
  usedQuestionIds: string[];
};

export type QuestionStartedPayload = {
  question: JeopardyQuestion;
  expiresAt: number;
};

export type ClientToServerEvents = {
  create_game: (payload: { code?: string }, callback?: (response: { success: boolean; message?: string; state?: GameState }) => void) => void;
  join_game: (payload: { code: string; name: string }, callback?: (response: { success: boolean; message?: string; playerId?: string; state?: GameState }) => void) => void;
  watch_game: (payload: { code: string }, callback?: (response: { success: boolean; message?: string; state?: GameState }) => void) => void;
  start_question: (payload: { code: string; questionId: string }, callback?: (response: { success: boolean; message?: string; state?: GameState }) => void) => void;
  submit_answer: (payload: { code: string; questionId: string; answerIndex: number }, callback?: (response: { success: boolean; correct?: boolean; message?: string }) => void) => void;
};

export type ServerToClientEvents = {
  game_state: (state: GameState) => void;
  question_started: (payload: QuestionStartedPayload) => void;
  game_closed: (payload: { message: string }) => void;
};
