"use client";

import Link from "next/link";
import { PageTitle } from "@/components/apple/ui";

const MORE_ITEMS = [
  { href: "/mes", label: "Mês" },
  { href: "/ano", label: "Ano" },
  { href: "/dados", label: "Dados" },
  { href: "/login", label: "Conta" },
  { href: "/dados", label: "Backup" },
];

export default function MaisPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-24 pt-8">
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
    </main>
  );
}
