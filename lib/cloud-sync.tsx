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
import { usePlanner } from "./planner-store";

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
 * Bridges the planner reducer store with Supabase. Strategy:
 *  - On login: pull the remote row. If it has data, hydrate local state from
 *    it (remote wins). If the remote row is empty/missing, push local up.
 *  - After the first pull, every local change is debounced-pushed (upsert).
 *  - Logged out or no backend configured: pure localStorage, no network.
 *
 * The table still has `quiz`, `plan`, `daily`, `tea` columns from earlier
 * versions of the app. We neither read nor write them — the upsert only
 * touches the columns it names, so legacy data stays intact for anyone who
 * wants to export it.
 */
export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const { user } = useAuth();
  const { state: planner, dispatch: plannerDispatch, hydrated } = usePlanner();

  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const pulledForUser = useRef<string | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const taskCount = planner.tasks.length;
  const habitCount = planner.habits.length;

  // ---- Daily local auto-backup snapshot ----
  useEffect(() => {
    if (!hydrated) return;
    autoBackup(buildBackup(planner));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Only re-run when the calendar day rolls over or data meaningfully changes.
    hydrated,
    taskCount,
    habitCount,
  ]);

  // ---- Pull on login ----
  useEffect(() => {
    if (!supabase || !user || !hydrated) {
      if (!user) pulledForUser.current = null;
      return;
    }
    if (pulledForUser.current === user.id) return;
    pulledForUser.current = user.id;

    let cancelled = false;
    (async () => {
      setStatus("pulling");
      const { data, error } = await supabase
        .from("app_state")
        .select("planner")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        setStatus("error");
        return;
      }

      const remoteHasData = !!data && !isEmptyObj(data.planner);

      if (remoteHasData) {
        plannerDispatch({ type: "HYDRATE", state: data.planner ?? {} });
        setStatus("synced");
        setLastSyncedAt(Date.now());
      } else {
        // First sync for this account — push whatever is local right now.
        const { error: upErr } = await supabase.from("app_state").upsert({
          user_id: user.id,
          planner,
        });
        setStatus(upErr ? "error" : "synced");
        if (!upErr) setLastSyncedAt(Date.now());
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, user, hydrated]);

  // ---- Debounced push on change ----
  useEffect(() => {
    if (!supabase || !user || pulledForUser.current !== user.id) return;

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      setStatus("saving");
      const { error } = await supabase.from("app_state").upsert({
        user_id: user.id,
        planner,
      });
      setStatus(error ? "error" : "synced");
      if (!error) setLastSyncedAt(Date.now());
    }, PUSH_DEBOUNCE_MS);

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [planner, supabase, user]);

  return (
    <SyncContext.Provider value={{ status, lastSyncedAt }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
