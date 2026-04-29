import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  name: text("name").notNull(),
  role: text("role", { enum: ["customer", "kitchen", "admin"] }).notNull().default("customer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
