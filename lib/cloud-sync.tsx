"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { createClient } from "./supabase/client";
import { buildBackup, autoBackup } from "./backup";
import { useAuth } from "./auth-context";
import { useQuiz } from "./store";
import { use12WY } from "./12wy-store";
import { useDaily } from "./daily-store";

type SyncStatus = "idle" | "pulling" | "saving" | "synced" | "error";

interface SyncValue {
  status: SyncStatus;
  lastSyncedAt: number | null;
}

const SyncContext = createContext<SyncValue>({ status: "idle", lastSyncedAt: null });

const PUSH_DEBOUNCE_MS = 1500;

function isEmptyObj(o: unknown): boolean {
  return !o || (typeof o === "object" && Object.keys(o as object).length === 0);
}

/**
 * Bridges the three local reducer stores with Supabase. Strategy:
 *  - On login: pull the remote row. If it has data, hydrate local stores from
 *    it (remote wins). If the remote row is empty/missing, push local up.
 *  - After the first pull, every local change is debounced-pushed (upsert).
 *  - Logged out or no backend configured: pure localStorage, no network.
 */
export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const { user } = useAuth();
  const { state: quiz, dispatch: quizDispatch } = useQuiz();
  const { state: plan, dispatch: planDispatch } = use12WY();
  const { state: daily, dispatch: dailyDispatch } = useDaily();

  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const pulledForUser = useRef<string | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Daily local auto-backup snapshot ----
  useEffect(() => {
    autoBackup(buildBackup(quiz, plan, daily));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Only re-run when the calendar day rolls over or data meaningfully changes.
    quiz.goals.length,
    plan.tactics.length,
    daily.items.length,
  ]);

  // ---- Pull on login ----
  useEffect(() => {
    if (!supabase || !user) {
      pulledForUser.current = null;
      return;
    }
    if (pulledForUser.current === user.id) return;
    pulledForUser.current = user.id;

    let cancelled = false;
    (async () => {
      setStatus("pulling");
      const { data, error } = await supabase
        .from("app_state")
        .select("quiz, plan, daily")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        setStatus("error");
        return;
      }

      if (data && !isEmptyObj(data.quiz)) {
        quizDispatch({ type: "HYDRATE", state: data.quiz });
        planDispatch({ type: "HYDRATE", state: data.plan ?? {} });
        dailyDispatch({ type: "HYDRATE", state: data.daily ?? {} });
        setStatus("synced");
        setLastSyncedAt(Date.now());
      } else {
        // First sync for this account — push whatever is local right now.
        const { error: upErr } = await supabase.from("app_state").upsert({
          user_id: user.id,
          quiz,
          plan,
          daily,
        });
        setStatus(upErr ? "error" : "synced");
        if (!upErr) setLastSyncedAt(Date.now());
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, user]);

  // ---- Debounced push on change ----
  useEffect(() => {
    if (!supabase || !user || pulledForUser.current !== user.id) return;

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      setStatus("saving");
      const { error } = await supabase.from("app_state").upsert({
        user_id: user.id,
        quiz,
        plan,
        daily,
      });
      setStatus(error ? "error" : "synced");
      if (!error) setLastSyncedAt(Date.now());
    }, PUSH_DEBOUNCE_MS);

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, plan, daily, supabase, user]);

  return (
    <SyncContext.Provider value={{ status, lastSyncedAt }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
