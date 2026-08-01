"use client";

import Link from "next/link";
import { PageTitle } from "@/components/apple/ui";

const MORE_ITEMS = [
  { href: "/perfil", label: "Meu Perfil & Métricas" },
  { href: "/objetivos", label: "Objetivos do Ano" },
  { href: "/mes", label: "Calendário do Mês" },
  { href: "/ano", label: "Visão Anual" },
  { href: "/dados", label: "Backup e Dados" },
];

export default function MaisPage() {
  return (
    <main className="page-with-bottom-dock mx-auto w-full max-w-xl px-5 pt-8">
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
