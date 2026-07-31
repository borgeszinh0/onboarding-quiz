"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";

/** Cartão translúcido com blur. A profundidade vem da camada, não da borda. */
export function Card({
  children,
  className = "",
  accent,
}: {
  children: ReactNode;
  className?: string;
  /** Quando presente, pinta uma faixa de acento no topo do cartão. */
  accent?: string;
}) {
  return (
    <div className={`a-card relative overflow-hidden ${className}`}>
      {accent && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: accent }}
        />
      )}
      {children}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "plain";
  full?: boolean;
};

export function Button({
  variant = "primary",
  full = false,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? "a-btn-primary"
      : variant === "secondary"
        ? "a-btn-secondary"
        : "";
  const plain =
    variant === "plain"
      ? "text-[color:var(--accent-text)] hover:opacity-70"
      : "";

  return (
    <button
      className={`a-btn ${variantClass} ${plain} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Título de seção: rótulo pequeno em caixa alta + espaço generoso. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px] font-medium uppercase tracking-[0.06em] text-[color:var(--label-secondary)]">
      {children}
    </p>
  );
}

export function PageTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <header className="mb-8">
      {eyebrow && (
        <p className="mb-2 text-[13px] font-medium text-[color:var(--label-secondary)]">
          {eyebrow}
        </p>
      )}
      <h1 className="text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.02em]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 max-w-xl text-[17px] leading-[1.5] text-[color:var(--label-secondary)]">
          {subtitle}
        </p>
      )}
    </header>
  );
}

