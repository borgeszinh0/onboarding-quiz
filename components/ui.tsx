"use client";

import { ReactNode } from "react";

interface SliderProps {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
}

export function Slider({ label, description, value, onChange }: SliderProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#1A1715]">{label}</p>
          <p className="text-xs text-[#8A7F75] leading-snug mt-0.5">
            {description}
          </p>
        </div>
        <div className="flex items-baseline gap-0.5 shrink-0">
          <span
            className={`text-3xl font-bold tabular-nums ${
              value === 0 ? "text-[#D4C9B5]" : "text-[#B8392E]"
            }`}
          >
            {value}
          </span>
          <span className="text-sm text-[#8A7F75]">/10</span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, #B8392E ${value * 10}%, #D4C9B5 ${value * 10}%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-[#8A7F75] tracking-wide">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}

interface TextBoxProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
}

export function TextBox({
  value,
  onChange,
  placeholder,
  rows = 4,
  label,
}: TextBoxProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-sm font-semibold text-[#1A1715]">{label}</p>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg bg-white/60 border border-[#D4C9B5] px-4 py-3 text-sm text-[#1A1715] placeholder:text-[#8A7F75]/60 focus:border-[#B8392E] focus:ring-2 focus:ring-[#B8392E]/10 focus:outline-none transition-all resize-none"
      />
    </div>
  );
}

interface NavButtonsProps {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  children?: ReactNode;
}

export function NavButtons({
  onBack,
  onNext,
  nextLabel = "Continuar",
  nextDisabled = false,
}: NavButtonsProps) {
  return (
    <div className="flex items-center justify-between mt-10">
      <button
        onClick={onBack}
        className="text-sm font-medium text-[#8A7F75] hover:text-[#1A1715] transition-colors"
      >
        ← Voltar
      </button>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="px-7 py-3.5 rounded-full bg-[#B8392E] text-[#F5F0E6] text-sm font-semibold tracking-wide hover:bg-[#8B2A22] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
      >
        {nextLabel}
      </button>
    </div>
  );
}

export function StepHeader({
  title,
  subtitle,
  eyebrow,
  number,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  number?: string;
}) {
  return (
    <div className="mb-8">
      {number && (
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-mono font-bold tracking-widest text-[#B8392E]">
            {number}
          </span>
          {eyebrow && (
            <span className="text-[10px] uppercase tracking-widest text-[#8A7F75]">
              {eyebrow}
            </span>
          )}
        </div>
      )}
      <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1715] leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-[#4A433D] mt-2 max-w-lg leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
