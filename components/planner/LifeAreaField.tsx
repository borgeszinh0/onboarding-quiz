"use client";

import type { LifeArea } from "@/lib/planner-types";
import { LIFE_AREA_LABEL, LIFE_AREA_ORDER } from "@/lib/life-areas";

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

export function LifeAreaSelect({
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
  return (
    <label className={compact ? "inline-block max-w-[180px]" : "block"}>
      <span className="sr-only">{label}</span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange((event.target.value || null) as LifeArea | null)}
        className={`a-caption min-h-[44px] rounded-xl border border-separator bg-fill-subtle px-3 text-label-secondary ${
          compact ? "w-auto min-w-[136px]" : "w-full"
        }`}
        aria-label={label}
      >
        <option value="">Sem área</option>
        {LIFE_AREA_ORDER.map((area) => (
          <option key={area} value={area}>
            {LIFE_AREA_LABEL[area]}
          </option>
        ))}
      </select>
    </label>
  );
}
