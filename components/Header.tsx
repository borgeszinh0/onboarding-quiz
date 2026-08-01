"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useSync } from "@/lib/cloud-sync";

const NAV = [
  { href: "/", label: "Hoje" },
  { href: "/inbox", label: "Inbox" },
  { href: "/semana", label: "Semana" },
  { href: "/habitos", label: "Hábitos" },
  { href: "/mes", label: "Mês" },
  { href: "/ano", label: "Ano" },
  { href: "/dados", label: "Dados" },
];

const MOBILE_TABS = [
  { href: "/", label: "Hoje", icon: "today" },
  { href: "/inbox", label: "Inbox", icon: "inbox" },
  { href: "/semana", label: "Semana", icon: "week" },
  { href: "/habitos", label: "Hábitos", icon: "habits" },
  { href: "/mais", label: "Mais", icon: "more" },
] as const;

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
      className="a-caption hidden items-center gap-1.5 text-label-secondary sm:inline-flex"
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

function NavIcon({ icon, active }: { icon: (typeof MOBILE_TABS)[number]["icon"], active?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-6 w-6 transition-all duration-200"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={active ? "2.5" : "1.75"}
    >
      {icon === "today" && (
        <>
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <path d="M4 9h16" />
          <rect x="4" y="5" width="16" height="17" rx="3" />
          <path d="M9 14h6" />
        </>
      )}
      {icon === "inbox" && (
        <>
          <path d="M4 13h5l2 3h2l2-3h5" />
          <path d="M5 13 7 5h10l2 8v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
        </>
      )}
      {icon === "week" && (
        <>
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect x="4" y="5" width="16" height="17" rx="3" />
          <path d="M8 11h.01" />
          <path d="M12 11h.01" />
          <path d="M16 11h.01" />
          <path d="M8 15h.01" />
          <path d="M12 15h.01" />
          <path d="M16 15h.01" />
        </>
      )}
      {icon === "more" && (
        <>
          <circle cx="12" cy="6" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
        </>
      )}
      {icon === "habits" && (
        <>
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="m9 12 2 2 4-4" />
        </>
      )}
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { user, configured, signOut } = useAuth();

  // Sem cromo na tela de autenticação.
  if (pathname === "/login") return null;

  return (
    <>
      <header
        className="liquid-topbar sticky top-0 z-40 hidden border-b backdrop-blur-[24px] backdrop-brightness-[1.02] backdrop-saturate-[170%] sm:block"
        style={{
          borderColor: "var(--separator)",
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
                  className={`a-caption flex min-h-[44px] items-center whitespace-nowrap rounded-full px-3.5 transition-colors duration-200 ${
                    active ? "liquid-control" : "hover-bg-fill-subtle hover-text-label"
                  }`}
                  style={
                    active
                      ? { color: "var(--label)" }
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
                  className="a-caption a-hit-44 text-label-secondary transition-colors hover-text-label"
                >
                  Sair
                </button>
              ) : (
                <Link
                  href="/login"
                  className="a-caption a-hit-44 text-accent"
                >
                  Entrar
                </Link>
              ))}
          </div>
        </nav>
      </header>

      <div
        aria-hidden
        className="dock-underlay fixed inset-x-0 bottom-0 z-30 backdrop-blur-[18px] backdrop-saturate-[112%] sm:hidden"
      />

      <nav
        aria-label="Navegação principal"
        className="liquid-dock fixed inset-x-[18px] bottom-dock-safe z-40 h-[72px] rounded-full sm:hidden"
      >
        <div className="relative z-10 mx-auto flex h-full max-w-xl items-center justify-between px-3.5">
          {MOBILE_TABS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.href === "/mais"
                  ? ["/mais", "/mes", "/ano", "/dados"].some((href) =>
                      pathname === href || pathname.startsWith(`${href}/`)
                    )
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="group flex flex-1 items-center justify-center h-full active:scale-95 transition-transform duration-200"
                style={{ 
                  color: active ? "var(--dock-active-label)" : "var(--dock-inactive-label)"
                }}
              >
                <div 
                  className={`flex items-center justify-center transition-all duration-300 ${active ? "liquid-dock-pill h-[56px] w-[84px]" : "h-[56px] w-[54px]"}`}
                >
                  <NavIcon icon={item.icon} active={active} />
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
