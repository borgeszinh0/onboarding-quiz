import type { PlannerState } from "./planner-types";
import { todayISO } from "./planner-store";

export const FIRST_STEPS_SEEN_KEY = "planner-first-steps-seen";

export type FirstStepId =
  | "day-mode"
  | "inbox"
  | "funnel"
  | "timeblocks"
  | "habits"
  | "life-areas"
  | "shutdown";

export type FirstStep = {
  id: FirstStepId;
  title: string;
  actionLabel: string;
  href: string;
  what: string;
  why: string;
  how: string;
  example?: string;
  done: boolean;
};

export function getFirstSteps(state: PlannerState, date = todayISO()): FirstStep[] {
  const todayLog = state.dayLogs.find((dayLog) => dayLog.date === date);
  const hasPlannedTask = state.tasks.some(
    (task) => task.category !== "inbox" && !!task.date
  );
  const hasLifeArea = state.tasks.some((task) => !!task.lifeArea) ||
    state.habits.some((habit) => !!habit.lifeArea);

  return [
    {
      id: "day-mode",
      title: "Escolha seu modo do dia",
      actionLabel: "Ir para Hoje",
      href: "/",
      what: "O modo do dia define como o app recomenda tarefas.",
      why: "Manutenção favorece pendências leves e blocos curtos. Execução favorece tarefas médias e uma rotina protegida. Criação favorece uma tarefa grande e foco profundo.",
      how: "Na tela Hoje, escolha o modo que combina com a sua energia real antes de planejar.",
      done: !!todayLog?.mode,
    },
    {
      id: "inbox",
      title: "Capture uma tarefa no Inbox",
      actionLabel: "Ir para Inbox",
      href: "/inbox",
      what: "O Inbox é o lugar de despejo. Capture primeiro, organize depois.",
      why: "Nem toda ideia precisa virar plano agora. O app recomenda, você decide.",
      how: "Abra o Inbox e escreva a tarefa como ela vier à cabeça.",
      example: "revisar proposta amanhã 10:00 45m",
      done: state.tasks.length > 0,
    },
    {
      id: "funnel",
      title: "Planeje com 1-3-5",
      actionLabel: "Planejar hoje",
      href: "/",
      what: "Seu dia tem espaço para 1 tarefa grande, 3 médias e 5 pequenas.",
      why: "O limite é fixo. O modo do dia apenas recomenda o que priorizar dentro desse espaço.",
      how: "Mova tarefas do Inbox ou crie tarefas diretamente nos slots de Hoje.",
      done: hasPlannedTask,
    },
    {
      id: "timeblocks",
      title: "Proteja um bloco de foco",
      actionLabel: "Ver agenda",
      href: "/",
      what: "Agendar uma tarefa é reservar atenção.",
      why: "Blocos de foco ajudam você a transformar uma tarefa em tempo protegido.",
      how: "Use o relógio de uma tarefa planejada para definir horário e duração.",
      done: state.timeBlocks.length > 0,
    },
    {
      id: "habits",
      title: "Marque um hábito",
      actionLabel: "Ir para Hábitos",
      href: "/habitos",
      what: "Hábitos sustentam o ritmo do dia.",
      why: "Comece pequeno: beber água, caminhar, meditar 5 minutos ou ler 10 páginas.",
      how: "Crie um hábito e marque quando concluir.",
      done: state.habitLogs.some((habitLog) => habitLog.done),
    },
    {
      id: "life-areas",
      title: "Classifique uma área da vida",
      actionLabel: "Ir para Objetivos",
      href: "/objetivos",
      what: "Áreas da vida mostram para onde suas ações estão indo.",
      why: "Isso alimenta o radar em Objetivos. Não é uma nota da sua vida; é uma bússola.",
      how: "Classifique tarefas e hábitos como Corpo, Mente, Social, Espiritual, Financeiro ou Profissional.",
      done: hasLifeArea,
    },
    {
      id: "shutdown",
      title: "Encerre o dia",
      actionLabel: "Encerrar hoje",
      href: "/",
      what: "No fim do dia, encerre para aprender com sua execução.",
      why: "O fechamento compara o modo escolhido com o que aconteceu e ajuda a decidir o ritmo de amanhã.",
      how: "Volte para Hoje no fim do expediente e use o card Encerrar o dia.",
      done: state.dayLogs.some((dayLog) => !!dayLog.shutdownAt),
    },
  ];
}

export function getFirstStepsProgress(state: PlannerState, date = todayISO()) {
  const steps = getFirstSteps(state, date);
  const done = steps.filter((step) => step.done).length;
  return { steps, done, total: steps.length };
}

export function shouldShowFirstStepsInvite(state: PlannerState) {
  if (typeof window === "undefined") return false;
  return (
    state.tasks.length === 0 &&
    state.dayLogs.length === 0 &&
    localStorage.getItem(FIRST_STEPS_SEEN_KEY) !== "true"
  );
}
