import { Router } from "express";
import { menuRouter } from "./menu";
import { ordersRouter } from "./orders";
import { paymentsRouter } from "./payments";

export const router = Router();

router.use("/menu", menuRouter);
router.use("/orders", ordersRouter);
router.use("/payments", paymentsRouter);
