"use client";

import { useState, useEffect, useRef } from "react";
import { usePlanner } from "@/lib/planner-store";
import { parseNaturalInput } from "@/lib/parser";
import { Search } from "lucide-react";
import { LifeAreaPicker } from "./planner/LifeAreaPicker";
import type { LifeArea } from "@/lib/planner-types";

export default function CommandBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [lifeArea, setLifeArea] = useState<LifeArea | null>(null);
  const { dispatch } = usePlanner();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Abre com Cmd+K ou Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (o) {
            setQuery("");
            setLifeArea(null);
          }
          return !o;
        });
      }
      // Fecha com Esc
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        setLifeArea(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focar o input automaticamente quando abre
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const handleCapture = () => {
    if (!query.trim()) return;

    // Reaproveita o parser inteligente da Tarefa 12
    const parsed = parseNaturalInput(query.trim());
    const newId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    dispatch({
      type: "ADD_TASK",
      id: newId,
      title: parsed.title,
      category: parsed.date ? "small" : "inbox",
      date: parsed.date ?? null,
      estimatedMinutes: parsed.durationMinutes,
      lifeArea,
    });

    // Se tiver horário e data, já cria o bloco de tempo
    if (parsed.startTime && parsed.date) {
      let endH = parseInt(parsed.startTime.split(":")[0]);
      let endM = parseInt(parsed.startTime.split(":")[1]) + (parsed.durationMinutes || 30);
      
      while (endM >= 60) {
        endM -= 60;
        endH += 1;
      }
      
      const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

      dispatch({
        type: "ADD_TIME_BLOCK",
        taskId: newId,
        date: parsed.date,
        startTime: parsed.startTime,
        endTime,
      });
    }

    setOpen(false);
    setQuery("");
    setLifeArea(null);
  };

  return (
    <>
      <div 
        className="liquid-scrim fixed inset-0 z-[100] backdrop-blur-[10px] backdrop-saturate-[130%] transition-opacity duration-200 ease-apple"
        onClick={() => {
          setOpen(false);
          setQuery("");
          setLifeArea(null);
        }} 
        aria-hidden
      />
      <div className="fixed left-1/2 top-[15vh] z-[101] w-full max-w-2xl -translate-x-1/2 px-4 sm:top-[20vh]">
        <div className="liquid-panel relative rounded-2xl backdrop-blur-[26px] backdrop-brightness-[1.02] backdrop-saturate-[180%] backdrop-contrast-[1.08]">
          <div className="relative z-10 flex items-center px-4">
            <Search size={20} className="mr-3 shrink-0 text-label-secondary" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCapture();
              }}
              placeholder="Criar tarefa (ex: Pagar boleto amanhã 10h)"
              className="a-body h-[52px] w-full bg-transparent text-label placeholder:text-label-secondary focus:outline-none"
            />
          </div>
          <div className="relative z-10 border-t border-separator px-4 py-3">
            <LifeAreaPicker value={lifeArea} onChange={setLifeArea} compact />
          </div>
          {query.trim() && (
            <div className="relative z-10 border-t border-separator p-2">
              <button
                type="button"
                onClick={handleCapture}
                className="a-body flex w-full items-center rounded-xl bg-system-accent px-4 py-3 text-white transition-colors"
              >
                Criar tarefa: <span className="ml-1 font-semibold truncate">{query}</span>
                <span className="ml-auto text-xs opacity-70 shrink-0 uppercase tracking-wider">↵ Enter</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
