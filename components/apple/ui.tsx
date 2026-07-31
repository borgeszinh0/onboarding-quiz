"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";

/** Cartão comum sólido/elevado. Blur fica restrito ao cromo persistente e overlays. */
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
    <p className="a-caption uppercase text-[color:var(--label-secondary)]">
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
        <p className="a-caption mb-2 text-[color:var(--label-secondary)]">
          {eyebrow}
        </p>
      )}
      <h1 className="a-large-title">
        {title}
      </h1>
      {subtitle && (
        <p className="a-body mt-3 max-w-xl text-[color:var(--label-secondary)]">
          {subtitle}
        </p>
      )}
    </header>
  );
}
