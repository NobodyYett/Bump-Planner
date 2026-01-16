// client/src/hooks/usePregnancyState.ts

import { useMemo, useState, useEffect, useCallback } from "react";
import { differenceInDays, format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerAccess } from "@/contexts/PartnerContext";
import { supabase } from "@/lib/supabase";

const TOTAL_PREGNANCY_WEEKS = 40;
const TOTAL_PREGNANCY_DAYS = 280; // 40 weeks × 7 days

export type BabySex = "boy" | "girl" | "unknown";

export interface PregnancyState {
  dueDate: Date | null;
  setDueDate: (date: Date | null) => void;
  isProfileLoading: boolean;
  isOnboardingComplete: boolean;
  setIsOnboardingComplete: (isComplete: boolean) => void;
  refetch: () => void;

  currentWeek: number;
  currentDay: number; // Day within the current week (0-6)
  daysRemaining: number;
  daysPregnant: number; // Total days pregnant
  today: Date;
  trimester: 1 | 2 | 3;
  progress: number;

  babyName: string | null;
  setBabyName: (name: string | null) => void;
  babySex: BabySex;
  setBabySex: (sex: BabySex) => void;

  // Parent names
  momName: string | null;
  setMomName: (name: string | null) => void;
  partnerName: string | null;
  setPartnerName: (name: string | null) => void;

  // Infancy mode
  appMode: "pregnancy" | "infancy";
  babyBirthDate: Date | null;
  setBabyBirthDate: (date: Date | null) => void;
  infancyOnboardingComplete: boolean;
  setInfancyOnboardingComplete: (complete: boolean) => void;
  babyAgeWeeks: number;
  babyAgeDays: number;
  transitionToInfancy: (birthDate: Date) => Promise<void>;
}

// Helper: parse "yyyy-MM-dd" as LOCAL date (not UTC)
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Helper: get today's date normalized to local midnight
function getTodayAtMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Data fetching function for React Query
const fetchProfileData = async (userId: string | undefined) => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("pregnancy_profiles")
    .select("due_date, baby_name, baby_sex, onboarding_complete, mom_name, partner_name, app_mode, baby_birth_date, infancy_onboarding_complete")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
};

