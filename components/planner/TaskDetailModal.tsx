"use client";

import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/apple/ui";
import { usePlanner, getTimeBlockForTask } from "@/lib/planner-store";
import { LifeAreaMenu } from "./LifeAreaField";
import { ScheduleForm } from "./ScheduleTaskControl";
import { Clock3, Plus, X } from "lucide-react";

/** Espera de digitação antes de gravar no estado global (e no localStorage). */
const SAVE_DEBOUNCE_MS = 400;

/**
 * Folha de detalhe de uma tarefa: nome completo, horário, categoria (área da
 * vida) e um espaço livre para notas + sub-tarefas. Abre a partir de
 * qualquer lista de tarefas (funil do dia ou inbox).
 */
export function TaskDetailModal({
  taskId,
  onClose,
  onFocus,
}: {
  taskId: string | null;
  onClose: () => void;
  onFocus?: (taskId: string) => void;
}) {
  const { state, dispatch } = usePlanner();
  const [scheduling, setScheduling] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");

  const task = taskId ? state.tasks.find((t) => t.id === taskId) : null;
  const block = task ? getTimeBlockForTask(state, task.id) : null;
  const canSchedule = !!task && task.category !== "inbox" && !!task.date;

  // Título e notas ficam em estado local e só gravam no store (e no
  // localStorage) depois de uma pausa na digitação — evita serializar o
  // planner inteiro a cada tecla.
  const [titleDraft, setTitleDraft] = useState(task?.title ?? "");
  const [notesDraft, setNotesDraft] = useState(task?.notes ?? "");
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTitleDraft(task?.title ?? "");
    setNotesDraft(task?.notes ?? "");
  }, [task?.id]);

  const commitTitle = (value: string) => {
    if (task) dispatch({ type: "UPDATE_TASK", id: task.id, title: value });
  };
  const commitNotes = (value: string) => {
    if (task) dispatch({ type: "UPDATE_TASK", id: task.id, notes: value });
  };

  const onTitleChange = (value: string) => {
    setTitleDraft(value);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => commitTitle(value), SAVE_DEBOUNCE_MS);
  };
  const onNotesChange = (value: string) => {
    setNotesDraft(value);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => commitNotes(value), SAVE_DEBOUNCE_MS);
  };

  const close = () => {
    if (titleTimer.current) {
      clearTimeout(titleTimer.current);
      commitTitle(titleDraft);
    }
    if (notesTimer.current) {
      clearTimeout(notesTimer.current);
      commitNotes(notesDraft);
    }
    setScheduling(false);
    setSubtaskTitle("");
    onClose();
  };

  const addSubtask = () => {
    if (!task || !subtaskTitle.trim()) return;
    dispatch({ type: "ADD_SUBTASK", taskId: task.id, title: subtaskTitle.trim() });
    setSubtaskTitle("");
  };

  return (
    <BottomSheet isOpen={!!task} onClose={close}>
      {task && (
        <div className="space-y-6">
          <input
            type="text"
            value={titleDraft}
            onChange={(e) => onTitleChange(e.target.value)}
            aria-label="Nome da tarefa"
            className="a-title-2 w-full rounded-xl bg-transparent px-0 text-label outline-none"
            placeholder="Nome da tarefa"
          />

          <div>
            <p className="a-caption mb-2 text-label-secondary">Horário</p>
            {canSchedule ? (
              scheduling || block ? (
                <div className="space-y-2">
                  {block && !scheduling && (
                    <div className="flex min-h-[44px] items-center gap-2">
                      <Clock3 size={18} className="text-accent" aria-hidden />
                      <span className="a-body tabular text-label">
                        {block.startTime}–{block.endTime}
                      </span>
                      <button
                        type="button"
                        onClick={() => setScheduling(true)}
                        className="a-caption ml-auto text-accent"
                      >
                        Alterar
                      </button>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "REMOVE_TIME_BLOCK", id: block.id })}
                        aria-label="Remover horário"
                        className="flex h-11 w-11 shrink-0 items-center justify-center text-label-secondary transition-colors hover-text-danger"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  {(scheduling || !block) && (
                    <ScheduleForm
                      taskId={task.id}
                      date={task.date as string}
                      onDone={() => setScheduling(false)}
                    />
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setScheduling(true)}
                  className="a-subheadline flex min-h-[44px] items-center gap-2 text-label-secondary transition-colors hover-text-accent"
                >
                  <Clock3 size={18} aria-hidden />
                  Definir horário
                </button>
              )
            ) : (
              <p className="a-caption flex min-h-[44px] items-center gap-2 text-label-secondary">
                <Clock3 size={18} aria-hidden />
                Planeje esta tarefa pra hoje pra poder marcar um horário.
              </p>
            )}
          </div>

          <div>
            <p className="a-caption mb-2 text-label-secondary">Categoria</p>
            <LifeAreaMenu
              value={task.lifeArea}
              onChange={(area) => dispatch({ type: "SET_TASK_AREA", id: task.id, lifeArea: area })}
              label={`Área de ${task.title}`}
            />
          </div>

          <div>
            <p className="a-caption mb-2 text-label-secondary">Detalhes</p>
            <textarea
              value={notesDraft}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Escreva detalhes, contexto ou links…"
              rows={3}
              className="a-subheadline w-full resize-none rounded-xl bg-fill-subtle px-3 py-2.5 text-label outline-none"
            />
          </div>

          <div>
            <p className="a-caption mb-2 text-label-secondary">Sub-tarefas</p>
            <ul className="mb-2 space-y-1">
              {(task.subtasks ?? []).map((subtask) => (
                <li key={subtask.id} className="flex min-h-[44px] items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({ type: "TOGGLE_SUBTASK", taskId: task.id, subtaskId: subtask.id })
                    }
                    aria-pressed={subtask.done}
                    aria-label={subtask.title}
                    className="flex h-9 w-9 shrink-0 items-center justify-center"
                  >
                    <span
                      className="flex h-[19px] w-[19px] items-center justify-center rounded-full border-[1.5px] transition-colors duration-200"
                      style={{
                        borderColor: subtask.done ? "transparent" : "var(--separator)",
                        background: subtask.done ? "var(--gemini-grad)" : "transparent",
                      }}
                    >
                      {subtask.done && (
                        <svg viewBox="0 0 14 14" className="h-2.5 w-2.5" fill="none">
                          <path
                            d="M2 7.5L5.5 11L12 3.5"
                            stroke="#fff"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                  </button>
                  <span
                    className="a-subheadline min-w-0 flex-1 truncate"
                    style={
                      subtask.done
                        ? { color: "var(--label-secondary)", textDecoration: "line-through" }
                        : undefined
                    }
                  >
                    {subtask.title}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({ type: "REMOVE_SUBTASK", taskId: task.id, subtaskId: subtask.id })
                    }
                    aria-label={`Remover ${subtask.title}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-label-secondary transition-colors hover-text-danger"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                placeholder="Adicionar sub-tarefa"
                className="a-subheadline min-h-[44px] min-w-0 flex-1 rounded-xl bg-fill-subtle px-3"
              />
              <button
                type="button"
                onClick={addSubtask}
                disabled={!subtaskTitle.trim()}
                aria-label="Adicionar sub-tarefa"
                className="a-hit-44 shrink-0 rounded-xl px-3 text-accent disabled:opacity-30"
              >
                <Plus size={22} />
              </button>
            </div>
          </div>

          {onFocus && task.status !== "done" && (
            <button
              type="button"
              onClick={() => {
                onFocus(task.id);
                close();
              }}
              className="a-btn a-btn-secondary w-full"
            >
              Iniciar foco
            </button>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
