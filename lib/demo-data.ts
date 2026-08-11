import type {
  DayMode,
  FocusSession,
  Habit,
  HabitLog,
  LifeArea,
  PlannerState,
  Task,
  TaskCategory,
  TimeBlock,
} from "./planner-types";

const DAY_MS = 86_400_000;

const INTENTIONS = [
  "Proteger energia antes de assumir novas demandas.",
  "Terminar o essencial sem transformar o dia em maratona.",
  "Fazer progresso visível no projeto principal.",
  "Limpar pendências pequenas antes que virem ruído.",
  "Criar com profundidade e fechar o dia com margem.",
  "Manter consistência mesmo com agenda quebrada.",
  "Resolver o que está travando a semana.",
];

const BIG_TASKS = [
  "Escrever proposta do produto",
  "Revisar arquitetura do app",
  "Preparar apresentação estratégica",
  "Desenhar fluxo de onboarding",
  "Fechar planejamento financeiro",
  "Gravar aula principal",
  "Mapear decisões do trimestre",
];

const MEDIUM_TASKS = [
  "Responder mensagens importantes",
  "Revisar agenda da semana",
  "Organizar notas de reunião",
  "Refinar backlog do app",
  "Preparar briefing para designer",
  "Conferir métricas do projeto",
  "Atualizar documentação",
  "Revisar materiais de estudo",
];

const SMALL_TASKS = [
  "Pagar boleto",
  "Separar recibos",
  "Enviar follow-up",
  "Limpar inbox",
  "Marcar consulta",
  "Organizar mesa",
  "Revisar lista rápida",
  "Planejar compras",
  "Responder áudio pendente",
];

const INBOX_TASKS = [
  "Pesquisar integração com calendário",
  "Testar widget de foco no celular",
  "Ideia: resumo semanal com voz",
  "Comprar suporte para notebook",
  "Rever objetivos de Q4",
  "Perguntar sobre mentoria",
  "Separar referências de UI",
  "Criar checklist de deploy",
];

const HABITS: Habit[] = [
  { id: "demo_habit_sleep", title: "Dormir antes de meia-noite", isActive: true, lifeArea: "body", createdAt: 1 },
  { id: "demo_habit_water", title: "Beber água", isActive: true, lifeArea: "body", createdAt: 2 },
  { id: "demo_habit_walk", title: "Caminhar 20 min", isActive: true, lifeArea: "body", createdAt: 3 },
  { id: "demo_habit_read", title: "Ler 10 páginas", isActive: true, lifeArea: "mind", createdAt: 4 },
  { id: "demo_habit_journal", title: "Journaling", isActive: true, lifeArea: "spiritual", createdAt: 5 },
  { id: "demo_habit_meditate", title: "Meditar", isActive: true, lifeArea: "spiritual", createdAt: 6 },
  { id: "demo_habit_budget", title: "Revisar gastos", isActive: false, lifeArea: "financial", createdAt: 7 },
];

