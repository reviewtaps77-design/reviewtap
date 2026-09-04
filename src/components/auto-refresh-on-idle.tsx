"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refresh server data after this long without user interaction. */
export const IDLE_REFRESH_TIMEOUT_MS = 30_000;

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "wheel", "scroll"] as const;

/**
 * Project-wide idle auto-refresh. Resets its timer on any user activity;
 * after `timeoutMs` of inactivity it revalidates the current route
 * (`router.refresh()` preserves client-side form state) and re-arms.
 * Paused while the tab is hidden.
 */
export function AutoRefreshOnIdle({ timeoutMs = IDLE_REFRESH_TIMEOUT_MS }: { timeoutMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const clear = () => {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
    };

    const schedule = () => {
      clear();
      if (document.hidden) return;
      timer = setTimeout(() => {
        router.refresh();
        schedule();
      }, timeoutMs);
    };

    const onActivity = () => schedule();
    const onVisibility = () => {
      if (document.hidden) clear();
      else schedule();
    };

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);
    schedule();

    return () => {
      clear();
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, timeoutMs]);

  return null;
}
