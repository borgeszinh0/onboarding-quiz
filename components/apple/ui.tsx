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

/** 
 * Modal nativo de deslizar de baixo para cima (iOS). 
 * Bloqueia a rolagem do corpo e oferece um backdrop interativo.
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity a-enter"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col overflow-hidden rounded-t-[32px] bg-[color:var(--bg)] transition-transform a-enter"
        style={{
          boxShadow: "0 -8px 24px rgba(0,0,0,0.12)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex shrink-0 items-center justify-center pt-3 pb-2">
          <div className="h-1.5 w-10 rounded-full bg-[color:var(--separator)]" />
        </div>
        <div className="overflow-y-auto px-5 pb-12">
          {children}
        </div>
      </div>
    </>
  );
}
