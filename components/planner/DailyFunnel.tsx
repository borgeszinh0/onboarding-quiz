"use client";

import { useState } from "react";
import {
  usePlanner,
  getInboxTasks,
  getTasksForSlot,
  canPlanTask,
  getGoal,
  getWeekRocks,
  mondayOf,
} from "@/lib/planner-store";
import { CATEGORY_LABEL, CATEGORY_ORDER, SLOT_LIMITS } from "@/lib/planner-data";
import type { Task, TaskCategory } from "@/lib/planner-types";
import { Card, SectionLabel } from "@/components/apple/ui";
import { ScheduleTaskControl, ScheduleForm } from "./ScheduleTaskControl";
import { TaskDetailModal } from "./TaskDetailModal";
import { Inbox, Mountain, Target } from "lucide-react";

/** Mesmas cores, mas seguras como cor de TEXTO (ver --accent-text em globals.css). */
const CATEGORY_TEXT_ACCENT: Record<Exclude<TaskCategory, "inbox">, string> = {
  big: "var(--danger-text)",
  medium: "var(--attention-text)",
  small: "var(--accent-text)",
};

/**
 * O funil 1-3-5: 1 tarefa grande, 3 médias, 5 pequenas por dia. Vaga cheia é
 * vaga cheia — o resto fica no Inbox até amanhã. Tarefas ligadas a uma meta
 * do trimestre ganham o badge META — são as que movem a agulha.
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
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);

  // Pedras da semana desta data: tarefas do funil ligadas a um rock comprometido
  // ficam pinadas no topo do slot — são as que movem a meta.
  const rockTaskIds = new Set(
    getWeekRocks(state, mondayOf(date))
      .filter((rock) => rock.taskId)
      .map((rock) => rock.taskId as string)
  );

  return (
    <section className="space-y-4">
      {CATEGORY_ORDER.map((category) => {
        const tasks = getTasksForSlot(state, date, category);
        const limit = SLOT_LIMITS[category];

        return (
          <Card
            key={category}
            allowOverflow
            className="p-5"
          >
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="a-headline">
                {CATEGORY_LABEL[category]}
                {category === "big" && rockTaskIds.size > 0 && (
                  <span className="a-caption ml-2 align-middle text-label-secondary">
                    · {rockTaskIds.size} {rockTaskIds.size === 1 ? "pedra" : "pedras"} da semana
                  </span>
                )}
              </h2>
              <span className="a-caption tabular text-label-secondary">
                {tasks.length}/{limit}
              </span>
            </div>

            {tasks.length > 0 ? (
              <ul className="mb-2 space-y-1">
                {[...tasks]
                  .sort((a, b) =>
                    Number(rockTaskIds.has(b.id)) - Number(rockTaskIds.has(a.id)) ||
                    a.createdAt - b.createdAt
                  )
                  .map((task) => (
                    <SlotTaskRow
                      key={task.id}
                      task={task}
                      date={date}
                      isRock={rockTaskIds.has(task.id)}
                      onFocus={onFocus}
                      onOpenDetail={setDetailTaskId}
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

      <TaskDetailModal
        taskId={detailTaskId}
        onClose={() => setDetailTaskId(null)}
        onFocus={onFocus}
      />
    </section>
  );
}

export function GoalBadge({ task }: { task: Task }) {
  const { state } = usePlanner();
  const goal = task.goalId ? getGoal(state, task.goalId) : undefined;
  if (!goal || goal.status !== "active") return null;
  const short = goal.title.length > 26 ? `${goal.title.slice(0, 26)}…` : goal.title;
  return (
    <span className="a-caption mt-0.5 inline-flex max-w-full items-center gap-1 text-accent">
      <Target size={13} className="shrink-0" />
      <span className="truncate">META · {short}</span>
    </span>
  );
}

function SlotTaskRow({
  task,
  date,
  isRock,
  onFocus,
  onOpenDetail,
}: {
  task: Task;
  date: string;
  isRock: boolean;
  onFocus: (taskId: string) => void;
  onOpenDetail: (taskId: string) => void;
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
        <button
          type="button"
          onClick={() => onOpenDetail(task.id)}
          className="min-w-0 flex-1 text-left"
        >
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
          <GoalBadge task={task} />
          {isRock && (
            <span className="a-caption mt-0.5 inline-flex items-center rounded-full bg-fill-subtle px-2 py-0.5 text-label">
              <Mountain size={12} className="mr-1 shrink-0 text-accent" />
              Pedra da semana
            </span>
          )}
        </button>
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
  onDone,
}: {
  date: string;
  category: Exclude<TaskCategory, "inbox">;
  onDone: () => void;
}) {
  const { state, dispatch } = usePlanner();
  const inbox = [...getInboxTasks(state)].sort(
    (a, b) => a.createdAt - b.createdAt
  );

  const place = (taskId: string) => {
    if (!canPlanTask(state, date, category)) return;
    dispatch({ type: "MOVE_TASK", id: taskId, category, date });
    onDone();
  };

  return (
    <div className="space-y-3 border-t border-separator pt-3">
      {inbox.length > 0 && (
        <div>
          <SectionLabel>Do Inbox</SectionLabel>
          <ul className="mt-1.5 space-y-1">
            {inbox.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => place(task.id)}
                  className="min-h-[44px] w-full rounded-lg px-2 py-2 text-left transition-colors hover-bg-fill-subtle"
                >
                  <span className="a-subheadline block text-label">{task.title}</span>
                  <span className="mt-0.5 block">
                    <GoalBadge task={task} />
                  </span>
                </button>
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