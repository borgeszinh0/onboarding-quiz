export interface ParsedTask {
  title: string;
  date?: string;
  startTime?: string;
  durationMinutes?: number;
}

function getTodayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getTomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseNaturalInput(input: string): ParsedTask {
  let text = " " + input + " ";
  let date: string | undefined;
  let startTime: string | undefined;
  let durationMinutes: number | undefined;

  // Parse Duração: "45m", "45min", "45 minutos"
  const durMinMatch = text.match(/\b(\d+)\s*(m|min|minutos)\b/i);
  if (durMinMatch) {
    durationMinutes = parseInt(durMinMatch[1], 10);
    text = text.replace(durMinMatch[0], " ");
  } else {
    // Se não achou minutos, tenta horas como duração "2h", "2 horas"
    // (Mas cuidado para não pegar a hora do dia se estiver sem "h")
    const durHourMatch = text.match(/\b(\d+)\s*(horas?)\b/i);
    if (durHourMatch) {
      durationMinutes = parseInt(durHourMatch[1], 10) * 60;
      text = text.replace(durHourMatch[0], " ");
    }
  }

  // Parse Hora exata: "15:00"
  const timeMatch = text.match(/\b(\d{1,2}):(\d{2})\b/);
  if (timeMatch) {
    const h = String(timeMatch[1]).padStart(2, "0");
    const m = timeMatch[2];
    startTime = `${h}:${m}`;
    text = text.replace(timeMatch[0], " ");
  } else {
    // Tenta formato "15h" ou "15h30" para o horário de início
    // Como pegamos horas de duração (durHourMatch) com a palavra "hora(s)",
    // "15h" sobra para cá se a pessoa usar só o "h".
    const timeHMatch = text.match(/\b(\d{1,2})h(?:(\d{2}))?\b/i);
    if (timeHMatch) {
      const h = String(timeHMatch[1]).padStart(2, "0");
      const m = timeHMatch[2] || "00";
      startTime = `${h}:${m}`;
      text = text.replace(timeHMatch[0], " ");
    }
  }

  // Parse Datas Simples (Hoje / Amanhã)
  if (/\bhoje\b/i.test(text) || /\bhj\b/i.test(text)) {
    date = getTodayISO();
    text = text.replace(/\b(?:hoje|hj)\b/i, " ");
  } else if (/\bamanh[aã]\b/i.test(text)) {
    date = getTomorrowISO();
    text = text.replace(/\bamanh[aã]\b/i, " ");
  }

  return {
    title: text.replace(/\s+/g, " ").trim(),
    date,
    startTime,
    durationMinutes,
  };
}