export function buildDemoPlannerState(referenceDate = new Date()): PlannerState {
  const today = startOfDay(referenceDate);
  const currentYear = today.getFullYear();
  const tasks: Task[] = [];
  const timeBlocks: TimeBlock[] = [];
  const habitLogs: HabitLog[] = [];
  const focusSessions: FocusSession[] = [];
  const dayLogs: PlannerState["dayLogs"] = [];

  for (let offset = -29; offset <= 0; offset += 1) {
    const day = addDays(today, offset);
    const date = toISODate(day);
    const dayIndex = offset + 29;
    const mode = getModeForDay(dayIndex);
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const taskPlan = getTaskPlan(dayIndex, isWeekend);

    dayLogs.push({
      date,
      intention: INTENTIONS[dayIndex % INTENTIONS.length],
      mode,
      energy: mode,
      modeSource: "chosen",
      overrideCount: dayIndex % 6 === 0 ? 1 : 0,
      shutdownFit: dayIndex % 9 === 0 ? "tooHeavy" : dayIndex % 7 === 0 ? "tooLight" : "matched",
      plannedStart: isWeekend ? "09:30" : "08:30",
      plannedShutdown: isWeekend ? "17:00" : "18:30",
      plannedAt: day.getTime() + 7 * 60 * 60 * 1000,
      shutdownAt: offset < 0 && dayIndex % 5 !== 1 ? day.getTime() + 20 * 60 * 60 * 1000 : undefined,
      reflection:
        offset < 0
          ? ([undefined, "yes", "yes", "partial", "yes", "no", "partial"] as const)[
              dayIndex % 7
            ]
          : undefined,
      obstacle:
        offset < 0 && dayIndex % 5 === 3
          ? (["interrupted", "misestimated", "notImportant"] as const)[dayIndex % 3]
          : null,
    });

    const dayTasks = createDayTasks({ date, dayIndex, taskPlan, dayTime: day.getTime() });
    tasks.push(...dayTasks);

    dayTasks
      .filter((task) => task.category !== "small" || dayIndex % 3 !== 0)
      .slice(0, mode === "focus" ? 4 : 3)
      .forEach((task, blockIndex) => {
        const startHour = 9 + blockIndex * 2;
        const duration = getDuration(task.category, mode);
        const block: TimeBlock = {
          id: `demo_block_${task.id}`,
          taskId: task.id,
          date,
          startTime: `${String(startHour).padStart(2, "0")}:00`,
          endTime: addMinutes(`${String(startHour).padStart(2, "0")}:00`, duration),
          protected: task.category === "big" && mode === "focus",
        };
        timeBlocks.push(block);

        if (task.status === "done" && dayIndex % 4 !== 2) {
          const elapsedMinutes = Math.max(15, duration - (dayIndex % 3) * 10);
          focusSessions.push({
            id: `demo_focus_${task.id}`,
            taskId: task.id,
            date,
            startedAt: day.getTime() + startHour * 60 * 60 * 1000,
            endedAt: day.getTime() + startHour * 60 * 60 * 1000 + elapsedMinutes * 60_000,
            elapsedMs: elapsedMinutes * 60_000,
            completed: elapsedMinutes >= duration * 0.75,
          });
        }
      });

    HABITS.filter((habit) => habit.isActive).forEach((habit, habitIndex) => {
      if (isHabitDoneForDemo(dayIndex, habitIndex, isWeekend)) {
        habitLogs.push({
          id: `demo_log_${date}_${habit.id}`,
          habitId: habit.id,
          date,
          done: true,
        });
      }
    });
  }

  INBOX_TASKS.forEach((title, index) => {
    tasks.push({
      id: `demo_inbox_${index}`,
      title,
      category: "inbox",
      status: "pending",
      date: null,
      estimatedMinutes: [15, 25, 45, 60, 90][index % 5],
      lifeArea: getInboxArea(index),
      createdAt: today.getTime() - (index + 1) * DAY_MS,
    });
  });

  return {
    tasks,
    timeBlocks,
    habits: HABITS,
    habitLogs,
    dayLogs,
    focusSessions,
    goals: [
      {
        id: "demo_goal_0",
        title: "Publicar a versão 1.0 do meu produto",
        quarter: `${currentYear}-Q${Math.floor(today.getMonth() / 3) + 1}`,
        why: "Sair do loop de projeto eterno e colocar algo no mundo.",
        outcome: "100 usuários cadastrados na v1.0",
        status: "active",
        createdAt: today.getTime() - 40 * DAY_MS,
      },
      {
        id: "demo_goal_1",
        title: "Consistência no corpo",
        quarter: `${currentYear}-Q${Math.floor(today.getMonth() / 3) + 1}`,
        why: "Energia física sustenta o resto.",
        outcome: "3 treinos por semana durante 4 semanas seguidas.",
        status: "active",
        createdAt: today.getTime() - 35 * DAY_MS,
      },
    ],
    weekRocks: [],
    weekLogs: [],
    lastRolloverDate: toISODate(today),
  };
}

