"use client";

import { useState } from "react";
import {
  usePlanner,
  getInboxTasks,
  getTasksForSlot,
  canPlanTask,
} from "@/lib/planner-store";
import { CATEGORY_LABEL, CATEGORY_ORDER, SLOT_LIMITS } from "@/lib/planner-data";
import type { Task, TaskCategory } from "@/lib/planner-types";
import { Card, SectionLabel } from "@/components/apple/ui";
import { ScheduleTaskControl, ScheduleForm } from "./ScheduleTaskControl";

const CATEGORY_ACCENT: Record<Exclude<TaskCategory, "inbox">, string> = {
  big: "var(--color-danger)",
  medium: "var(--color-atencao)",
  small: "var(--color-accent)",
};

/** Mesmas cores, mas seguras como cor de TEXTO (ver --accent-text em globals.css). */
const CATEGORY_TEXT_ACCENT: Record<Exclude<TaskCategory, "inbox">, string> = {
  big: "var(--color-danger)",
  medium: "var(--color-atencao)",
  small: "var(--accent-text)",
};

/**
 * O funil 1-3-5: 1 tarefa grande, 3 médias, 5 pequenas por dia. Vaga cheia é
 * vaga cheia — o resto fica no Inbox até amanhã.
 */
export function DailyFunnel({
  date,
  onFocus,
}: {
  date: string;
  onFocus: (taskId: string) => void;
}) {
  const { state } = usePlanner();
  const [openSlot, setOpenSlot] = useState<Exclude<TaskCategory, "inbox"> | null>(
    null
  );

  return (
    <section className="space-y-4">
      {CATEGORY_ORDER.map((category) => {
        const tasks = getTasksForSlot(state, date, category);
        const limit = SLOT_LIMITS[category];

        return (
          <Card key={category} accent={CATEGORY_ACCENT[category]} className="p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[17px] font-semibold">
                {CATEGORY_LABEL[category]}
              </h2>
              <span className="tabular text-[13px] text-[color:var(--label-secondary)]">
                {tasks.length}/{limit}
              </span>
            </div>

            {tasks.length > 0 ? (
              <ul className="mb-2 space-y-1">
                {tasks.map((task) => (
                  <SlotTaskRow
                    key={task.id}
                    task={task}
                    date={date}
                    accent={CATEGORY_ACCENT[category]}
                    onFocus={onFocus}
                  />
                ))}
              </ul>
            ) : (
              <p className="mb-2 text-[15px] text-[color:var(--label-secondary)]">
                Vazio.
              </p>
            )}

            {tasks.length < limit &&
              (openSlot === category ? (
                <SlotPicker
                  date={date}
                  category={category}
                  onDone={() => setOpenSlot(null)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenSlot(category)}
                  className="min-h-[44px] text-[15px] font-medium"
                  style={{ color: CATEGORY_TEXT_ACCENT[category] }}
                >
                  Planejar
                </button>
              ))}
          </Card>
        );
      })}
    </section>
  );
}

function SlotTaskRow({
  task,
  date,
  accent,
  onFocus,
}: {
  task: Task;
  date: string;
  accent: string;
  onFocus: (taskId: string) => void;
}) {
  const { dispatch } = usePlanner();
  const [scheduling, setScheduling] = useState(false);

  return (
    <li className="flex flex-col gap-2">
      <div className="flex min-h-[44px] items-start gap-3 py-1">
        <button
          type="button"
          onClick={() => dispatch({ type: "TOGGLE_TASK_DONE", id: task.id })}
          aria-pressed={task.status === "done"}
          aria-label={task.title}
          className="mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors duration-200"
          style={{
            borderColor: task.status === "done" ? accent : "var(--separator)",
            background: task.status === "done" ? accent : "transparent",
          }}
        >
          {task.status === "done" && (
            <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none">
              <path
                d="M2 7.5L5.5 11L12 3.5"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        <span
          className="min-w-0 flex-1 pt-0.5 text-[17px] leading-tight"
          style={
            task.status === "done"
              ? { color: "var(--label-secondary)", textDecoration: "line-through" }
              : undefined
          }
        >
          {task.title}
        </span>
        <div className="mt-0.5 flex shrink-0 items-center gap-2">
          {task.status !== "done" && (
            <ScheduleTaskControl
              taskId={task.id}
              onFocus={onFocus}
              onOpenSchedule={() => setScheduling((v) => !v)}
            />
          )}
          <button
            type="button"
            onClick={() =>
              dispatch({ type: "MOVE_TASK", id: task.id, category: "inbox", date: null })
            }
            aria-label={`Voltar ${task.title} para o Inbox`}
            className="px-0.5 text-[13px] text-[color:var(--label-secondary)]"
          >
            Inbox
          </button>
        </div>
      </div>
      {scheduling && (
        <ScheduleForm taskId={task.id} date={date} onDone={() => setScheduling(false)} />
      )}
    </li>
  );
}

function SlotPicker({
  date,
  category,
  onDone,
}: {
  date: string;
  category: Exclude<TaskCategory, "inbox">;
  onDone: () => void;
}) {
  const { state, dispatch } = usePlanner();
  const [title, setTitle] = useState("");
  const inbox = getInboxTasks(state);

  const place = (taskId: string) => {
    if (!canPlanTask(state, date, category)) return;
    dispatch({ type: "MOVE_TASK", id: taskId, category, date });
    onDone();
  };

  const createAndPlace = () => {
    if (!title.trim() || !canPlanTask(state, date, category)) return;
    dispatch({ type: "ADD_TASK", title: title.trim(), category, date });
    setTitle("");
    onDone();
  };

  return (
    <div className="space-y-3 border-t border-[color:var(--separator)] pt-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createAndPlace()}
          placeholder="Nova tarefa"
          autoFocus
          className="min-w-0 flex-1 rounded-xl bg-[color:var(--fill-subtle)] px-3 py-2.5 text-[15px]"
        />
        <button
          type="button"
          onClick={createAndPlace}
          disabled={!title.trim()}
          className="min-h-[44px] shrink-0 rounded-xl px-4 text-[20px] font-medium leading-none text-[color:var(--accent-text)] disabled:opacity-30"
          aria-label="Criar e planejar"
        >
          +
        </button>
      </div>

      {inbox.length > 0 && (
        <div>
          <SectionLabel>Do Inbox</SectionLabel>
          <ul className="mt-1.5 space-y-1">
            {inbox.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => place(task.id)}
                  className="min-h-[44px] w-full rounded-lg px-2 text-left text-[15px] transition-colors hover:bg-[color:var(--fill-subtle)]"
                >
                  {task.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onDone}
        className="text-[13px] text-[color:var(--label-secondary)]"
      >
        Fechar
      </button>
    </div>
  );
}
