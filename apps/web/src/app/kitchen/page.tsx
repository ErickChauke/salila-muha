"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import type { Order } from "@salila/types";

const socket = io(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`)
      .then((r) => r.json())
      .then(setOrders);

    socket.on("order:new", (order: Order) => {
      setOrders((prev) => [order, ...prev]);
    });

    socket.on("order:updated", ({ id, status, updatedAt }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status, updatedAt } : o))
      );
    });

    return () => {
      socket.off("order:new");
      socket.off("order:updated");
    };
  }, []);

  return (
    <main>
      <h1>Kitchen Dashboard</h1>
      <p>{orders.length} order(s)</p>
    </main>
  );
}
