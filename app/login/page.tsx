"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function LoginInner() {
  const { signInWithEmail, configured } = useAuth();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") ? "Falha na autenticação. Tente de novo." : null
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error } = await signInWithEmail(email.trim());
    setLoading(false);
    if (error) setError(error);
    else setSent(true);
  };

  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#1A1715] flex items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <span className="w-12 h-12 rounded-full bg-[#B8392E] flex items-center justify-center text-xl">
            🧭
          </span>
        </Link>

        <h1 className="text-2xl font-bold text-center mb-1">Entrar</h1>
        <p className="text-sm text-[#8A7F75] text-center mb-8 leading-relaxed">
          Sincronize seus valores, metas e plano em todos os dispositivos.
        </p>

        {!configured ? (
          <div className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5 text-sm text-[#4A433D] leading-relaxed">
            Backend não configurado. O app funciona offline neste dispositivo.
            Configure o Supabase (veja o README) para ativar o login.
          </div>
        ) : sent ? (
          <div className="rounded-2xl border border-[#2D7A4E]/30 bg-[#2D7A4E]/5 p-5 text-sm text-[#1A1715] leading-relaxed">
            ✓ Link mágico enviado para <strong>{email}</strong>. Abra seu e-mail
            e clique para entrar.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              aria-label="E-mail"
              className="w-full rounded-xl bg-white/60 border border-[#D4C9B5] px-4 py-3 text-sm text-[#1A1715] placeholder:text-[#8A7F75]/60 focus:border-[#B8392E] focus:ring-2 focus:ring-[#B8392E]/10 focus:outline-none transition-all"
            />
            {error && (
              <p className="text-xs text-[#B8392E]" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-full bg-[#B8392E] text-[#F5F0E6] font-semibold tracking-wide hover:bg-[#8B2A22] disabled:opacity-50 transition-all"
            >
              {loading ? "Enviando…" : "Enviar link mágico"}
            </button>
          </form>
        )}

        <p className="text-center mt-8">
          <Link
            href="/"
            className="text-xs text-[#8A7F75] hover:text-[#B8392E] transition-colors"
          >
            ← Voltar
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
