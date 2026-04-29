import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { ordersRouter } from "./routes/orders";
import { menuRouter } from "./routes/menu";
import { paymentsRouter } from "./routes/payments";

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: { origin: process.env.WEB_URL ?? "http://localhost:3000" },
});

app.use(cors({ origin: process.env.WEB_URL ?? "http://localhost:3000" }));
app.use(express.json());

app.use("/api/orders", ordersRouter);
app.use("/api/menu", menuRouter);
app.use("/api/payments", paymentsRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

io.on("connection", (socket) => {
  socket.join("kitchen");
  socket.on("disconnect", () => {});
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`API running on :${PORT}`);
});
