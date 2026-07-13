"use client";

import { use12WY } from "@/lib/12wy-store";
import PlanSetup from "@/components/12wy/PlanSetup";
import PlanDashboard from "@/components/12wy/PlanDashboard";

export default function PlanPage() {
  const { state: wyState } = use12WY();

  return (
    <div className="bg-[#F5F0E6] text-[#1A1715]">
      <div className="max-w-2xl mx-auto px-5 py-8 sm:py-12">
        {wyState.startDate ? <PlanDashboard /> : <PlanSetup />}
      </div>
    </div>
  );
}
