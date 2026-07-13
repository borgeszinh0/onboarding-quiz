"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useSync } from "@/lib/cloud-sync";

const NAV = [
  { href: "/quiz", label: "Quiz" },
  { href: "/resultado", label: "Mapa" },
  { href: "/plano", label: "Plano" },
  { href: "/dados", label: "Dados" },
];

function SyncBadge() {
  const { status } = useSync();
  const { user, configured } = useAuth();
  if (!configured || !user) return null;

  const map: Record<string, { dot: string; label: string }> = {
    synced: { dot: "#2D7A4E", label: "Sincronizado" },
    saving: { dot: "#B8392E", label: "Salvando…" },
    pulling: { dot: "#B8392E", label: "Carregando…" },
    error: { dot: "#8A7F75", label: "Erro de sync" },
    idle: { dot: "#8A7F75", label: "" },
  };
  const s = map[status] ?? map.idle;
  if (!s.label) return null;

  return (
    <span
      className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono text-[#8A7F75]"
      title={s.label}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: s.dot }}
        aria-hidden
      />
      {s.label}
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { user, configured, signOut } = useAuth();

  // Hide chrome on the auth screen itself.
  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-40 border-b border-[#D4C9B5]/60 bg-[#F5F0E6]/85 backdrop-blur-md">
      <nav
        aria-label="Navegação principal"
        className="max-w-2xl mx-auto flex items-center gap-3 px-5 h-14"
      >
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <span className="w-7 h-7 rounded-full bg-[#B8392E] flex items-center justify-center text-sm group-hover:scale-105 transition-transform">
            🧭
          </span>
          <span className="hidden sm:block text-sm font-bold tracking-tight text-[#1A1715]">
            Valores
          </span>
        </Link>

        <div className="flex items-center gap-1 ml-2 overflow-x-auto">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? "bg-[#B8392E] text-[#F5F0E6]"
                    : "text-[#8A7F75] hover:text-[#1A1715] hover:bg-[#D4C9B5]/30"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <SyncBadge />
          {configured &&
            (user ? (
              <button
                onClick={signOut}
                className="text-[11px] font-medium text-[#8A7F75] hover:text-[#B8392E] transition-colors"
              >
                Sair
              </button>
            ) : (
              <Link
                href="/login"
                className="text-[11px] font-semibold text-[#B8392E] hover:text-[#8B2A22] transition-colors"
              >
                Entrar
              </Link>
            ))}
        </div>
      </nav>
    </header>
  );
}
