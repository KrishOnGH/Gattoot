const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const data = require("./data.json");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const port = parseInt(process.env.PORT, 10) || 3000;

const games = new Map();

function createGameState(code, hostSocketId) {
  return {
    code,
    hostSocketId,
    players: [],
    activeQuestionId: null,
    expiresAt: null,
    usedQuestionIds: [],
    timer: null,
  };
}

function createJoinCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function normalizeGameCode(code) {
  return String(code || "").trim().toUpperCase();
}

function getQuestionById(questionId) {
  return data.questions.find((question) => question.id === questionId) || null;
}

function buildPublicState(game) {
  return {
    code: game.code,
    players: game.players.map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score,
      answers: player.answers,
    })),
    activeQuestionId: game.activeQuestionId,
    expiresAt: game.expiresAt,
    usedQuestionIds: game.usedQuestionIds,
  };
}

function finishQuestion(game) {
  if (!game || !game.activeQuestionId) return;
  const questionId = game.activeQuestionId;
  const question = getQuestionById(questionId);
  if (!question) return;

  game.players.forEach((player) => {
    if (!player.answers[questionId]) {
      player.answers[questionId] = "wrong";
      player.score -= question.value;
    }
  });

  game.activeQuestionId = null;
  game.expiresAt = null;
  game.timer = null;
  io.to(`game-${game.code}`).emit("game_state", buildPublicState(game));
}

let io;

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    if (pathname.startsWith("/socket.io/")) {
      handle(req, res);
      return;
    }
    handle(req, res);
  });

  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("create_game", ({ code }, callback) => {
      const gameCode = normalizeGameCode(code || createJoinCode());
      if (games.has(gameCode)) {
        callback?.({ success: false, message: "Code already in use. Try again." });
        return;
      }
      const game = createGameState(gameCode, socket.id);
      games.set(gameCode, game);
      socket.join(`game-${gameCode}`);
      callback?.({ success: true, state: buildPublicState(game) });
    });

    socket.on("join_game", ({ code, name }, callback) => {
      const gameCode = normalizeGameCode(code);
      const game = games.get(gameCode);
      if (!game) {
        callback?.({ success: false, message: "Game not found." });
        return;
      }
      if (game.players.some((player) => player.socketId === socket.id)) {
        const existingPlayer = game.players.find((player) => player.socketId === socket.id);
        callback?.({ success: true, playerId: existingPlayer.id, state: buildPublicState(game) });
        return;
      }
      const playerId = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
      const player = { id: playerId, name: name || "Player", score: 0, answers: {}, socketId: socket.id };
      game.players.push(player);
      socket.join(`game-${gameCode}`);
      io.to(`game-${gameCode}`).emit("game_state", buildPublicState(game));
      callback?.({ success: true, playerId, state: buildPublicState(game) });
    });

    socket.on("watch_game", ({ code }, callback) => {
      const gameCode = normalizeGameCode(code);
      const game = games.get(gameCode);
      if (!game) {
        callback?.({ success: false, message: "Game not found." });
        return;
      }
      socket.join(`game-${gameCode}`);
      callback?.({ success: true, state: buildPublicState(game) });
    });

    socket.on("start_question", ({ code, questionId }, callback) => {
      const gameCode = normalizeGameCode(code);
      const game = games.get(gameCode);
      if (!game || game.hostSocketId !== socket.id) {
        callback?.({ success: false, message: "Unauthorized or game not found." });
        return;
      }
      const question = getQuestionById(questionId);
      if (!question) {
        callback?.({ success: false, message: "Question not found." });
        return;
      }
      if (game.usedQuestionIds.includes(questionId)) {
        callback?.({ success: false, message: "Question already used." });
        return;
      }
      game.activeQuestionId = questionId;
      game.expiresAt = Date.now() + question.time * 1000;
      game.usedQuestionIds.push(questionId);
      if (game.timer) {
        clearTimeout(game.timer);
      }
      game.timer = setTimeout(() => finishQuestion(game), question.time * 1000);
      const state = buildPublicState(game);
      io.to(`game-${gameCode}`).emit("game_state", state);
      io.to(`game-${gameCode}`).emit("question_started", { question, expiresAt: game.expiresAt });
      callback?.({ success: true, state });
    });

    socket.on("submit_answer", ({ code, questionId, answerIndex }, callback) => {
      const gameCode = normalizeGameCode(code);
      const game = games.get(gameCode);
      if (!game || !game.activeQuestionId || game.activeQuestionId !== questionId) {
        callback?.({ success: false, message: "No active question." });
        return;
      }
      const player = game.players.find((item) => item.socketId === socket.id);
      const question = getQuestionById(questionId);
      if (!player || !question) {
        callback?.({ success: false, message: "Player or question not found." });
        return;
      }
      if (player.answers[questionId]) {
        callback?.({ success: false, message: "Already answered." });
        return;
      }
      const correct = answerIndex === question.answerIndex;
      player.answers[questionId] = correct ? "correct" : "wrong";
      player.score += correct ? question.value : -question.value;
      io.to(`game-${gameCode}`).emit("game_state", buildPublicState(game));
      callback?.({ success: true, correct });
    });

    socket.on("disconnect", () => {
      games.forEach((game, code) => {
        const playerIndex = game.players.findIndex((player) => player.socketId === socket.id);
        if (game.hostSocketId === socket.id) {
          games.delete(code);
          io.to(`game-${code}`).emit("game_closed", { message: "Host disconnected." });
          return;
        }
        if (playerIndex !== -1) {
          game.players.splice(playerIndex, 1);
          io.to(`game-${code}`).emit("game_state", buildPublicState(game));
        }
      });
    });
  });

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`> Ready on http://localhost:${port}`);
  });
});
