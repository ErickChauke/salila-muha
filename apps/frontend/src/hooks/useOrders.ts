"use client";

import { useEffect, useState } from "react";
import type { Order } from "@salila/types";
import { apiFetch } from "../lib/api";
import { socket } from "../lib/socket";

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    apiFetch<Order[]>("/api/orders").then(setOrders).catch(console.error);

    socket.connect();

    socket.on("order:new", (order: Order) => {
      setOrders((prev) => [order, ...prev]);
    });

    socket.on("order:updated", ({ id, status, updatedAt }: Pick<Order, "id" | "status" | "updatedAt">) => {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status, updatedAt } : o)));
    });

    return () => {
      socket.off("order:new");
      socket.off("order:updated");
      socket.disconnect();
    };
  }, []);

  return { orders };
}
