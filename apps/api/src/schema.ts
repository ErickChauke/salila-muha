import { pgTable, text, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "collected",
  "rejected",
]);

export const menuCategoryEnum = pgEnum("menu_category", [
  "kota",
  "chips",
  "extras",
  "drinks",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  name: text("name").notNull(),
  role: text("role", { enum: ["customer", "kitchen", "admin"] }).notNull().default("customer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const menuItems = pgTable("menu_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  category: menuCategoryEnum("category").notNull(),
  imageUrl: text("image_url"),
  available: boolean("available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

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
