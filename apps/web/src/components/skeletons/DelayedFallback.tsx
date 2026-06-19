// apps/web/src/components/skeletons/DelayedFallback.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";

export function DelayedFallback({
  delay = 200,
  children,
}: {
  delay?: number;
  children: ReactNode;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShow(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  if (!show) return null;

  return <>{children}</>;
}