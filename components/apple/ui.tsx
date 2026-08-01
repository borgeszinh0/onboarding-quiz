"use client";

import { ReactNode, ButtonHTMLAttributes, CSSProperties } from "react";

/** Cartão comum sólido/elevado. Blur fica restrito ao cromo persistente e overlays. */
export function Card({
  children,
  className = "",
  allowOverflow = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  allowOverflow?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`a-card relative ${
        allowOverflow ? "overflow-visible" : "overflow-hidden"
      } ${className}`}
      style={style}
    >
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
        ? "a-btn-secondary backdrop-blur-[18px] backdrop-brightness-[1.01] backdrop-saturate-[165%] backdrop-contrast-[1.08]"
        : "";
  const plain =
    variant === "plain"
      ? "text-accent hover:opacity-70"
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
    <p className="a-caption uppercase text-label-secondary">
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
        <p className="a-caption mb-2 text-label-secondary">
          {eyebrow}
        </p>
      )}
      <h1 className="a-large-title">
        {title}
      </h1>
      {subtitle && (
        <p className="a-body mt-3 max-w-xl text-label-secondary">
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
        className="liquid-scrim fixed inset-0 z-50 backdrop-blur-[10px] backdrop-saturate-[130%] transition-opacity a-enter"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="liquid-panel fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-[32px] backdrop-blur-[26px] backdrop-brightness-[1.02] backdrop-saturate-[180%] backdrop-contrast-[1.08] transition-transform a-enter"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="relative z-10 flex shrink-0 items-center justify-center pt-3 pb-2">
          <div className="h-1.5 w-10 rounded-full bg-separator" />
        </div>
        <div className="relative z-10 overflow-y-auto px-5 pb-12">
          {children}
        </div>
      </div>
    </>
  );
}
