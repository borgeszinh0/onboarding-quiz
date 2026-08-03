"use client";

import Link from "next/link";
import { PageTitle } from "@/components/apple/ui";

const MORE_ITEMS = [
  { href: "/primeiros-passos", label: "Primeiros passos" },
  { href: "/objetivos", label: "Objetivos" },
  { href: "/perfil", label: "Perfil" },
  { href: "/historico", label: "Histórico dos Dias" },
  { href: "/dados", label: "Dados" },
  { href: "/mes", label: "Calendário do Mês" },
  { href: "/ano", label: "Visão Anual" },
];

export default function MaisPage() {
  return (
    <main className="page-shell page-with-dock mx-auto w-full max-w-xl px-5">
      <PageTitle eyebrow="Mais" title="Mais" />

      <nav
        aria-label="Rotas secundárias"
        className="divide-y divide-separator"
      >
        {MORE_ITEMS.map((item) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className="a-body flex h-[52px] items-center justify-between"
          >
            <span>{item.label}</span>
            <span aria-hidden className="a-body text-label-secondary">
              ›
            </span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
