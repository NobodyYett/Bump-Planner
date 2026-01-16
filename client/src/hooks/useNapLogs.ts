// client/src/hooks/useNapLogs.ts
// CRUD operations for nap/sleep logs

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerAccess } from "@/contexts/PartnerContext";

export interface NapLog {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
}

export interface CreateNapInput {
  started_at?: Date;
  ended_at?: Date;
  duration_minutes?: number;
  notes?: string;
}

// Fetch today's nap logs
async function fetchTodayNaps(userId: string): Promise<NapLog[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from("nap_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("started_at", today.toISOString())
    .lt("started_at", tomorrow.toISOString())
    .order("started_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get the most recent nap
async function fetchLastNap(userId: string): Promise<NapLog | null> {
  const { data, error } = await supabase
    .from("nap_logs")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

// Hook: Get today's naps
export function useTodayNaps() {
  const { user } = useAuth();
  const { isPartnerView, momUserId } = usePartnerAccess();
  
  const userId = isPartnerView ? momUserId : user?.id;

  return useQuery({
    queryKey: ["naps", "today", userId],
    queryFn: () => fetchTodayNaps(userId!),
    enabled: !!userId,
    refetchInterval: 60000,
  });
}

// Hook: Get last nap
export function useLastNap() {
  const { user } = useAuth();
  const { isPartnerView, momUserId } = usePartnerAccess();
  
  const userId = isPartnerView ? momUserId : user?.id;

  return useQuery({
    queryKey: ["naps", "last", userId],
    queryFn: () => fetchLastNap(userId!),
    enabled: !!userId,
    refetchInterval: 60000,
  });
}

// Hook: Create nap log (quick log - just start time, default 30 min)
// Logs under mom's user_id so both parents see the same logs
export function useCreateNap() {
  const { user } = useAuth();
  const { isPartnerView, momUserId } = usePartnerAccess();
  const queryClient = useQueryClient();

  // Determine which user_id to use for the log
  // Partner logs under mom's account so both can see
  const targetUserId = isPartnerView ? momUserId : user?.id;

  return useMutation({
    mutationFn: async (input: CreateNapInput = {}) => {
      if (!user) throw new Error("Not authenticated");
      if (!targetUserId) throw new Error("No target user ID");

      const startedAt = input.started_at || new Date();
      const durationMinutes = input.duration_minutes || 30;
      
      // Calculate ended_at if duration provided
      let endedAt = input.ended_at;
      if (!endedAt && durationMinutes) {
        endedAt = new Date(startedAt.getTime() + durationMinutes * 60000);
      }

      const { data, error } = await supabase
        .from("nap_logs")
        .insert({
          user_id: targetUserId,
          started_at: startedAt.toISOString(),
          ended_at: endedAt?.toISOString() || null,
          duration_minutes: durationMinutes,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naps"] });
    },
  });
}

// Hook: Delete nap log
export function useDeleteNap() {
  const { user } = useAuth();
  const { isPartnerView, momUserId } = usePartnerAccess();
  const queryClient = useQueryClient();
  
  const targetUserId = isPartnerView ? momUserId : user?.id;

  return useMutation({
    mutationFn: async (napId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("nap_logs")
        .delete()
        .eq("id", napId)
        .eq("user_id", targetUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naps"] });
    },
  });
}

// Helper: Format nap duration
export function formatNapDuration(minutes: number | null): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Helper: Format time since last nap
export function formatTimeSinceNap(startedAt: string): string {
  const napDate = new Date(startedAt);
  const now = new Date();
  const diffMs = now.getTime() - napDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;
  
  if (diffHours < 24) {
    if (remainingMins === 0) return `${diffHours}h ago`;
    return `${diffHours}h ${remainingMins}m ago`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Helper: Calculate total nap time today
export function calculateTotalNapTime(naps: NapLog[]): number {
  return naps.reduce((total, nap) => total + (nap.duration_minutes || 0), 0);
}