import { useMemo, useState } from "react";
import { differenceInWeeks, differenceInDays, addWeeks } from "date-fns";

const STORAGE_DUE_KEY = "bump_due_date";
const STORAGE_NAME_KEY = "bump_baby_name";
const STORAGE_SEX_KEY = "bump_baby_sex";
const TOTAL_PREGNANCY_WEEKS = 40;

export type BabySex = "boy" | "girl" | "unknown";

export interface PregnancyState {
  dueDate: Date | undefined;
  setDueDate: (date: Date | undefined) => void;
  currentWeek: number;
  daysRemaining: number;
  today: Date;
  trimester: 1 | 2 | 3;
  progress: number; // 0–100

  babyName: string | null;
  setBabyName: (name: string | null) => void;
  babySex: BabySex;
  setBabySex: (sex: BabySex) => void;
}

export function usePregnancyState(): PregnancyState {
  // Due date
  const [dueDate, setDueDateState] = useState<Date | undefined>(() => {
    if (typeof window === "undefined") return undefined;

    const saved = localStorage.getItem(STORAGE_DUE_KEY);
    if (saved) {
      const parsed = new Date(saved);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Fallback: 20 weeks from now so the UI doesn’t look empty if nothing is set yet
    return addWeeks(new Date(), 20);
  });

  // Baby name
  const [babyNameState, setBabyNameState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(STORAGE_NAME_KEY);
    return stored ? stored : null;
  });

  // Baby sex
  const [babySexState, setBabySexState] = useState<BabySex>(() => {
    if (typeof window === "undefined") return "unknown";
    const stored = localStorage.getItem(STORAGE_SEX_KEY) as BabySex | null;
    return stored === "boy" || stored === "girl" || stored === "unknown"
      ? stored
      : "unknown";
  });

  const today = useMemo(() => new Date(), []);

  // Persist due date
  const setDueDate = (date: Date | undefined) => {
    setDueDateState(date);
    if (typeof window === "undefined") return;

    if (date) {
      localStorage.setItem(STORAGE_DUE_KEY, date.toISOString());
    } else {
      localStorage.removeItem(STORAGE_DUE_KEY);
    }
  };

  // Persist baby name
  const setBabyName = (name: string | null) => {
    setBabyNameState(name);
    if (typeof window === "undefined") return;

    if (name && name.trim().length > 0) {
      localStorage.setItem(STORAGE_NAME_KEY, name.trim());
    } else {
      localStorage.removeItem(STORAGE_NAME_KEY);
    }
  };

  // Persist baby sex
  const setBabySex = (sex: BabySex) => {
    setBabySexState(sex);
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_SEX_KEY, sex);
  };

  // Pregnancy metrics
  const pregnancyMetrics = useMemo(() => {
    if (!dueDate) {
      return {
        currentWeek: 0,
        daysRemaining: 280,
        trimester: 1 as const,
        progress: 0,
      };
    }

    const weeksUntilDue = differenceInWeeks(dueDate, today);
    const rawWeek = TOTAL_PREGNANCY_WEEKS - weeksUntilDue;

    const currentWeek = Math.max(0, Math.min(42, rawWeek));
    const daysRemaining = Math.max(0, differenceInDays(dueDate, today));

    let trimester: 1 | 2 | 3 = 1;
    if (currentWeek > 27) {
      trimester = 3;
    } else if (currentWeek > 13) {
      trimester = 2;
    }

    const progress = Math.min(
      100,
      Math.max(0, (currentWeek / TOTAL_PREGNANCY_WEEKS) * 100)
    );

    return {
      currentWeek,
      daysRemaining,
      trimester,
      progress,
    };
  }, [dueDate, today]);

  return {
    dueDate,
    setDueDate,
    today,
    ...pregnancyMetrics,
    babyName: babyNameState,
    setBabyName,
    babySex: babySexState,
    setBabySex,
  };
}
