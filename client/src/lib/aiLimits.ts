// client/src/lib/aiLimits.ts

const STORAGE_KEY = "bloom_ai_usage";

interface AiUsageData {
  date: string;
  count: number;
}

function getTodayDateStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getUsageData(): AiUsageData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AiUsageData;
      if (parsed.date === getTodayDateStr()) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to parse AI usage data:", e);
  }
  return { date: getTodayDateStr(), count: 0 };
}

function saveUsageData(data: AiUsageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getTodayAiCount(): number {
  return getUsageData().count;
}

export function incrementAiCount(): number {
  const data = getUsageData();
  data.count += 1;
  data.date = getTodayDateStr();
  saveUsageData(data);
  return data.count;
}

export function canAskAi(isPaid: boolean = false): boolean {
  const limit = isPaid ? 5 : 2;
  return getTodayAiCount() < limit;
}

export function getRemainingAiQuestions(isPaid: boolean = false): number {
  const limit = isPaid ? 5 : 2;
  const used = getTodayAiCount();
  return Math.max(0, limit - used);
}

export function getAiDailyLimit(isPaid: boolean = false): number {
  return isPaid ? 5 : 2;
}