"use client";

import { usePlanner } from "@/lib/planner-store";
import { HabitTracker } from "@/components/planner/HabitTracker";
import { PageTitle } from "@/components/apple/ui";

export default function HabitosPage() {
  const { state } = usePlanner();

  const activeCount = state.habits.filter((h) => h.isActive).length;

  return (
    <main className="page-with-bottom-dock mx-auto w-full max-w-xl px-5 pt-8">
      <PageTitle
        eyebrow="Hábitos"
        title="Consistência"
        subtitle={
          activeCount > 0
            ? "Acompanhe seus hábitos diários e construa sua sequência."
            : "Você ainda não tem hábitos ativos."
        }
      />
      <HabitTracker />
    </main>
  );
}
