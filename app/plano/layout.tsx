"use client";

import { TwelveWeekProvider, use12WY } from "@/lib/12wy-store";
import { QuizProvider } from "@/lib/store";
import { DailyProvider } from "@/lib/daily-store";
import PlanSetup from "@/components/12wy/PlanSetup";
import PlanDashboard from "@/components/12wy/PlanDashboard";

function PlanContent() {
  const { state: wyState } = use12WY();

  // If plan already started, show dashboard. Otherwise show setup.
  if (wyState.startDate) {
    return <PlanDashboard />;
  }
  return <PlanSetup />;
}

export default function PlanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QuizProvider>
      <TwelveWeekProvider>
        <DailyProvider>
          <div className="min-h-screen bg-[#F5F0E6] text-[#1A1715]">
            <div className="max-w-2xl mx-auto px-5 py-8 sm:py-12">
              <PlanContent />
              {children}
            </div>
          </div>
        </DailyProvider>
      </TwelveWeekProvider>
    </QuizProvider>
  );
}
