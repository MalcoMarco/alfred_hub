// src/services/tron.ts
export type TronEvent = {
  tx_hash: string;
  direction: "IN" | "OUT" | "MOVE";
  token?: string;
  amount: number;
  from?: string;
  to?: string;
  ts: number;
  link: string;
};

// Normaliza: "" | "/" -> "", "/hub" -> "/hub" (sin slash al final)
const BASE =
  (import.meta.env.VITE_BACKEND_URL ?? "/").replace(/\/+$/, "");

// ➜ con RewriteEngine OFF, usamos events.php
const API = `${BASE}/api/tron/events.php`;

export async function fetchTronEvents(
  address: string,
  since?: number,
  limit?: number
): Promise<TronEvent[]> {
  const url = new URL(API, window.location.origin);
  url.searchParams.set("address", address);
  if (since) url.searchParams.set("since", String(since));
  if (limit) url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`fetchTronEvents failed: ${res.status}`);
  return res.json();
}

import { useEffect, useRef, useState } from "react";

export function useTronFeed(address: string, interval = 10000) {
  const [events, setEvents] = useState<TronEvent[]>([]);
  const sinceRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // reset al cambiar de address
    setEvents([]);
    sinceRef.current = 0;

    const tick = async () => {
      try {
        // primera llamada con un limit mayor para poblar rápido
        const data = await fetchTronEvents(
          address,
          sinceRef.current || undefined,
          sinceRef.current ? undefined : 40
        );
        if (data.length) {
          // el backend devuelve asc; para feed mostramos newest-first
          const newestFirst = data.slice().reverse();
          const maxTs = Math.max(
            sinceRef.current,
            ...data.map((e) => e.ts)
          );
          setEvents((prev) => [...newestFirst, ...prev].slice(0, 200));
          sinceRef.current = maxTs;
        }
      } catch (e) {
        // opcional: console.warn(e);
      } finally {
        //timerRef.current = window.setTimeout(tick, interval);
      }
    };

    tick();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [address, interval]);

  return events;
}
