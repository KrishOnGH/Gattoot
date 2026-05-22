import jsonData from "../data.json";

export type JeopardyCategory = { id: string; label: string };

export type JeopardyQuestion = {
  id: string;
  categoryId: string;
  value: number;
  prompt: string;
  choices: string[];
  answerIndex: number;
  time: number;
};

export const categories: JeopardyCategory[] = jsonData.categories;

export const boardValues = Array.from(new Set(jsonData.questions.map((question) => question.value))).sort((a, b) => a - b);

export const questions: JeopardyQuestion[] = jsonData.questions;

export const questionsById = Object.fromEntries(questions.map((question) => [question.id, question]));

export const getQuestionById = (id: string) => questionsById[id] ?? null;
