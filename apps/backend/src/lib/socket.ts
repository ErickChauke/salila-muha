import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

let _io: Server;

export function setupSocket(httpServer: HttpServer) {
  _io = new Server(httpServer, {
    cors: { origin: process.env.WEB_URL ?? "http://localhost:3000" },
  });

  _io.on("connection", (socket) => {
    socket.join("kitchen");
    socket.on("disconnect", () => {});
  });
}

export function getIO(): Server {
  return _io;
}
