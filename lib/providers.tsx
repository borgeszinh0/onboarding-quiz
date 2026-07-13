"use client";

import { ReactNode } from "react";
import { AuthProvider } from "./auth-context";
import { QuizProvider } from "./store";
import { TwelveWeekProvider } from "./12wy-store";
import { DailyProvider } from "./daily-store";
import { CloudSyncProvider } from "./cloud-sync";

/**
 * Single provider stack for the whole app, mounted once at the root so global
 * navigation, cloud sync, and every route share the same state.
 */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <QuizProvider>
        <TwelveWeekProvider>
          <DailyProvider>
            <CloudSyncProvider>{children}</CloudSyncProvider>
          </DailyProvider>
        </TwelveWeekProvider>
      </QuizProvider>
    </AuthProvider>
  );
}
