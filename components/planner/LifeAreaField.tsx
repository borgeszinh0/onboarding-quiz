"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { LifeArea } from "@/lib/planner-types";
import {
  LIFE_AREA_COLOR,
  LIFE_AREA_LABEL,
  LIFE_AREA_ORDER,
} from "@/lib/life-areas";

export function LifeAreaBadge({ area }: { area?: LifeArea | null }) {
  if (!area) {
    return <span className="a-caption text-label-secondary">Sem área</span>;
  }

  return (
    <span className="a-caption text-label-secondary">
      {LIFE_AREA_LABEL[area]}
    </span>
  );
}

export function LifeAreaMenu({
  value,
  onChange,
  label = "Área",
  compact = false,
}: {
  value?: LifeArea | null;
  onChange: (area: LifeArea | null) => void;
  label?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedLabel = value ? LIFE_AREA_LABEL[value] : "Sem área";
  const selectedColor = value ? LIFE_AREA_COLOR[value] : "rgba(255,255,255,.34)";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const choose = (area: LifeArea | null) => {
    onChange(area);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${compact ? "inline-flex" : "block w-full"}`}>
      <button
        type="button"
        aria-label={`${label}: ${selectedLabel}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={`a-caption relative z-10 inline-flex min-h-[44px] items-center justify-between gap-2 rounded-full border px-3 text-left transition-colors ${
          compact ? "min-w-[116px] max-w-[152px]" : "w-full"
        }`}
        style={{
          background: value
            ? `color-mix(in oklab, ${selectedColor} 18%, var(--glass-2))`
            : "var(--fill-subtle)",
          borderColor: value
            ? `color-mix(in oklab, ${selectedColor} 44%, transparent)`
            : "var(--separator)",
          color: value ? "var(--label)" : "var(--label-secondary)",
        }}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: selectedColor }}
            aria-hidden
          />
          <span className="truncate">{selectedLabel}</span>
        </span>
        <svg
          viewBox="0 0 12 12"
          className="h-3 w-3 shrink-0 opacity-70"
          fill="none"
          aria-hidden
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          id={id}
          role="listbox"
          aria-label={label}
          className={`liquid-panel absolute right-0 top-full z-[70] mt-2 rounded-2xl p-1.5 ${
            compact ? "w-56" : "w-full min-w-56"
          }`}
        >
          <LifeAreaOption
            selected={!value}
            label="Sem área"
            color="rgba(255,255,255,.34)"
            onSelect={() => choose(null)}
          />
          {LIFE_AREA_ORDER.map((area) => (
            <LifeAreaOption
              key={area}
              selected={value === area}
              label={LIFE_AREA_LABEL[area]}
              color={LIFE_AREA_COLOR[area]}
              onSelect={() => choose(area)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LifeAreaOption({
  selected,
  label,
  color,
  onSelect,
}: {
  selected: boolean;
  label: string;
  color: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className="a-caption relative z-10 flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 text-left text-label-secondary transition-colors hover-bg-fill-subtle"
      style={{
        color: selected ? "var(--label)" : "var(--label-secondary)",
        background: selected
          ? `color-mix(in oklab, ${color} 14%, transparent)`
          : "transparent",
      }}
    >
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {selected && (
        <span className="text-label" aria-hidden>
          ✓
        </span>
      )}
    </button>
  );
}
