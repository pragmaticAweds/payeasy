"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/cache/service-worker";

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <>{children}</>;
}
