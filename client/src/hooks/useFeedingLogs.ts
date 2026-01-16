// client/src/hooks/useFeedingLogs.ts
// CRUD operations for feeding logs

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerAccess } from "@/contexts/PartnerContext";

export type FeedingType = "breast" | "bottle" | "formula";
export type BreastSide = "left" | "right" | "both";

export interface FeedingLog {
  id: string;
  user_id: string;
  fed_at: string;
  type: FeedingType;
  side: BreastSide | null;
  duration_minutes: number | null;
  amount_oz: number | null;
  notes: string | null;
  created_at: string;
}

export interface CreateFeedingInput {
  type: FeedingType;
  fed_at?: Date;
  side?: BreastSide;
  duration_minutes?: number;
  amount_oz?: number;
  notes?: string;
}

// Fetch today's feeding logs
async function fetchTodayFeedings(userId: string): Promise<FeedingLog[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from("feeding_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("fed_at", today.toISOString())
    .lt("fed_at", tomorrow.toISOString())
    .order("fed_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get the most recent feeding
async function fetchLastFeeding(userId: string): Promise<FeedingLog | null> {
  const { data, error } = await supabase
    .from("feeding_logs")
    .select("*")
    .eq("user_id", userId)
    .order("fed_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

// Hook: Get today's feedings
export function useTodayFeedings() {
  const { user } = useAuth();
  const { isPartnerView, momUserId } = usePartnerAccess();
  
  // Use mom's ID if partner view, otherwise current user
  const userId = isPartnerView ? momUserId : user?.id;

  return useQuery({
    queryKey: ["feedings", "today", userId],
    queryFn: () => fetchTodayFeedings(userId!),
    enabled: !!userId,
    refetchInterval: 60000,
  });
}

// Hook: Get last feeding
export function useLastFeeding() {
  const { user } = useAuth();
  const { isPartnerView, momUserId } = usePartnerAccess();
  
  // Use mom's ID if partner view, otherwise current user
  const userId = isPartnerView ? momUserId : user?.id;

  return useQuery({
    queryKey: ["feedings", "last", userId],
    queryFn: () => fetchLastFeeding(userId!),
    enabled: !!userId,
    refetchInterval: 60000,
  });
}

// Hook: Create feeding log
// Logs under mom's user_id so both parents see the same logs
export function useCreateFeeding() {
  const { user } = useAuth();
  const { isPartnerView, momUserId } = usePartnerAccess();
  const queryClient = useQueryClient();

  // Determine which user_id to use for the log
  // Partner logs under mom's account so both can see
  const targetUserId = isPartnerView ? momUserId : user?.id;

  return useMutation({
    mutationFn: async (input: CreateFeedingInput) => {
      if (!user) throw new Error("Not authenticated");
      if (!targetUserId) throw new Error("No target user ID");

      const { data, error } = await supabase
        .from("feeding_logs")
        .insert({
          user_id: targetUserId,
          type: input.type,
          fed_at: (input.fed_at || new Date()).toISOString(),
          side: input.side || null,
          duration_minutes: input.duration_minutes || null,
          amount_oz: input.amount_oz || null,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedings"] });
    },
  });
}

// Hook: Delete feeding log
export function useDeleteFeeding() {
  const { user } = useAuth();
  const { isPartnerView, momUserId } = usePartnerAccess();
  const queryClient = useQueryClient();
  
  const targetUserId = isPartnerView ? momUserId : user?.id;

  return useMutation({
    mutationFn: async (feedingId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("feeding_logs")
        .delete()
        .eq("id", feedingId)
        .eq("user_id", targetUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedings"] });
    },
  });
}

// Helper: Format time since last feeding
export function formatTimeSinceFeeding(fedAt: string): string {
  const fedDate = new Date(fedAt);
  const now = new Date();
  const diffMs = now.getTime() - fedDate.getTime();
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

// Helper: Get feeding type emoji
export function getFeedingEmoji(type: FeedingType): string {
  switch (type) {
    case "breast": return "🤱";
    case "bottle": return "🍼";
    case "formula": return "🥛";
    default: return "🍼";
  }
}

// Helper: Get side label
export function getSideLabel(side: BreastSide | null): string {
  if (!side) return "";
  switch (side) {
    case "left": return "L";
    case "right": return "R";
    case "both": return "Both";
    default: return "";
  }
}