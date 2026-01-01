// client/src/lib/checkinSlots.ts

export type CheckinSlot = "morning" | "evening" | "night";

/**
 * Get the suggested slot based on current local time
 * - morning: 04:00–11:59
 * - evening: 12:00–18:59
 * - night: 19:00–03:59
 */
export function getSuggestedSlot(date: Date = new Date()): CheckinSlot {
  const hour = date.getHours();
  
  if (hour >= 4 && hour < 12) return "morning";
  if (hour >= 12 && hour < 19) return "evening";
  return "night"; // 19:00-03:59
}

/**
 * Get display label for a slot
 */
export function getSlotLabel(slot: CheckinSlot): string {
  switch (slot) {
    case "morning": return "Morning";
    case "evening": return "Evening";
    case "night": return "Night";
  }
}

/**
 * Get emoji for a slot
 */
export function getSlotEmoji(slot: CheckinSlot): string {
  switch (slot) {
    case "morning": return "🌅";
    case "evening": return "☀️";
    case "night": return "🌙";
  }
}

/**
 * Get time range description for a slot
 */
export function getSlotTimeRange(slot: CheckinSlot): string {
  switch (slot) {
    case "morning": return "4am – 12pm";
    case "evening": return "12pm – 7pm";
    case "night": return "7pm – 4am";
  }
}

/**
 * All slots in order
 */
export const ALL_SLOTS: CheckinSlot[] = ["morning", "evening", "night"];
