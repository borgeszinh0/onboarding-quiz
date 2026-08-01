"use client";

import type { LifeArea } from "@/lib/planner-types";
import { LIFE_AREA_LABEL, LIFE_AREA_ORDER } from "@/lib/life-areas";

export function LifeAreaPicker({
  value,
  onChange,
  compact = false,
  showLabel = true,
}: {
  value?: LifeArea | null;
  onChange: (area: LifeArea | null) => void;
  compact?: boolean;
  showLabel?: boolean;
}) {
  return (
    <div className="space-y-2">
      {showLabel && <p className="a-caption text-label-secondary">Área</p>}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Área da vida">
        {LIFE_AREA_ORDER.map((area) => {
          const selected = value === area;
          return (
            <button
              key={area}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : area)}
              className={`a-caption min-h-[44px] rounded-xl border px-3 transition-colors ${
                compact ? "min-w-[88px]" : ""
              }`}
              style={{
                background: selected ? "var(--glass-2)" : "var(--fill-subtle)",
                borderColor: selected
                  ? "var(--glass-border-strong)"
                  : "transparent",
                color: selected ? "var(--label)" : "var(--label-secondary)",
              }}
            >
              {LIFE_AREA_LABEL[area]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
