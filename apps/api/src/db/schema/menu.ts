import { pgTable, text, integer, boolean, pgEnum } from "drizzle-orm/pg-core";

export const menuCategoryEnum = pgEnum("menu_category", [
  "kota",
  "chips",
  "extras",
  "drinks",
]);

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