function createDayTasks({
  date,
  dayIndex,
  taskPlan,
  dayTime,
}: {
  date: string;
  dayIndex: number;
  taskPlan: { big: number; medium: number; small: number };
  dayTime: number;
}): Task[] {
  const tasks: Task[] = [];
  const addTask = (category: Exclude<TaskCategory, "inbox">, title: string, index: number) => {
    const sequence = tasks.length;
    tasks.push({
      id: `demo_task_${date}_${category}_${index}`,
      title,
      category,
      status: shouldComplete(dayIndex, category, index) ? "done" : "pending",
      date,
      estimatedMinutes:
        category === "big" ? 90 : category === "medium" ? 45 + (index % 2) * 15 : 15 + (index % 2) * 10,
      lifeArea: getTaskArea(category, dayIndex, index),
      goalId: category === "big" ? "demo_goal_0" : undefined,
      createdAt: dayTime + sequence * 60_000,
    });
  };

  for (let index = 0; index < taskPlan.big; index += 1) {
    addTask("big", BIG_TASKS[(dayIndex + index) % BIG_TASKS.length], index);
  }
  for (let index = 0; index < taskPlan.medium; index += 1) {
    addTask("medium", MEDIUM_TASKS[(dayIndex + index) % MEDIUM_TASKS.length], index);
  }
  for (let index = 0; index < taskPlan.small; index += 1) {
    addTask("small", SMALL_TASKS[(dayIndex + index) % SMALL_TASKS.length], index);
  }

  return tasks;
}

function getTaskPlan(dayIndex: number, isWeekend: boolean) {
  if (isWeekend) return { big: dayIndex % 2, medium: 1, small: 2 + (dayIndex % 2) };
  return {
    big: dayIndex % 5 === 2 ? 0 : 1,
    medium: 1 + (dayIndex % 3),
    small: 2 + (dayIndex % 4),
  };
}

function shouldComplete(
  dayIndex: number,
  category: Exclude<TaskCategory, "inbox">,
  index: number
): boolean {
  if (category === "big") return dayIndex % 4 !== 1;
  if (category === "medium") return (dayIndex + index) % 5 !== 0;
  return (dayIndex + index) % 4 !== 2;
}

function isHabitDoneForDemo(dayIndex: number, habitIndex: number, isWeekend: boolean): boolean {
  if (habitIndex === 0) return dayIndex % 7 !== 2;
  if (habitIndex === 1) return dayIndex % 5 !== 1;
  if (habitIndex === 2) return !isWeekend && dayIndex % 6 !== 0;
  if (habitIndex === 3) return dayIndex % 4 !== 3;
  if (habitIndex === 4) return dayIndex % 3 !== 1;
  return dayIndex % 6 === 0 || dayIndex % 6 === 3;
}

function getModeForDay(dayIndex: number): DayMode {
  const modes: DayMode[] = ["focus", "maintenance", "focus", "focus", "maintenance", "focus", "maintenance"];
  return modes[dayIndex % modes.length];
}

function getDuration(category: TaskCategory, mode: DayMode): number {
  if (category === "big") return mode === "focus" ? 90 : 45;
  if (category === "medium") return mode === "maintenance" ? 25 : 60;
  return 15;
}

function getTaskArea(
  category: Exclude<TaskCategory, "inbox">,
  dayIndex: number,
  index: number
): LifeArea {
  if (category === "big") {
    return (["professional", "financial", "mind"] as const)[(dayIndex + index) % 3];
  }
  if (category === "medium") {
    return (["professional", "social", "mind", "financial"] as const)[(dayIndex + index) % 4];
  }
  return (["body", "social", "financial", "spiritual", "mind"] as const)[(dayIndex + index) % 5];
}

function getInboxArea(index: number): LifeArea | null {
  return ([null, "professional", "mind", "body", "financial", "social"] as const)[index % 6];
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addMinutes(time: string, minutes: number): string {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
