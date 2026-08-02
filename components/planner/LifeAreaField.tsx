"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
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
    <span
      className="a-caption inline-flex items-center gap-1.5"
      style={{ color: LIFE_AREA_COLOR[area] }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: LIFE_AREA_COLOR[area] }}
        aria-hidden
      />
      {LIFE_AREA_LABEL[area]}
    </span>
  );
}

export function LifeAreaMenu({
  value,
  onChange,
  label = "Área",
  compact = false,
  noneLabel = "Sem área",
}: {
  value?: LifeArea | null;
  onChange: (area: LifeArea | null) => void;
  label?: string;
  compact?: boolean;
  noneLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const selectedLabel = value ? LIFE_AREA_LABEL[value] : noneLabel;
  const selectedColor = value ? LIFE_AREA_COLOR[value] : "rgba(255,255,255,.34)";

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const choose = (area: LifeArea | null) => {
    onChange(area === value ? null : area);
    setOpen(false);
  };

  return (
    <div className={compact ? "inline-flex" : "block w-full"}>
      <button
        type="button"
        aria-label={`${label}: ${selectedLabel}`}
        aria-haspopup="dialog"
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
        className={`a-caption relative z-10 inline-flex min-h-[44px] items-center justify-end gap-1.5 rounded-full border border-transparent px-2 text-left transition-colors hover-bg-fill-subtle ${
          compact ? "min-w-[88px] max-w-[132px]" : "w-full"
        }`}
        style={{
          background: "transparent",
          color: value ? selectedColor : "var(--label-secondary)",
        }}
      >
        <span className="flex min-w-0 items-center">
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

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center px-5"
            role="dialog"
            aria-modal="true"
            aria-label={label}
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default bg-[rgba(0,0,0,.42)] backdrop-blur-[8px]"
              aria-label="Fechar seleção de área"
              onClick={() => setOpen(false)}
            />
            <div
              id={id}
              role="listbox"
              aria-label={label}
              className="relative z-10 w-full max-w-[320px] rounded-[24px] border p-2 shadow-[0_24px_72px_rgba(0,0,0,.58)]"
              style={{
                background: "rgba(12, 12, 16, 0.96)",
                borderColor: "rgba(255,255,255,.16)",
                backdropFilter: "blur(18px) saturate(130%)",
              }}
            >
              <div className="px-3 pb-2 pt-2">
                <p className="a-caption text-label-secondary">{label}</p>
              </div>
              <LifeAreaOption
                selected={!value}
                label={noneLabel}
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
          </div>,
          document.body
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
        color: selected ? color : "var(--label-secondary)",
        background: selected
          ? `color-mix(in oklab, ${color} 10%, transparent)`
          : "transparent",
      }}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {selected && (
        <span className="text-label" aria-hidden>
          ✓
        </span>
      )}
    </button>
  );
}
