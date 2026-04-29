import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db";
import { menuItems } from "../db/schema";

export async function getAll() {
  return db.select().from(menuItems).orderBy(menuItems.sortOrder);
}

export async function create(data: Omit<typeof menuItems.$inferInsert, "id">) {
  const item = { id: randomUUID(), ...data };
  await db.insert(menuItems).values(item);
  return item;
}

export async function update(id: string, data: Partial<typeof menuItems.$inferInsert>) {
  await db.update(menuItems).set(data).where(eq(menuItems.id, id));
  return { id, ...data };
}

export async function remove(id: string) {
  await db.delete(menuItems).where(eq(menuItems.id, id));
}
