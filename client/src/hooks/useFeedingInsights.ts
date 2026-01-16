// client/src/hooks/useFeedingInsights.ts
// Analytics and insights for feeding/nap patterns

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerAccess } from "@/contexts/PartnerContext";
import { FeedingLog, FeedingType } from "./useFeedingLogs";
import { NapLog } from "./useNapLogs";

export interface FeedingInsights {
  // Today's summary
  todayFeedingCount: number;
  todayNapCount: number;
  todayTotalNapMinutes: number;
  
  // Patterns (based on last 7 days)
  avgTimeBetweenFeedings: number | null; // in minutes
  avgFeedingsPerDay: number | null;
  avgNapDuration: number | null; // in minutes
  longestSleepStretch: number | null; // in minutes
  
  // Most common
  mostCommonFeedingType: FeedingType | null;
  mostCommonBreastSide: "left" | "right" | "both" | null;
  
  // Last feeding info for notification timing
  lastFeedingAt: Date | null;
  minutesSinceLastFeeding: number | null;
  suggestedNextFeedingIn: number | null; // minutes until suggested next feeding
  
  // For display
  feedingPatternText: string;
  napPatternText: string;
}

interface RawData {
  feedings: FeedingLog[];
  naps: NapLog[];
}

// Fetch last 7 days of data
async function fetchWeekData(userId: string): Promise<RawData> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const [feedingsRes, napsRes] = await Promise.all([
    supabase
      .from("feeding_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("fed_at", weekAgo.toISOString())
      .order("fed_at", { ascending: true }),
    supabase
      .from("nap_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("started_at", weekAgo.toISOString())
      .order("started_at", { ascending: true }),
  ]);
  
  if (feedingsRes.error) throw feedingsRes.error;
  if (napsRes.error) throw napsRes.error;
  
  return {
    feedings: feedingsRes.data || [],
    naps: napsRes.data || [],
  };
}

// Calculate insights from raw data
function calculateInsights(data: RawData): FeedingInsights {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  // Filter today's data
  const todayFeedings = data.feedings.filter(f => new Date(f.fed_at) >= todayStart);
  const todayNaps = data.naps.filter(n => new Date(n.started_at) >= todayStart);
  
  // Today's summary
  const todayFeedingCount = todayFeedings.length;
  const todayNapCount = todayNaps.length;
  const todayTotalNapMinutes = todayNaps.reduce((sum, n) => sum + (n.duration_minutes || 0), 0);
  
  // Calculate average time between feedings
  let avgTimeBetweenFeedings: number | null = null;
  if (data.feedings.length >= 2) {
    const intervals: number[] = [];
    for (let i = 1; i < data.feedings.length; i++) {
      const prev = new Date(data.feedings[i - 1].fed_at);
      const curr = new Date(data.feedings[i].fed_at);
      const diffMins = (curr.getTime() - prev.getTime()) / 60000;
      // Only count reasonable intervals (30 min to 8 hours)
      if (diffMins >= 30 && diffMins <= 480) {
        intervals.push(diffMins);
      }
    }
    if (intervals.length > 0) {
      avgTimeBetweenFeedings = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
    }
  }
  
  // Average feedings per day
  const daysWithData = new Set(data.feedings.map(f => new Date(f.fed_at).toDateString())).size;
  const avgFeedingsPerDay = daysWithData > 0 ? Math.round(data.feedings.length / daysWithData * 10) / 10 : null;
  
  // Average nap duration
  const napsWithDuration = data.naps.filter(n => n.duration_minutes);
  const avgNapDuration = napsWithDuration.length > 0
    ? Math.round(napsWithDuration.reduce((sum, n) => sum + (n.duration_minutes || 0), 0) / napsWithDuration.length)
    : null;
  
  // Longest sleep stretch (looking at gaps between feedings during typical sleep hours)
  let longestSleepStretch: number | null = null;
  if (data.feedings.length >= 2) {
    let maxGap = 0;
    for (let i = 1; i < data.feedings.length; i++) {
      const prev = new Date(data.feedings[i - 1].fed_at);
      const curr = new Date(data.feedings[i].fed_at);
      const diffMins = (curr.getTime() - prev.getTime()) / 60000;
      if (diffMins > maxGap && diffMins <= 720) { // Max 12 hours
        maxGap = diffMins;
      }
    }
    if (maxGap > 0) {
      longestSleepStretch = Math.round(maxGap);
    }
  }
  
  // Most common feeding type
  const typeCounts: Record<FeedingType, number> = { breast: 0, bottle: 0, formula: 0 };
  data.feedings.forEach(f => {
    if (f.type) typeCounts[f.type]++;
  });
  const mostCommonFeedingType = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[1] > 0
    ? Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0] as FeedingType
    : null;
  
  // Most common breast side
  const sideCounts: Record<string, number> = { left: 0, right: 0, both: 0 };
  data.feedings.filter(f => f.type === "breast" && f.side).forEach(f => {
    if (f.side) sideCounts[f.side]++;
  });
  const mostCommonBreastSide = Object.entries(sideCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[1] > 0
    ? Object.entries(sideCounts).sort((a, b) => b[1] - a[1])[0][0] as "left" | "right" | "both"
    : null;
  
  // Last feeding and next feeding prediction
  const lastFeeding = data.feedings[data.feedings.length - 1];
  const lastFeedingAt = lastFeeding ? new Date(lastFeeding.fed_at) : null;
  const minutesSinceLastFeeding = lastFeedingAt
    ? Math.round((now.getTime() - lastFeedingAt.getTime()) / 60000)
    : null;
  
  // Suggest next feeding based on their pattern (default to 2.5 hours if no pattern)
  const typicalInterval = avgTimeBetweenFeedings || 150; // 2.5 hours default
  const suggestedNextFeedingIn = minutesSinceLastFeeding !== null
    ? Math.max(0, typicalInterval - minutesSinceLastFeeding)
    : null;
  
  // Generate pattern text
  let feedingPatternText = "Not enough data yet";
  if (avgTimeBetweenFeedings && avgFeedingsPerDay) {
    const hours = Math.floor(avgTimeBetweenFeedings / 60);
    const mins = avgTimeBetweenFeedings % 60;
    const timeStr = hours > 0 
      ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`)
      : `${mins}m`;
    feedingPatternText = `Every ~${timeStr} • ${avgFeedingsPerDay}/day avg`;
  }
  
  let napPatternText = "Not enough data yet";
  if (avgNapDuration && longestSleepStretch) {
    const avgHrs = Math.floor(avgNapDuration / 60);
    const avgMins = avgNapDuration % 60;
    const avgStr = avgHrs > 0 ? `${avgHrs}h ${avgMins}m` : `${avgMins}m`;
    
    const longHrs = Math.floor(longestSleepStretch / 60);
    const longMins = longestSleepStretch % 60;
    const longStr = longHrs > 0 ? `${longHrs}h ${longMins}m` : `${longMins}m`;
    
    napPatternText = `Avg nap: ${avgStr} • Longest stretch: ${longStr}`;
  }
  
  return {
    todayFeedingCount,
    todayNapCount,
    todayTotalNapMinutes,
    avgTimeBetweenFeedings,
    avgFeedingsPerDay,
    avgNapDuration,
    longestSleepStretch,
    mostCommonFeedingType,
    mostCommonBreastSide,
    lastFeedingAt,
    minutesSinceLastFeeding,
    suggestedNextFeedingIn,
    feedingPatternText,
    napPatternText,
  };
}

// Hook: Get feeding insights
export function useFeedingInsights() {
  const { user } = useAuth();
  const { isPartnerView, momUserId } = usePartnerAccess();
  
  const userId = isPartnerView ? momUserId : user?.id;

  return useQuery({
    queryKey: ["feedingInsights", userId],
    queryFn: async () => {
      const data = await fetchWeekData(userId!);
      return calculateInsights(data);
    },
    enabled: !!userId,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider stale after 30s
  });
}

// Helper: Format minutes to readable string
export function formatMinutesToReadable(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Helper: Get feeding context for AI (Ivy)
export function getFeedingContextForAI(insights: FeedingInsights): string {
  const parts: string[] = [];
  
  if (insights.todayFeedingCount > 0) {
    parts.push(`Baby has had ${insights.todayFeedingCount} feeding${insights.todayFeedingCount !== 1 ? 's' : ''} today.`);
  }
  
  if (insights.todayNapCount > 0) {
    const napTime = formatMinutesToReadable(insights.todayTotalNapMinutes);
    parts.push(`Baby has napped ${insights.todayNapCount} time${insights.todayNapCount !== 1 ? 's' : ''} today (${napTime} total).`);
  }
  
  if (insights.avgTimeBetweenFeedings) {
    const interval = formatMinutesToReadable(insights.avgTimeBetweenFeedings);
    parts.push(`Baby typically feeds every ${interval}.`);
  }
  
  if (insights.minutesSinceLastFeeding !== null) {
    const timeSince = formatMinutesToReadable(insights.minutesSinceLastFeeding);
    parts.push(`Last feeding was ${timeSince} ago.`);
  }
  
  if (insights.longestSleepStretch) {
    const longest = formatMinutesToReadable(insights.longestSleepStretch);
    parts.push(`Longest sleep stretch this week: ${longest}.`);
  }
  
  return parts.join(' ');
}