import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { createClient } from "@supabase/supabase-js";
import { db } from "../db";
import { users } from "../db/schema/users";
import { eq } from "drizzle-orm";

let _io: Server;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export function setupSocket(httpServer: HttpServer) {
  _io = new Server(httpServer, {
    cors: { origin: process.env.WEB_URL ?? "http://localhost:3000" },
  });

  _io.on("connection", async (socket) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) {
        const [row] = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, data.user.id))
          .limit(1);
        if (row && (row.role === "kitchen" || row.role === "admin")) {
          socket.join("kitchen");
        }
      }
    }

    socket.on("disconnect", () => {});
  });
}

export function getIO(): Server {
  return _io;
}
