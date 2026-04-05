"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

const STORAGE_KEY = "qez.scroll.positions";

function readPositions() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function persistPosition(routeKey: string) {
  const positions = readPositions();
  positions[routeKey] = window.scrollY;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

function ScrollRestorationInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => {
    window.history.scrollRestoration = "manual";

    const positions = readPositions();
    const savedY = positions[routeKey] ?? 0;
    let restoreAttempts = 0;

    const restoreScroll = () => {
      window.scrollTo(0, savedY);
      restoreAttempts += 1;

      const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
      const canReachTarget = maxScrollTop >= savedY - 8;

      if (!canReachTarget && restoreAttempts < 12) {
        window.setTimeout(restoreScroll, 120);
      }
    };

    window.requestAnimationFrame(restoreScroll);

    const handleBeforeUnload = () => persistPosition(routeKey);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      persistPosition(routeKey);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [routeKey]);

  return null;
}

export function ScrollRestoration() {
  return (
    <Suspense fallback={null}>
      <ScrollRestorationInner />
    </Suspense>
  );
}