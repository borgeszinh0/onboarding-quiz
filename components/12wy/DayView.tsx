"use client";

import { useState } from "react";
import { useDaily, getItemsForDate, getItemsForMonth, getDayCompletion } from "@/lib/daily-store";
import { use12WY } from "@/lib/12wy-store";
import { DOMAINS } from "@/lib/data";

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
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(toDateStr(today));
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  // New item form
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"task" | "event">("task");
  const [newTime, setNewTime] = useState("");

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

        {/* Items list */}
        {dayItems.length > 0 ? (
          <div className="space-y-2 mb-4">
            {dayItems.map((item) => (
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
                  onClick={() => dailyDispatch({ type: "REMOVE_ITEM", id: item.id })}
                  className="text-[10px] text-[#8A7F75] hover:text-[#B8392E] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
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
