"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useSync } from "@/lib/cloud-sync";

const NAV = [
  { href: "/", label: "Hoje" },
  { href: "/inbox", label: "Inbox" },
  { href: "/semana", label: "Semana" },
  { href: "/mes", label: "Mês" },
  { href: "/ano", label: "Ano" },
  { href: "/dados", label: "Dados" },
];

const SYNC_LABELS: Record<string, { dot: string; label: string }> = {
  synced: { dot: "var(--success-fill)", label: "Sincronizado" },
  saving: { dot: "var(--color-atencao)", label: "Salvando…" },
  pulling: { dot: "var(--color-atencao)", label: "Carregando…" },
  error: { dot: "var(--color-danger)", label: "Erro de sync" },
  idle: { dot: "transparent", label: "" },
};

function SyncBadge() {
  const { status } = useSync();
  const { user, configured } = useAuth();
  if (!configured || !user) return null;

  const s = SYNC_LABELS[status] ?? SYNC_LABELS.idle;
  if (!s.label) return null;

  return (
    <span
      className="hidden items-center gap-1.5 text-[11px] text-[color:var(--label-secondary)] sm:inline-flex"
      title={s.label}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: s.dot }}
      />
      {s.label}
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { user, configured, signOut } = useAuth();

  // Sem cromo na tela de autenticação.
  if (pathname === "/login") return null;

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-xl"
      style={{
        borderColor: "var(--separator)",
        background: "color-mix(in oklab, var(--bg) 82%, transparent)",
      }}
    >
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex h-14 max-w-xl items-center gap-2 px-5"
      >
        <div
          className="flex items-center gap-1 overflow-x-auto"
          style={{
            maskImage: "linear-gradient(to right, black calc(100% - 20px), transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, black calc(100% - 20px), transparent)",
          }}
        >
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[44px] items-center whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors duration-200 ${
                  active ? "" : "hover:bg-[color:var(--fill-subtle)] hover:text-[color:var(--label)]"
                }`}
                style={
                  active
                    ? { background: "var(--color-accent)", color: "#fff" }
                    : { color: "var(--label-secondary)" }
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <SyncBadge />
          {configured &&
            (user ? (
              <button
                type="button"
                onClick={signOut}
                className="a-hit-44 text-[13px] text-[color:var(--label-secondary)] transition-colors hover:text-[color:var(--label)]"
              >
                Sair
              </button>
            ) : (
              <Link
                href="/login"
                className="a-hit-44 text-[13px] font-medium text-[color:var(--accent-text)]"
              >
                Entrar
              </Link>
            ))}
        </div>
      </nav>
    </header>
  );
}
