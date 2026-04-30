"use client";

import { useEffect, useState } from "react";
import type { MenuItem } from "@salila/types";
import { apiFetch } from "../lib/api";

export function useMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<MenuItem[]>("/api/menu")
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { items, loading };
}
