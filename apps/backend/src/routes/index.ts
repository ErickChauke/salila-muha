import { Router } from "express";
import { authRouter } from "./auth";
import { menuRouter } from "./menu";
import { ordersRouter } from "./orders";
import { paymentsRouter } from "./payments";
import { adminRouter } from "./admin";

export const router = Router();

router.use("/auth", authRouter);
router.use("/menu", menuRouter);
router.use("/orders", ordersRouter);
router.use("/payments", paymentsRouter);
router.use("/admin", adminRouter);
