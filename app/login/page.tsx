"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { signIn, signUp, configured } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      setError("Informe e-mail e senha (mín. 6 caracteres).");
      return;
    }
    setLoading(true);
    setError(null);
    const fn = mode === "in" ? signIn : signUp;
    const { error } = await fn(email.trim(), password);
    setLoading(false);
    if (error) {
      setError(translate(error));
      return;
    }
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#1A1715] flex items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full">
        <Link href="/" className="mb-8 flex min-h-[44px] items-center justify-center gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#B8392E]">
            🧭
          </span>
        </Link>

        <h1 className="a-title-2 mb-1 text-center">
          {mode === "in" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="a-subheadline mb-8 text-center text-[#8A7F75]">
          Sincronize seus valores, metas e plano em todos os dispositivos.
        </p>

        {!configured ? (
          <div className="a-subheadline rounded-2xl border border-[#D4C9B5] bg-white/50 p-5 text-[#4A433D]">
            Backend não configurado. O app funciona offline neste dispositivo.
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                aria-label="E-mail"
                className="a-subheadline min-h-[44px] w-full rounded-xl border border-[#D4C9B5] bg-white/60 px-4 text-[#1A1715] placeholder:text-[#8A7F75]/60 focus:border-[#B8392E] focus:ring-2 focus:ring-[#B8392E]/10 focus:outline-none transition-all"
              />
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "in" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha (mín. 6)"
                aria-label="Senha"
                className="a-subheadline min-h-[44px] w-full rounded-xl border border-[#D4C9B5] bg-white/60 px-4 text-[#1A1715] placeholder:text-[#8A7F75]/60 focus:border-[#B8392E] focus:ring-2 focus:ring-[#B8392E]/10 focus:outline-none transition-all"
              />
              {error && (
                <p className="a-caption text-[#B8392E]" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="a-subheadline min-h-[44px] w-full rounded-full bg-[#B8392E] px-6 text-[#F5F0E6] hover:bg-[#8B2A22] disabled:opacity-50 transition-all"
              >
                {loading
                  ? "Aguarde…"
                  : mode === "in"
                    ? "Entrar"
                    : "Criar conta"}
              </button>
            </form>

            <p className="a-caption mt-5 text-center text-[#8A7F75]">
              {mode === "in" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "in" ? "up" : "in");
                  setError(null);
                }}
                className="a-caption a-hit-44 text-[#B8392E] transition-colors hover:text-[#8B2A22]"
              >
                {mode === "in" ? "Criar conta" : "Entrar"}
              </button>
            </p>
          </>
        )}

        <p className="text-center mt-8">
          <Link
            href="/"
            className="a-caption a-hit-44 text-[#8A7F75] transition-colors hover:text-[#B8392E]"
          >
            ← Voltar
          </Link>
        </p>
      </div>
    </main>
  );
}

function translate(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered") || m.includes("already been"))
    return "Este e-mail já tem conta. Faça login.";
  if (m.includes("password")) return "Senha inválida (mín. 6 caracteres).";
  return msg;
}
