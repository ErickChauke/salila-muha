import { Router } from "express";
import { authRouter } from "./auth";
import { menuRouter } from "./menu";
import { ordersRouter } from "./orders";
import { paymentsRouter } from "./payments";

export const router = Router();

router.use("/auth", authRouter);
router.use("/menu", menuRouter);
router.use("/orders", ordersRouter);
router.use("/payments", paymentsRouter);
