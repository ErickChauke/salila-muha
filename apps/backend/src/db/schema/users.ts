import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").unique(),
  email: text("email"),
  name: text("name").notNull(),
  role: text("role", { enum: ["customer", "kitchen", "admin"] }).notNull().default("customer"),
  notifyBySms: boolean("notify_by_sms").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
