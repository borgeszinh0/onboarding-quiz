"use client";

import { useState, useEffect, useRef } from "react";
import { usePlanner } from "@/lib/planner-store";
import { parseNaturalInput } from "@/lib/parser";
import { Search } from "lucide-react";

export default function CommandBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { dispatch } = usePlanner();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Abre com Cmd+K ou Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      // Fecha com Esc
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focar o input automaticamente quando abre
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
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
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm transition-opacity duration-200 ease-apple"
        onClick={() => setOpen(false)} 
        aria-hidden
      />
      <div className="fixed left-1/2 top-[15vh] z-[101] w-full max-w-2xl -translate-x-1/2 px-4 sm:top-[20vh]">
        <div className="overflow-hidden rounded-2xl bg-[color:var(--bg-elevated)] shadow-2xl ring-1 ring-[color:var(--separator)]">
          <div className="flex items-center px-4">
            <Search size={20} className="mr-3 shrink-0 text-[color:var(--label-secondary)]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCapture();
              }}
              placeholder="Criar tarefa (ex: Pagar boleto amanhã 10h)"
              className="a-body h-[52px] w-full bg-transparent text-[color:var(--label)] placeholder:text-[color:var(--label-secondary)] focus:outline-none"
            />
          </div>
          {query.trim() && (
            <div className="border-t border-[color:var(--separator)] p-2">
              <button
                type="button"
                onClick={handleCapture}
                className="a-body flex w-full items-center rounded-xl bg-[color:var(--color-accent)] px-4 py-3 text-white transition-colors"
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
