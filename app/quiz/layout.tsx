"use client";

import { QuizProvider, useQuiz } from "@/lib/store";
import ProgressBar from "@/components/ProgressBar";
import WelcomeStep from "@/components/steps/WelcomeStep";
import QuantitativeStep from "@/components/steps/QuantitativeStep";
import QualitativeStep from "@/components/steps/QualitativeStep";
import NarrativeStep from "@/components/steps/NarrativeStep";
import EnvironmentStep from "@/components/steps/EnvironmentStep";
import SmartStep from "@/components/steps/SmartStep";
import ResultStep from "@/components/steps/ResultStep";

function QuizContent() {
  const { state } = useQuiz();

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#1A1715]">
      <div className="max-w-2xl mx-auto px-5 py-8 sm:py-12">
        {state.step !== "welcome" && state.step !== "result" && (
          <div className="mb-10">
            <ProgressBar />
          </div>
        )}

        {state.step === "welcome" && <WelcomeStep />}
        {state.step === "quantitative" && <QuantitativeStep />}
        {state.step === "qualitative" && <QualitativeStep />}
        {state.step === "narrative" && <NarrativeStep />}
        {state.step === "environment" && <EnvironmentStep />}
        {state.step === "smart" && <SmartStep />}
        {state.step === "result" && <ResultStep />}
      </div>
    </div>
  );
}

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QuizProvider>
      <QuizContent />
      {children}
    </QuizProvider>
  );
}
