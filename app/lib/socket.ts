"use client";

import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./types";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket() {
  if (socket) return socket;
  if (typeof window === "undefined") {
    throw new Error("Socket can only be created in the browser.");
  }

  const origin = window.location.origin;
  socket = io(origin, {
    transports: ["websocket"],
  });

  return socket;
}
