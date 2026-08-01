"use client";

import { ReactNode } from "react";
import { AuthProvider } from "./auth-context";
import { PlannerProvider } from "./planner-store";
import { CloudSyncProvider } from "./cloud-sync";
import { ThemeProvider } from "./theme-context";

/**
 * Single provider stack for the whole app, mounted once at the root so global
 * navigation, cloud sync, and every route share the same state.
 */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PlannerProvider>
          <CloudSyncProvider>{children}</CloudSyncProvider>
        </PlannerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
