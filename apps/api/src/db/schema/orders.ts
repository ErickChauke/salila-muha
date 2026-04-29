import { pgTable, text, integer, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "collected",
  "rejected",
]);

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  customerId: text("customer_id"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  items: jsonb("items").notNull(),
  total: integer("total").notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  paymentRef: text("payment_ref"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
