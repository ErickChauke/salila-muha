"use client";

import { useOrders } from "../../hooks/useOrders";

export default function KitchenPage() {
  const { orders } = useOrders();

  return (
    <main>
      <h1>Kitchen Dashboard</h1>
      <p>{orders.length} order(s)</p>
    </main>
  );
}
