import { questions, questionsById } from "../data";

export type PlayerAnswer = "correct" | "wrong";

export type PlayerProfile = {
  id: string;
  name: string;
  score: number;
  answers: Record<string, PlayerAnswer>;
};

export type ActiveQuestion = {
  questionId: string;
  startedAt: number;
  expiresAt: number;
};

const PLAYER_STORAGE = "jeopardy_players";
const ACTIVE_STORAGE = "jeopardy_active_question";
const USED_STORAGE = "jeopardy_used_questions";
const PLAYER_ID_STORAGE = "jeopardy_player_id";

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getPlayers(): PlayerProfile[] {
  if (typeof window === "undefined") return [];
  return safeParse<PlayerProfile[]>(localStorage.getItem(PLAYER_STORAGE)) ?? [];
}

export function savePlayers(players: PlayerProfile[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAYER_STORAGE, JSON.stringify(players));
}

export function getPlayerIdFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PLAYER_ID_STORAGE);
}

export function savePlayerIdToStorage(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAYER_ID_STORAGE, id);
}

export function findPlayer(id: string): PlayerProfile | null {
  return getPlayers().find((player) => player.id === id) ?? null;
}

export function ensurePlayer(name: string): PlayerProfile {
  const players = getPlayers();
  const existing = players.find((player) => player.name === name);
  if (existing) {
    return existing;
  }

  const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
  const newPlayer: PlayerProfile = {
    id,
    name,
    score: 0,
    answers: {},
  };
  players.push(newPlayer);
  savePlayers(players);
  savePlayerIdToStorage(id);
  return newPlayer;
}

export function updatePlayerScore(playerId: string, delta: number) {
  const players = getPlayers();
  const player = players.find((item) => item.id === playerId);
  if (!player) return;
  player.score += delta;
  savePlayers(players);
}

export function recordPlayerAnswer(playerId: string, questionId: string, correct: boolean) {
  const players = getPlayers();
  const player = players.find((item) => item.id === playerId);
  const question = questionsById[questionId];
  if (!player || !question) return;
  if (player.answers[questionId]) return;

  player.answers[questionId] = correct ? "correct" : "wrong";
  player.score += correct ? question.value : -question.value;
  savePlayers(players);
}

export function getPlayerAnswer(playerId: string, questionId: string): PlayerAnswer | null {
  const player = findPlayer(playerId);
  return player?.answers[questionId] ?? null;
}

export function getActiveQuestion(): ActiveQuestion | null {
  if (typeof window === "undefined") return null;
  const active = safeParse<ActiveQuestion>(localStorage.getItem(ACTIVE_STORAGE));
  if (!active) return null;
  if (Date.now() > active.expiresAt) {
    localStorage.removeItem(ACTIVE_STORAGE);
    return null;
  }
  return active;
}

export function setActiveQuestion(questionId: string) {
  if (typeof window === "undefined") return;
  const question = questionsById[questionId];
  if (!question) return;
  const activeQuestion: ActiveQuestion = {
    questionId,
    startedAt: Date.now(),
    expiresAt: Date.now() + question.time * 1000,
  };
  localStorage.setItem(ACTIVE_STORAGE, JSON.stringify(activeQuestion));
}

export function clearActiveQuestion() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_STORAGE);
}

export function getUsedQuestionIds(): string[] {
  if (typeof window === "undefined") return [];
  return safeParse<string[]>(localStorage.getItem(USED_STORAGE)) ?? [];
}

export function markQuestionUsed(questionId: string) {
  if (typeof window === "undefined") return;
  const used = new Set(getUsedQuestionIds());
  used.add(questionId);
  localStorage.setItem(USED_STORAGE, JSON.stringify(Array.from(used)));
}

export function getQuestionById(questionId: string) {
  return questionsById[questionId] ?? null;
}
