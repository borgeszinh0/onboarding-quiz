"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BottomSheet, Card } from "@/components/apple/ui";
import {
  LIFE_AREA_LABEL,
  LIFE_AREA_ORDER,
  getLifeAreaRadarRows,
  type LifeAreaRadarRow,
} from "@/lib/life-areas";
import { usePlanner } from "@/lib/planner-store";
import type { LifeArea, PlannerState } from "@/lib/planner-types";

const SIZE = 360;
const CENTER = SIZE / 2;
const RADIUS = 118;
const LABEL_RADIUS = 142;
const LEVELS = [25, 50, 75, 100];

export function LifeAreasPanel({ state }: { state: PlannerState }) {
  const { dispatch } = usePlanner();
  const data = useMemo(() => getLifeAreaRadarRows(state), [state]);
  const [selectedArea, setSelectedArea] = useState<LifeArea>(data.rows[0].area);
  const [managing, setManaging] = useState(false);
  const selected = data.rows.find((row) => row.area === selectedArea) ?? data.rows[0];
  const hasHabitsWithoutArea = state.habits.some((habit) => !habit.lifeArea);
  const hasClassifiedHabits = state.habits.some((habit) => !!habit.lifeArea);

  if (data.classifiedItems === 0) {
    return (
      <Card className="p-5">
        <div className="space-y-3">
          <div>
            <h2 className="a-title-2 text-label">Áreas da vida</h2>
            <p className="a-body mt-2 text-label-secondary">
              {hasHabitsWithoutArea
                ? "Classifique seus hábitos por área para que eles entrem no radar."
                : "Classifique tarefas e hábitos por área para ver seu mapa."}
            </p>
          </div>
          <Link
            href={hasHabitsWithoutArea ? "/habitos" : "/inbox"}
            className="a-btn a-btn-secondary inline-flex"
          >
            {hasHabitsWithoutArea ? "Classificar hábitos" : "Classificar tarefas"}
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6" allowOverflow>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,.95fr)] lg:items-center">
        <div>
          <div className="mb-4 lg:hidden">
            <div className="flex items-start justify-between gap-3">
              <h2 className="a-title-2 text-label">Áreas da vida</h2>
              <ManageTargetsButton onClick={() => setManaging(true)} />
            </div>
            <p className="a-body mt-2 text-label-secondary">
              Distribuição das suas ações concluídas nos últimos 30 dias.
              Inclui tarefas, foco e hábitos classificados por área.
            </p>
          </div>

          <LifeRadar
            rows={data.rows}
            hasPrevious={data.hasPrevious}
            selectedArea={selectedArea}
            onSelect={setSelectedArea}
          />
        </div>

        <div className="space-y-5">
          <div className="hidden lg:block">
            <div className="flex items-start justify-between gap-3">
              <h2 className="a-title-2 text-label">Áreas da vida</h2>
              <ManageTargetsButton onClick={() => setManaging(true)} />
            </div>
            <p className="a-body mt-2 text-label-secondary">
              Distribuição das suas ações concluídas nos últimos 30 dias.
              Inclui tarefas, foco e hábitos classificados por área.
            </p>
          </div>

          <SeriesLegend hasPrevious={data.hasPrevious} />

          {data.isEarly && (
            <p className="a-caption rounded-xl border border-separator bg-fill-subtle px-3 py-2 text-label-secondary">
              Dados iniciais. O mapa fica mais útil após alguns dias de uso.
            </p>
          )}

          {hasClassifiedHabits && !data.hasAnyExecution && (
            <p className="a-caption rounded-xl border border-separator bg-fill-subtle px-3 py-2 text-label-secondary">
              Hábitos classificados aparecem no radar quando forem concluídos.
            </p>
          )}

          <LifeAreaTable
            rows={data.rows}
            hasPrevious={data.hasPrevious}
            selectedArea={selectedArea}
            onSelect={setSelectedArea}
          />

          <AreaDetail row={selected} hasPrevious={data.hasPrevious} />
        </div>
      </div>

      <LifeAreaTargetsSheet
        isOpen={managing}
        rows={data.rows}
        onClose={() => setManaging(false)}
        onChange={(area, target) =>
          dispatch({ type: "SET_LIFE_AREA_TARGET", area, target })
        }
      />
    </Card>
  );
}

function ManageTargetsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="a-hit-44 -mr-3 shrink-0 px-3 text-right a-caption text-accent hover:opacity-80"
    >
      Gerenciar
    </button>
  );
}

