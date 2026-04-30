"use client";

import { useEffect, useRef, useState } from "react";
import type { OrderItem } from "@salila/types";

declare global {
  interface Window {
    YocoSDK: {
      new (config: { publicKey: string }): {
        showPopup: (options: {
          amountInCents: number;
          currency: string;
          name: string;
          description: string;
          callback: (result: { id?: string; error?: { message: string } }) => void;
        }) => void;
      };
    };
  }
}

interface Props {
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalInCents: number;
  onSuccess: (orderId: string) => void;
  onError: (message: string) => void;
}

export function YocoCheckout({ customerName, customerPhone, items, totalInCents, onSuccess, onError }: Props) {
  const sdkRef = useRef<InstanceType<typeof window.YocoSDK> | null>(null);
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    if (document.getElementById("yoco-sdk")) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "yoco-sdk";
    script.src = "https://js.yoco.com/sdk/v1/yoco-sdk-web.js";
    script.onload = () => setSdkReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (sdkReady && window.YocoSDK) {
      sdkRef.current = new window.YocoSDK({
        publicKey: process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY!,
      });
    }
  }, [sdkReady]);

  async function handlePay() {
    if (!sdkRef.current) return;
    setLoading(true);

    const orderRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName, customerPhone, items, total: totalInCents }),
    });

    if (!orderRes.ok) {
      setLoading(false);
      onError("Could not place order. Please try again.");
      return;
    }

    const order = await orderRes.json() as { id: string };
    const orderId = order.id;

    sdkRef.current.showPopup({
      amountInCents: totalInCents,
      currency: "ZAR",
      name: "Salila Muha",
      description: "Kota order",
      callback: async (result) => {
        if (result.error) {
          setLoading(false);
          onError(result.error.message);
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/charge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: result.id, amountInCents: totalInCents, orderId }),
        });

        setLoading(false);
        if (res.ok) {
          onSuccess(orderId);
        } else {
          const data = await res.json() as { error: string };
          onError(data.error);
        }
      },
    });
  }

  return (
    <button onClick={handlePay} disabled={loading || !sdkReady}>
      {loading ? "Processing..." : `Pay R${(totalInCents / 100).toFixed(2)}`}
    </button>
  );
}
