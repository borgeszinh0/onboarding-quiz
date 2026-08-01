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
import {
  DAY_MODE_RULES,
  getDayMode,
  getFitGroup,
  getFitLabel,
  getRecommendedBudgetCopy,
  getTaskFitScore,
  sortTasksForMode,
} from "@/lib/day-mode";
import { Card, SectionLabel } from "@/components/apple/ui";
import { ScheduleTaskControl, ScheduleForm } from "./ScheduleTaskControl";
import { LifeAreaBadge } from "./LifeAreaField";
import { Inbox } from "lucide-react";

/** Mesmas cores, mas seguras como cor de TEXTO (ver --accent-text em globals.css). */
const CATEGORY_TEXT_ACCENT: Record<Exclude<TaskCategory, "inbox">, string> = {
  big: "var(--danger-text)",
  medium: "var(--attention-text)",
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
  const dayMode = getDayMode(state, date);
  const modeRules = DAY_MODE_RULES[dayMode];
  const hasBigTask = getTasksForSlot(state, date, "big").length > 0;

  return (
    <section className="space-y-4">
      <p className="a-caption text-label-secondary" role="status">
        {modeRules.summary}
      </p>
      {CATEGORY_ORDER.map((category) => {
        const tasks = getTasksForSlot(state, date, category);
        const limit = SLOT_LIMITS[category];
        const recommended = modeRules.recommendedTasks[category];

        return (
          <Card
            key={category}
            allowOverflow
            className="p-5"
          >
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="a-headline">
                {CATEGORY_LABEL[category]}
              </h2>
              <span className="a-caption tabular text-label-secondary">
                {tasks.length}/{limit}
              </span>
            </div>
            <p className="a-caption mb-3 text-label-secondary">
              Recomendado hoje: {recommended}. {getRecommendedBudgetCopy(state, date, dayMode, category)}
            </p>

            {dayMode === "high" && category === "big" && !hasBigTask && (
              <p className="a-caption mb-3 text-accent" role="status">
                Escolha sua tarefa grande antes de preencher o resto.
              </p>
            )}

            {dayMode === "high" && category === "small" && !hasBigTask && (
              <p className="a-caption mb-3 text-label-secondary">
                Pequenas cabem melhor depois do bloco principal.
              </p>
            )}

            {tasks.length > 0 ? (
              <ul className="mb-2 space-y-1">
                {tasks.map((task) => (
                  <SlotTaskRow
                    key={task.id}
                    task={task}
                    date={date}
                    onFocus={onFocus}
                  />
                ))}
              </ul>
            ) : (
              <p className="a-subheadline mb-2 text-label-secondary">
                Escolha sua tarefa {CATEGORY_LABEL[category].toLowerCase()}.
              </p>
            )}

            {tasks.length < limit &&
              (openSlot === category ? (
                <SlotPicker
                  date={date}
                  category={category}
                  mode={dayMode}
                  onDone={() => setOpenSlot(null)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenSlot(category)}
                  className="a-subheadline min-h-[44px]"
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
  onFocus,
}: {
  task: Task;
  date: string;
  onFocus: (taskId: string) => void;
}) {
  const { dispatch } = usePlanner();
  const [scheduling, setScheduling] = useState(false);

  return (
    <li className="flex flex-col gap-2">
      <div className="flex min-h-[44px] items-center gap-3 py-1">
        <button
          type="button"
          onClick={() => dispatch({ type: "TOGGLE_TASK_DONE", id: task.id })}
          aria-pressed={task.status === "done"}
          aria-label={task.title}
          className="flex h-11 w-11 shrink-0 items-center justify-center"
        >
          <span
            className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] transition-colors duration-200"
            style={{
              borderColor: task.status === "done" ? "transparent" : "var(--separator)",
              background: task.status === "done" ? "var(--gemini-grad)" : "transparent",
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
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <span
            className="a-body block truncate"
            style={
              task.status === "done"
                ? { color: "var(--label-secondary)", textDecoration: "line-through" }
                : undefined
            }
          >
            {task.title}
          </span>
          {task.lifeArea && (
            <span className="mt-0.5 block">
              <LifeAreaBadge area={task.lifeArea} />
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {task.status !== "done" && (
            <ScheduleTaskControl
              taskId={task.id}
              onFocus={onFocus}
              onOpenSchedule={() => setScheduling((v) => !v)}
            />
          )}
          <MoveToInboxButton task={task} />
        </div>
      </div>
      {scheduling && (
        <ScheduleForm taskId={task.id} date={date} onDone={() => setScheduling(false)} />
      )}
    </li>
  );
}

function MoveToInboxButton({ task }: { task: Task }) {
  const { dispatch } = usePlanner();

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "MOVE_TASK", id: task.id, category: "inbox", date: null })}
      aria-label={`Mover ${task.title} para Inbox`}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-label-secondary transition-colors hover-bg-fill-subtle hover-text-accent"
    >
      <Inbox size={19} />
    </button>
  );
}

function SlotPicker({
  date,
  category,
  mode,
  onDone,
}: {
  date: string;
  category: Exclude<TaskCategory, "inbox">;
  mode: ReturnType<typeof getDayMode>;
  onDone: () => void;
}) {
  const { state, dispatch } = usePlanner();
  const [overrideTaskId, setOverrideTaskId] = useState<string | null>(null);
  const inbox = getInboxTasks(state);
  const sortedInbox = sortTasksForMode(inbox, state, date, mode, category);

  const place = (taskId: string, force = false) => {
    if (!canPlanTask(state, date, category)) return;
    const task = inbox.find((item) => item.id === taskId);
    if (task && !force) {
      const score = getTaskFitScore({ state, date, mode, task, category });
      if (getFitGroup(score) === "saveForLater") {
        setOverrideTaskId(taskId);
        return;
      }
    }
    dispatch({ type: "MOVE_TASK", id: taskId, category, date });
    onDone();
  };

  return (
    <div className="space-y-3 border-t border-separator pt-3">
      {inbox.length > 0 && (
        <div>
          <SectionLabel>Do Inbox</SectionLabel>
          <ul className="mt-1.5 space-y-1">
            {sortedInbox.map(({ task, group }) => (
              <li key={task.id}>
                {overrideTaskId === task.id ? (
                  <div className="rounded-xl bg-fill-subtle p-3">
                    <p className="a-caption mb-2 text-label-secondary">
                      Essa tarefa foge do modo de hoje, mas você pode planejá-la.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => place(task.id, true)}
                        className="a-caption min-h-[36px] rounded-lg bg-system-accent px-3 text-white"
                      >
                        Planejar mesmo
                      </button>
                      <button
                        type="button"
                        onClick={() => setOverrideTaskId(null)}
                        className="a-caption min-h-[36px] rounded-lg px-3 text-label-secondary"
                      >
                        Guardar no Inbox
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => place(task.id)}
                    className="min-h-[44px] w-full rounded-lg px-2 py-2 text-left transition-colors hover-bg-fill-subtle"
                  >
                    <span className="a-subheadline block text-label">{task.title}</span>
                    <span className="a-caption text-label-secondary">
                      {getFitLabel(mode, group)}
                    </span>
                    <span className="mt-1 block">
                      <LifeAreaBadge area={task.lifeArea} />
                    </span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {inbox.length === 0 && (
        <p className="a-subheadline text-label-secondary">
          Nenhuma tarefa no Inbox para selecionar.
        </p>
      )}

      <button
        type="button"
        onClick={onDone}
        className="a-caption a-hit-44 text-label-secondary"
      >
        Fechar
      </button>
    </div>
  );
}
