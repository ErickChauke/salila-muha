import "dotenv/config";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { setupSocket } from "./lib/socket";
import { router } from "./routes";
import { errorHandler } from "./middleware/error";

const app = express();

app.use(cors({ origin: process.env.WEB_URL ?? "http://localhost:3000" }));
app.use(express.json());
app.use("/api", router);
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use(errorHandler);

const httpServer = createServer(app);
setupSocket(httpServer);

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`API running on :${PORT}`);
});