export function usePregnancyState(): PregnancyState {
  const { user, loading: authLoading } = useAuth();
  const { isPartnerView, momUserId, isLoading: partnerLoading } = usePartnerAccess();
  const queryClient = useQueryClient();

  // Key insight: When in partner view, fetch the MOM's profile, not the partner's
  const profileUserId = isPartnerView ? momUserId : user?.id;

  const {
    data: profile,
    isLoading: isProfileFetching,
    refetch,
  } = useQuery({
    queryKey: ["pregnancyProfile", profileUserId],
    queryFn: () => fetchProfileData(profileUserId ?? undefined),
    enabled: !!profileUserId && !partnerLoading,
    staleTime: 1000 * 60,
  });

  const [dueDate, setDueDateState] = useState<Date | null>(null);
  const [babyNameState, setBabyNameState] = useState<string | null>(null);
  const [babySexState, setBabySexState] = useState<BabySex>("unknown");
  const [isOnboardingCompleteState, setIsOnboardingCompleteState] = useState(false);
  const [momNameState, setMomNameState] = useState<string | null>(null);
  const [partnerNameState, setPartnerNameState] = useState<string | null>(null);
  
  // Infancy state
  const [appModeState, setAppModeState] = useState<"pregnancy" | "infancy">("pregnancy");
  const [babyBirthDateState, setBabyBirthDateState] = useState<Date | null>(null);
  const [infancyOnboardingCompleteState, setInfancyOnboardingCompleteState] = useState(false);

  useEffect(() => {
    if (profile) {
      setDueDateState(profile.due_date ? parseLocalDate(profile.due_date) : null);
      setBabyNameState(profile.baby_name ?? null);
      setBabySexState(profile.baby_sex ?? "unknown");
      setIsOnboardingCompleteState(profile.onboarding_complete ?? false);
      setMomNameState(profile.mom_name ?? null);
      setPartnerNameState(profile.partner_name ?? null);
      // Infancy fields
      setAppModeState(profile.app_mode === "infancy" ? "infancy" : "pregnancy");
      setBabyBirthDateState(profile.baby_birth_date ? parseLocalDate(profile.baby_birth_date) : null);
      setInfancyOnboardingCompleteState(profile.infancy_onboarding_complete ?? false);
    } else if (!isProfileFetching && profileUserId && !authLoading && !partnerLoading) {
      setDueDateState(null);
      setBabyNameState(null);
      setBabySexState("unknown");
      setIsOnboardingCompleteState(false);
      setMomNameState(null);
      setPartnerNameState(null);
      // Reset infancy fields
      setAppModeState("pregnancy");
      setBabyBirthDateState(null);
      setInfancyOnboardingCompleteState(false);
    }
  }, [profile, isProfileFetching, profileUserId, authLoading, partnerLoading]);

  // ✅ FIX: Use midnight local time for consistent date comparisons
  // This ensures "today" doesn't change based on what time of day it is
  const today = useMemo(() => getTodayAtMidnight(), []);

  // Partners should not be able to update profile data
  const setDueDate = useCallback(
    async (date: Date | null) => {
      if (isPartnerView) return; // Partners can't edit
      setDueDateState(date);
      if (!user) return;

      try {
        const { error } = await supabase
          .from("pregnancy_profiles")
          .update({ due_date: date ? format(date, "yyyy-MM-dd") : null })
          .eq("user_id", user.id);

        if (error) {
          console.error("Failed to save due date:", error);
          refetch();
        } else {
          queryClient.invalidateQueries({ queryKey: ["pregnancyProfile", user.id] });
        }
      } catch (err) {
        console.error("Failed to save due date:", err);
        refetch();
      }
    },
    [user, isPartnerView, refetch, queryClient]
  );

  const setBabyName = useCallback(
    async (name: string | null) => {
      if (isPartnerView) return; // Partners can't edit
      setBabyNameState(name);
      if (!user) return;

      try {
        const { error } = await supabase
          .from("pregnancy_profiles")
          .update({ baby_name: name })
          .eq("user_id", user.id);

        if (error) {
          console.error("Failed to save baby name:", error);
          refetch();
        } else {
          queryClient.invalidateQueries({ queryKey: ["pregnancyProfile", user.id] });
        }
      } catch (err) {
        console.error("Failed to save baby name:", err);
        refetch();
      }
    },
    [user, isPartnerView, refetch, queryClient]
  );

  const setBabySex = useCallback(
    async (sex: BabySex) => {
      if (isPartnerView) return; // Partners can't edit
      setBabySexState(sex);
      if (!user) return;

      try {
        const { error } = await supabase
          .from("pregnancy_profiles")
          .update({ baby_sex: sex })
          .eq("user_id", user.id);

        if (error) {
          console.error("Failed to save baby sex:", error);
          refetch();
        } else {
          queryClient.invalidateQueries({ queryKey: ["pregnancyProfile", user.id] });
        }
      } catch (err) {
        console.error("Failed to save baby sex:", err);
        refetch();
      }
    },
    [user, isPartnerView, refetch, queryClient]
  );

  const setMomName = useCallback(
    async (name: string | null) => {
      if (isPartnerView) return; // Partners can't edit
      setMomNameState(name);
      if (!user) return;

      try {
        const { error } = await supabase
          .from("pregnancy_profiles")
          .update({ mom_name: name })
          .eq("user_id", user.id);

        if (error) {
          console.error("Failed to save mom name:", error);
          refetch();
        } else {
          queryClient.invalidateQueries({ queryKey: ["pregnancyProfile", user.id] });
        }
      } catch (err) {
        console.error("Failed to save mom name:", err);
        refetch();
      }
    },
    [user, isPartnerView, refetch, queryClient]
  );

  const setPartnerName = useCallback(
    async (name: string | null) => {
      if (isPartnerView) return; // Partners can't edit
      setPartnerNameState(name);
      if (!user) return;

      try {
        const { error } = await supabase
          .from("pregnancy_profiles")
          .update({ partner_name: name })
          .eq("user_id", user.id);

        if (error) {
          console.error("Failed to save partner name:", error);
          refetch();
        } else {
          queryClient.invalidateQueries({ queryKey: ["pregnancyProfile", user.id] });
        }
      } catch (err) {
        console.error("Failed to save partner name:", err);
        refetch();
      }
    },
    [user, isPartnerView, refetch, queryClient]
  );

  // Infancy setters
  const setBabyBirthDate = useCallback(
    async (date: Date | null) => {
      if (isPartnerView) return;
      setBabyBirthDateState(date);
      if (!user) return;

      try {
        const { error } = await supabase
          .from("pregnancy_profiles")
          .update({ baby_birth_date: date ? format(date, "yyyy-MM-dd") : null })
          .eq("user_id", user.id);

        if (error) {
          console.error("Failed to save baby birth date:", error);
          refetch();
        } else {
          queryClient.invalidateQueries({ queryKey: ["pregnancyProfile", user.id] });
        }
      } catch (err) {
        console.error("Failed to save baby birth date:", err);
        refetch();
      }
    },
    [user, isPartnerView, refetch, queryClient]
  );

  const setInfancyOnboardingComplete = useCallback(
    async (complete: boolean) => {
      if (isPartnerView) return;
      setInfancyOnboardingCompleteState(complete);
      if (!user) return;

      try {
        const { error } = await supabase
          .from("pregnancy_profiles")
          .update({ infancy_onboarding_complete: complete })
          .eq("user_id", user.id);

        if (error) {
          console.error("Failed to save infancy onboarding:", error);
          refetch();
        } else {
          queryClient.invalidateQueries({ queryKey: ["pregnancyProfile", user.id] });
        }
      } catch (err) {
        console.error("Failed to save infancy onboarding:", err);
        refetch();
      }
    },
    [user, isPartnerView, refetch, queryClient]
  );

  // Transition to infancy mode (sets birth date and switches app mode)
  const transitionToInfancy = useCallback(
    async (birthDate: Date) => {
      if (isPartnerView || !user) return;

      setBabyBirthDateState(birthDate);
      setAppModeState("infancy");

      try {
        const { error } = await supabase
          .from("pregnancy_profiles")
          .update({
            baby_birth_date: format(birthDate, "yyyy-MM-dd"),
            app_mode: "infancy",
          })
          .eq("user_id", user.id);

        if (error) {
          console.error("Failed to transition to infancy:", error);
          refetch();
        } else {
          queryClient.invalidateQueries({ queryKey: ["pregnancyProfile", user.id] });
        }
      } catch (err) {
        console.error("Failed to transition to infancy:", err);
        refetch();
      }
    },
    [user, isPartnerView, refetch, queryClient]
  );

  // Calculate baby's age in weeks/days (for infancy mode)
  const infancyMetrics = useMemo(() => {
    if (!babyBirthDateState) {
      return { babyAgeWeeks: 0, babyAgeDays: 0 };
    }

    const totalDays = differenceInDays(today, babyBirthDateState);
    if (totalDays < 0) {
      return { babyAgeWeeks: 0, babyAgeDays: 0 };
    }

    const babyAgeWeeks = Math.floor(totalDays / 7);
    const babyAgeDays = totalDays % 7;

    return { babyAgeWeeks, babyAgeDays };
  }, [babyBirthDateState, today]);

  const pregnancyMetrics = useMemo(() => {
    if (!dueDate) {
      return {
        currentWeek: 0,
        currentDay: 0,
        daysRemaining: TOTAL_PREGNANCY_DAYS,
        daysPregnant: 0,
        trimester: 1 as const,
        progress: 0,
      };
    }

    // ✅ FIX: Use days-based calculation for accuracy
    // differenceInWeeks truncates, which can cause week to be off by 1
    const daysUntilDue = differenceInDays(dueDate, today);
    const daysRemaining = Math.max(0, daysUntilDue);
    
    // Calculate gestational age in days
    // If due date is 280 days from conception, then:
    // daysPregnant = 280 - daysUntilDue
    const daysPregnant = TOTAL_PREGNANCY_DAYS - daysUntilDue;
    
    // ✅ FIX: Correct week calculation
    // Medical convention: Week 1 = days 0-6, Week 2 = days 7-13, etc.
    // So week number = floor(daysPregnant / 7) + 1
    // But we also need to handle edge cases (before conception, past due)
    let currentWeek: number;
    let currentDay: number;
    
    if (daysPregnant < 0) {
      // Before conception (due date is more than 280 days away)
      currentWeek = 0;
      currentDay = 0;
    } else {
      // Normal case: calculate week and day
      // Week 1 starts at day 0, Week 2 at day 7, etc.
      currentWeek = Math.floor(daysPregnant / 7) + 1;
      currentDay = daysPregnant % 7; // Day within the week (0-6)
      
      // Cap at week 42 (2 weeks past due date)
      currentWeek = Math.min(42, currentWeek);
    }

    // Determine trimester
    // Trimester 1: Weeks 1-13
    // Trimester 2: Weeks 14-27
    // Trimester 3: Weeks 28-40+
    let trimester: 1 | 2 | 3 = 1;
    if (currentWeek >= 28) {
      trimester = 3;
    } else if (currentWeek >= 14) {
      trimester = 2;
    }

    // Progress percentage (0-100)
    const progress = Math.min(100, Math.max(0, (currentWeek / TOTAL_PREGNANCY_WEEKS) * 100));

    return { 
      currentWeek, 
      currentDay, 
      daysRemaining, 
      daysPregnant: Math.max(0, daysPregnant),
      trimester, 
      progress 
    };
  }, [dueDate, today]);

  const isProfileLoading = authLoading || partnerLoading || isProfileFetching;

  return {
    dueDate,
    setDueDate,
    today,
    ...pregnancyMetrics,
    babyName: babyNameState,
    setBabyName,
    babySex: babySexState,
    setBabySex,
    momName: momNameState,
    setMomName,
    partnerName: partnerNameState,
    setPartnerName,
    isProfileLoading,
    isOnboardingComplete: isOnboardingCompleteState,
    setIsOnboardingComplete: setIsOnboardingCompleteState,
    refetch,
    // Infancy fields
    appMode: appModeState,
    babyBirthDate: babyBirthDateState,
    setBabyBirthDate,
    infancyOnboardingComplete: infancyOnboardingCompleteState,
    setInfancyOnboardingComplete,
    ...infancyMetrics,
    transitionToInfancy,
  };
}