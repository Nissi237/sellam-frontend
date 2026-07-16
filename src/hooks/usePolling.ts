import { useEffect, useRef } from "react";

/**
 * Runs `fn` immediately and then on an interval.
 *
 * This replaces the Socket.io push used when the API is self-hosted: a
 * serverless host (Vercel) can't hold WebSocket connections open, but the data
 * those events carried is already persisted in Postgres, so the client re-reads
 * the REST endpoint instead.
 *
 * Polling pauses while the tab is hidden and fires again the moment it becomes
 * visible, so a backgrounded tab costs nothing.
 */
export function usePolling(fn: () => void, intervalMs: number, enabled = true) {
  const saved = useRef(fn);
  saved.current = fn;

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => saved.current();
    const start = () => {
      if (!timer) timer = setInterval(tick, intervalMs);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    tick();
    if (!document.hidden) start();

    const onVisibility = () => {
      if (document.hidden) stop();
      else {
        tick();
        start();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, enabled]);
}
