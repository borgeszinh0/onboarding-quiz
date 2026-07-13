"use client";

import { useState, useEffect } from "react";
import { useDaily, getItemsForDate, getItemsForMonth, getDayCompletion } from "@/lib/daily-store";
import { use12WY, getWeekFromDate } from "@/lib/12wy-store";
import { useQuiz } from "@/lib/store";
import { DOMAINS } from "@/lib/data";
import {
  notificationPermission,
  requestNotificationPermission,
} from "@/lib/notifications";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DayView() {
  const { state: dailyState, dispatch: dailyDispatch } = useDaily();
  const { state: wyState } = use12WY();
  const { state: quizState } = useQuiz();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(toDateStr(today));
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  // New item form
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"task" | "event">("task");
  const [newTime, setNewTime] = useState("");

  // Edit item
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTime, setEditTime] = useState("");

  // Notification permission state
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  useEffect(() => setPerm(notificationPermission()), []);

  const startEdit = (id: string, title: string, time?: string) => {
    setEditId(id);
    setEditTitle(title);
    setEditTime(time ?? "");
  };
  const saveEdit = () => {
    if (!editId || !editTitle.trim()) return;
    dailyDispatch({
      type: "UPDATE_ITEM",
      id: editId,
      patch: { title: editTitle.trim(), time: editTime || undefined },
    });
    setEditId(null);
  };

  // Pull this week's 12WY tactics into the selected day as linked tasks.
  const pullTactics = () => {
    const week = getWeekFromDate(wyState.startDate) ?? wyState.currentWeek;
    const alreadyLinked = new Set(
      dailyState.items
        .filter((i) => i.date === selectedDate && i.linkedTacticId)
        .map((i) => i.linkedTacticId)
    );
    const goalMap = new Map<string, string>();
    quizState.goals.forEach((g, i) => {
      const domain = DOMAINS.find((d) => d.id === g.linkedDomainId);
      goalMap.set(`goal_${i}`, domain?.icon ?? "");
    });
    const toAdd = wyState.tactics
      .filter((t) => !alreadyLinked.has(t.id))
      .map((t) => ({
        type: "task" as const,
        title: `${goalMap.get(t.goalId) ?? "▸"} ${t.description} · Sem ${week}`,
        date: selectedDate,
        linkedTacticId: t.id,
      }));
    if (toAdd.length > 0) dailyDispatch({ type: "ADD_MANY", items: toAdd });
  };

  const dayItems = getItemsForDate(dailyState, selectedDate);
  const monthCounts = getItemsForMonth(dailyState, viewYear, viewMonth);
  const completion = getDayCompletion(dailyState, selectedDate);

  // Calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startOffset = firstDay.getDay(); // 0=Sunday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const selectedDateObj = new Date(selectedDate + "T00:00:00");
  const isToday = selectedDate === toDateStr(today);
  const fmtLong = (d: Date) =>
    d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    dailyDispatch({
      type: "ADD_ITEM",
      item: {
        type: newType,
        title: newTitle.trim(),
        date: selectedDate,
        time: newTime || undefined,
      },
    });
    setNewTitle("");
    setNewTime("");
  };

  const changeMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  return (
    <div className="step-enter space-y-6">
      {/* ===== CALENDÁRIO ===== */}
      <div className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#8A7F75] hover:text-[#B8392E] hover:bg-[#B8392E]/5 transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-bold text-[#1A1715]">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#8A7F75] hover:text-[#B8392E] hover:bg-[#B8392E]/5 transition-colors"
          >
            ›
          </button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="text-center text-[9px] font-bold uppercase text-[#8A7F75] pb-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startOffset }, (_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isSelected = dateStr === selectedDate;
            const isTodayCell = dateStr === toDateStr(today);
            const count = monthCounts[String(day).padStart(2, "0")] ?? 0;
            const comp = getDayCompletion(dailyState, dateStr);

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                aria-label={`${day} de ${MONTHS[viewMonth]}${count > 0 ? `, ${count} ite${count > 1 ? "ns" : "m"}` : ""}`}
                aria-pressed={isSelected}
                className={`relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all text-xs ${
                  isSelected
                    ? "bg-[#B8392E] text-[#F5F0E6] font-bold"
                    : isTodayCell
                      ? "bg-[#B8392E]/10 text-[#B8392E] font-bold"
                      : "text-[#1A1715] hover:bg-[#D4C9B5]/30"
                }`}
              >
                <span>{day}</span>
                {count > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {comp.total > 0 && comp.done === comp.total ? (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-[#F5F0E6]" : "bg-[#2D7A4E]"}`} />
                    ) : (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-[#F5F0E6]" : "bg-[#B8392E]"}`} />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== DIA SELECIONADO ===== */}
      <div className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#1A1715] capitalize">
              {fmtLong(selectedDateObj)}
            </h3>
            {completion.total > 0 && (
              <p className="text-[10px] text-[#8A7F75] mt-0.5">
                {completion.done}/{completion.total} tarefas concluídas
              </p>
            )}
          </div>
          {isToday && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#B8392E] bg-[#B8392E]/10 px-2 py-0.5 rounded-full">
              Hoje
            </span>
          )}
        </div>

        {/* Ações do dia */}
        <div className="flex flex-wrap gap-2 mb-4">
          {wyState.tactics.length > 0 && (
            <button
              onClick={pullTactics}
              className="text-[11px] font-semibold text-[#B8392E] border border-[#D4C9B5] rounded-full px-3 py-1 hover:border-[#B8392E] transition-colors"
            >
              ↓ Puxar táticas da semana
            </button>
          )}
          {perm !== "unsupported" && perm !== "granted" && (
            <button
              onClick={async () => setPerm(await requestNotificationPermission())}
              className="text-[11px] font-semibold text-[#8A7F75] border border-[#D4C9B5] rounded-full px-3 py-1 hover:border-[#B8392E] hover:text-[#B8392E] transition-colors"
            >
              🔔 Ativar lembretes
            </button>
          )}
          {perm === "granted" && (
            <span className="text-[11px] text-[#2D7A4E] inline-flex items-center gap-1 px-1 py-1">
              🔔 Lembretes ativos
            </span>
          )}
        </div>

        {/* Items list */}
        {dayItems.length > 0 ? (
          <div className="space-y-2 mb-4">
            {dayItems.map((item) =>
              editId === item.id ? (
                <div
                  key={item.id}
                  className="flex gap-2 rounded-lg px-2 py-2 bg-[#B8392E]/5"
                >
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    aria-label="Horário"
                    className="w-24 rounded-lg bg-[#F5F0E6] border border-[#D4C9B5] px-2 py-1.5 text-xs focus:border-[#B8392E] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={editTitle}
                    autoFocus
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit();
                      if (e.key === "Escape") setEditId(null);
                    }}
                    aria-label="Título"
                    className="flex-1 rounded-lg bg-[#F5F0E6] border border-[#D4C9B5] px-3 py-1.5 text-sm focus:border-[#B8392E] focus:outline-none"
                  />
                  <button
                    onClick={saveEdit}
                    className="px-3 rounded-lg bg-[#B8392E] text-[#F5F0E6] text-xs font-bold"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    aria-label="Cancelar edição"
                    className="px-2 text-[#8A7F75] hover:text-[#B8392E] text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
              <div
                key={item.id}
                className={`flex items-center gap-2.5 group rounded-lg px-3 py-2 transition-colors ${
                  item.type === "event"
                    ? "bg-[#D4C9B5]/20 border border-[#D4C9B5]/40"
                    : ""
                }`}
              >
                {item.type === "task" ? (
                  <button
                    onClick={() => dailyDispatch({ type: "TOGGLE_ITEM", id: item.id })}
                    className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all ${
                      item.done
                        ? "bg-[#B8392E] border-[#B8392E]"
                        : "border-[#D4C9B5] hover:border-[#B8392E]"
                    }`}
                  >
                    {item.done && (
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4 7L8 3" stroke="#F5F0E6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ) : (
                  <span className="w-4 h-4 shrink-0 flex items-center justify-center text-[#B8392E] text-xs">
                    ◆
                  </span>
                )}

                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${item.done ? "text-[#8A7F75] line-through" : "text-[#1A1715]"}`}>
                    {item.title}
                  </p>
                  {item.time && (
                    <span className="text-[10px] text-[#8A7F75] font-mono">{item.time}</span>
                  )}
                </div>

                <button
                  onClick={() => startEdit(item.id, item.title, item.time)}
                  aria-label={`Editar ${item.title}`}
                  className="text-[11px] text-[#8A7F75] hover:text-[#B8392E] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  ✎
                </button>
                <button
                  onClick={() => dailyDispatch({ type: "REMOVE_ITEM", id: item.id })}
                  aria-label={`Remover ${item.title}`}
                  className="text-[10px] text-[#8A7F75] hover:text-[#B8392E] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  ✕
                </button>
              </div>
              )
            )}
          </div>
        ) : (
          <p className="text-xs text-[#8A7F75] italic mb-4">
            Nada agendado. Adicione abaixo.
          </p>
        )}

        {/* Add form */}
        <div className="border-t border-[#D4C9B5]/60 pt-4">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setNewType("task")}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${
                newType === "task"
                  ? "bg-[#B8392E] text-[#F5F0E6]"
                  : "bg-[#D4C9B5]/30 text-[#8A7F75]"
              }`}
            >
              ✓ Tarefa
            </button>
            <button
              onClick={() => setNewType("event")}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${
                newType === "event"
                  ? "bg-[#B8392E] text-[#F5F0E6]"
                  : "bg-[#D4C9B5]/30 text-[#8A7F75]"
              }`}
            >
              ◆ Evento
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-24 rounded-lg bg-[#F5F0E6] border border-[#D4C9B5] px-2 py-2 text-xs text-[#1A1715] focus:border-[#B8392E] focus:outline-none"
            />
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder={newType === "task" ? "Nova tarefa..." : "Novo evento..."}
              className="flex-1 rounded-lg bg-[#F5F0E6] border border-[#D4C9B5] px-3 py-2 text-sm text-[#1A1715] placeholder:text-[#8A7F75]/50 focus:border-[#B8392E] focus:ring-2 focus:ring-[#B8392E]/10 focus:outline-none transition-all"
            />
            <button
              onClick={handleAdd}
              disabled={!newTitle.trim()}
              className="px-4 rounded-lg bg-[#B8392E]/10 text-[#B8392E] text-sm font-bold hover:bg-[#B8392E]/20 disabled:opacity-30 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