function LifeAreaTargetsSheet({
  isOpen,
  rows,
  onClose,
  onChange,
}: {
  isOpen: boolean;
  rows: LifeAreaRadarRow[];
  onClose: () => void;
  onChange: (area: LifeArea, target: number) => void;
}) {
  const targets = new Map(rows.map((row) => [row.area, row.target]));

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="a-title-2 text-label">Metas por área</h2>
            <p className="a-body mt-2 text-label-secondary">
              Ajuste o alvo visual de cada categoria no radar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="a-hit-44 -mr-3 px-3 a-caption text-accent hover:opacity-80"
          >
            Concluir
          </button>
        </div>

        <div className="space-y-3">
          {LIFE_AREA_ORDER.map((area) => {
            const value = targets.get(area) ?? 75;
            return (
              <label
                key={area}
                className="grid gap-3 rounded-2xl border border-separator bg-fill-subtle p-4"
              >
                <span className="flex items-center justify-between gap-4">
                  <span className="a-headline text-label">{LIFE_AREA_LABEL[area]}</span>
                  <span className="a-caption tabular text-label-secondary">{value}%</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={value}
                  onChange={(event) => onChange(area, Number(event.target.value))}
                  className="life-target-slider"
                  aria-label={`Meta de ${LIFE_AREA_LABEL[area]}`}
                />
              </label>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}

function LifeRadar({
  rows,
  hasPrevious,
  selectedArea,
  onSelect,
}: {
  rows: LifeAreaRadarRow[];
  hasPrevious: boolean;
  selectedArea: LifeArea;
  onSelect: (area: LifeArea) => void;
}) {
  const currentPoints = getPolygonPoints(rows.map((row) => row.current));
  const previousPoints = getPolygonPoints(rows.map((row) => row.previous ?? 0));
  const targetPoints = getPolygonPoints(rows.map((row) => row.target));

  return (
    <div className="mx-auto max-w-[420px]">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-auto w-full"
        role="img"
        aria-label="Radar de distribuição por áreas da vida"
      >
        <defs>
          <radialGradient id="life-radar-core" cx="50%" cy="48%" r="52%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.13)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
          </radialGradient>
          <filter id="life-radar-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx={CENTER} cy={CENTER} r={RADIUS + 12} fill="url(#life-radar-core)" />

        {LEVELS.map((level) => (
          <polygon
            key={level}
            points={getPolygonPoints(rows.map(() => level))}
            fill="none"
            stroke="rgba(255,255,255,.08)"
            strokeWidth="1"
          />
        ))}

        {rows.map((row, index) => {
          const end = polarPoint(index, 100, RADIUS);
          return (
            <line
              key={row.area}
              x1={CENTER}
              y1={CENTER}
              x2={end.x}
              y2={end.y}
              stroke="rgba(255,255,255,.075)"
              strokeWidth="1"
            />
          );
        })}

        <polygon
          points={targetPoints}
          fill="rgba(255,255,255,.025)"
          stroke="rgba(255,255,255,.34)"
          strokeDasharray="4 6"
          strokeWidth="1.4"
        />

        {hasPrevious && (
          <polygon
            points={previousPoints}
            fill="rgba(56,189,248,.07)"
            stroke="#38bdf8"
            strokeOpacity=".72"
            strokeWidth="2"
          />
        )}

        <polygon
          points={currentPoints}
          fill="rgba(139,92,246,.18)"
          stroke="#8b5cf6"
          strokeWidth="2.5"
          filter="url(#life-radar-glow)"
        />

        {rows.map((row, index) => {
          const label = polarLabelPoint(index);
          const valuePoint = polarPoint(index, row.current, RADIUS);
          const selected = row.area === selectedArea;
          return (
            <g
              key={row.area}
              role="button"
              tabIndex={0}
              aria-label={`${row.label}: ${row.current}`}
              onMouseEnter={() => onSelect(row.area)}
              onClick={() => onSelect(row.area)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(row.area);
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={valuePoint.x}
                cy={valuePoint.y}
                r={selected ? 5 : 3.5}
                fill={selected ? row.color : "#8b5cf6"}
                stroke={selected ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.28)"}
                strokeWidth="1"
              />
              <circle cx={label.x} cy={label.y - 4} r="22" fill="transparent" />
              <text
                x={label.x}
                y={label.y}
                textAnchor={label.anchor}
                dominantBaseline="middle"
                fill={selected ? "rgba(255,255,255,.94)" : "rgba(255,255,255,.56)"}
                fontSize="11"
                fontWeight={selected ? 600 : 500}
              >
                {row.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SeriesLegend({ hasPrevious }: { hasPrevious: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <LegendItem label="Atual" color="#8b5cf6" />
      {hasPrevious && <LegendItem label="Anterior" color="#38bdf8" />}
      <LegendItem label="Meta" color="rgba(255,255,255,.64)" dashed />
    </div>
  );
}

function LegendItem({
  label,
  color,
  dashed = false,
}: {
  label: string;
  color: string;
  dashed?: boolean;
}) {
  return (
    <span className="a-caption inline-flex min-h-[32px] items-center gap-2 rounded-full border border-separator bg-fill-subtle px-3 text-label-secondary">
      <span
        className="h-2.5 w-5 rounded-full"
        style={{
          borderTop: dashed ? `1.5px dashed ${color}` : undefined,
          background: dashed ? "transparent" : color,
        }}
        aria-hidden
      />
      {label}
    </span>
  );
}

function LifeAreaTable({
  rows,
  hasPrevious,
  selectedArea,
  onSelect,
}: {
  rows: LifeAreaRadarRow[];
  hasPrevious: boolean;
  selectedArea: LifeArea;
  onSelect: (area: LifeArea) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-separator bg-fill-subtle">
      <div
        className={`a-caption grid px-3 py-2 text-label-secondary ${
          hasPrevious ? "grid-cols-[1fr_52px_52px_52px]" : "grid-cols-[1fr_52px_52px]"
        }`}
      >
        <span>Área</span>
        <span className="text-right">Atual</span>
        {hasPrevious && <span className="text-right">Antes</span>}
        <span className="text-right">Meta</span>
      </div>
      <div className="divide-y divide-separator">
        {rows.map((row) => {
          const selected = row.area === selectedArea;
          return (
            <button
              key={row.area}
              type="button"
              onMouseEnter={() => onSelect(row.area)}
              onClick={() => onSelect(row.area)}
              className={`a-caption grid min-h-[44px] w-full items-center px-3 text-left transition-colors ${
                hasPrevious ? "grid-cols-[1fr_52px_52px_52px]" : "grid-cols-[1fr_52px_52px]"
              }`}
              style={{
                background: selected ? "rgba(255,255,255,.07)" : "transparent",
                color: selected ? "var(--label)" : "var(--label-secondary)",
              }}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: row.color }}
                  aria-hidden
                />
                <span className="truncate">{row.label}</span>
              </span>
              <span className="tabular text-right">{row.current}</span>
              {hasPrevious && (
                <span className="tabular text-right">{row.previous ?? "-"}</span>
              )}
              <span className="tabular text-right">{row.target}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AreaDetail({
  row,
  hasPrevious,
}: {
  row: LifeAreaRadarRow;
  hasPrevious: boolean;
}) {
  return (
    <div className="rounded-2xl border border-separator bg-fill-subtle p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="a-headline text-label">{row.label}</p>
          <p className="a-caption text-label-secondary">
            Atual: <span className="tabular">{row.current}</span>
            {hasPrevious && (
              <>
                {" "}· Antes: <span className="tabular">{row.previous}</span>
              </>
            )}
            {" "}· Meta: <span className="tabular">{row.target}</span>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <DetailMetric label="tarefas" value={row.detail.tasksCompleted} />
        <DetailMetric label="foco" value={formatFocus(row.detail.focusMinutes)} />
        <DetailMetric label="hábitos concluídos" value={row.detail.habitCompletions} />
      </div>
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-bg px-3 py-2">
      <p className="a-caption tabular text-label">{value}</p>
      <p className="a-caption text-label-secondary">{label}</p>
    </div>
  );
}

function getPolygonPoints(values: number[]): string {
  return values
    .map((value, index) => {
      const point = polarPoint(index, value, RADIUS);
      return `${point.x},${point.y}`;
    })
    .join(" ");
}

function polarPoint(index: number, value: number, radius: number) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / 6;
  const scaledRadius = radius * (value / 100);
  return {
    x: CENTER + Math.cos(angle) * scaledRadius,
    y: CENTER + Math.sin(angle) * scaledRadius,
  };
}

function polarLabelPoint(index: number) {
  const point = polarPoint(index, 100, LABEL_RADIUS);
  if (index === 0 || index === 3) return { ...point, anchor: "middle" as const };
  if (point.x > CENTER) {
    return { ...point, x: Math.min(SIZE - 18, point.x), anchor: "end" as const };
  }
  return { ...point, x: Math.max(18, point.x), anchor: "start" as const };
}

function formatFocus(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
