"use client";

import Link from "next/link";
import { PageTitle, SectionLabel } from "@/components/apple/ui";
import { useTheme } from "@/lib/theme-context";

const MORE_ITEMS = [
  { href: "/perfil", label: "Meu Perfil & Métricas" },
  { href: "/objetivos", label: "Objetivos do Ano" },
  { href: "/mes", label: "Calendário do Mês" },
  { href: "/ano", label: "Visão Anual" },
  { href: "/dados", label: "Backup e Dados" },
];

export default function MaisPage() {
  const { theme, setTheme } = useTheme();

  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-32 pt-8">
      <PageTitle eyebrow="Mais" title="Mais" />

      <nav
        aria-label="Rotas secundárias"
        className="divide-y divide-[color:var(--separator)]"
      >
        {MORE_ITEMS.map((item) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className="a-body flex h-[52px] items-center justify-between"
          >
            <span>{item.label}</span>
            <span aria-hidden className="a-body text-[color:var(--label-secondary)]">
              ›
            </span>
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <SectionLabel>Aparência</SectionLabel>
        <div className="mt-2 flex overflow-hidden rounded-xl bg-[color:var(--fill-subtle)] p-1">
          {(["system", "light", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className="a-body flex-1 rounded-lg py-2 capitalize transition-colors duration-200"
              style={
                theme === t
                  ? { background: "var(--bg)", color: "var(--label)", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }
                  : { color: "var(--label-secondary)" }
              }
            >
              {t === "system" ? "Sistema" : t === "light" ? "Claro" : "Escuro"}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
