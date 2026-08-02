"use client";

import { usePlanner } from "@/lib/planner-store";
import { InboxCapture } from "@/components/planner/InboxCapture";
import { PageTitle } from "@/components/apple/ui";

export default function InboxPage() {
  const { hydrated } = usePlanner();

  if (!hydrated) return <main aria-busy="true" />;

  return (
    <main className="page-shell page-with-dock mx-auto w-full max-w-xl px-5">
      <PageTitle
        eyebrow="Inbox"
        title="Caixa de captura"
        subtitle="Tudo que não coube nos 9 slots do dia, ou que ainda não tem hora de acontecer, mora aqui."
      />
      <InboxCapture />
    </main>
  );
}
