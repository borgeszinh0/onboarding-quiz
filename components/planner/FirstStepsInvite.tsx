"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button } from "@/components/apple/ui";
import { FIRST_STEPS_SEEN_KEY, shouldShowFirstStepsInvite } from "@/lib/first-steps";
import type { PlannerState } from "@/lib/planner-types";

export function FirstStepsInvite({
  state,
  hydrated,
}: {
  state: PlannerState;
  hydrated: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    void Promise.resolve().then(() => {
      setVisible(shouldShowFirstStepsInvite(state));
    });
  }, [hydrated, state]);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(FIRST_STEPS_SEEN_KEY, "true");
    setVisible(false);
  };

  return (
    <Card className="mb-6 p-5">
      <div className="space-y-3">
        <div>
          <p className="a-headline text-label">Comece pelos Primeiros passos</p>
          <p className="a-subheadline mt-2 text-label-secondary">
            Em poucos minutos você entende como usar Inbox, modo do dia, 1-3-5,
            foco, hábitos e áreas da vida.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link href="/primeiros-passos" className="a-btn a-btn-primary">
            Ver Primeiros passos
          </Link>
          <Button type="button" variant="secondary" onClick={dismiss}>
            Agora não
          </Button>
        </div>
      </div>
    </Card>
  );
}
