import { Router } from "express";
import * as menuService from "../services/menu.service";

export const menuRouter = Router();

menuRouter.get("/", async (_req, res) => {
  const items = await menuService.getAll();
  res.json(items);
});

menuRouter.post("/", async (req, res) => {
  const item = await menuService.create(req.body);
  res.status(201).json(item);
});

menuRouter.patch("/:id", async (req, res) => {
  const item = await menuService.update(req.params.id, req.body);
  res.json(item);
});

menuRouter.delete("/:id", async (req, res) => {
  await menuService.remove(req.params.id);
  res.status(204).end();
});
