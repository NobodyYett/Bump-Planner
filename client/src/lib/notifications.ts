// client/src/lib/notifications.ts

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const NIGHT_REMINDER_ID = 8830;
const MORNING_GUIDANCE_ID = 8830 + 1; // 8831
const NIGHT_STORAGE_KEY = "bump_night_reminder_enabled";
const MORNING_STORAGE_KEY = "bump_morning_guidance_enabled";

export function isNotificationsSupported(): boolean {
  return Capacitor.isNativePlatform();
}

// ---- Night Reminder (8:30 PM) ----

export function isNightReminderEnabled(): boolean {
  const stored = localStorage.getItem(NIGHT_STORAGE_KEY);
  if (stored === null) return true; // ON by default
  return stored === "true";
}

export function setNightReminderEnabled(enabled: boolean): void {
  localStorage.setItem(NIGHT_STORAGE_KEY, enabled ? "true" : "false");
}

export async function scheduleNightReminder(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  try {
    const hasPermission = await hasNotificationPermission();
    if (!hasPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) return false;
    }
    await cancelNightReminder();
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(20, 30, 0, 0);
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    await LocalNotifications.schedule({
      notifications: [
        {
          id: NIGHT_REMINDER_ID,
          title: "Evening Check-in",
          body: "How was your day? Take a moment to reflect.",
          schedule: { at: scheduledTime, repeats: true, every: "day" },
          sound: "default",
          smallIcon: "ic_stat_icon_config_sample",
          iconColor: "#5A8F7B",
        },
      ],
    });
    console.log("Night reminder scheduled for 8:30pm daily");
    return true;
  } catch (error) {
    console.error("Failed to schedule night reminder:", error);
    return false;
  }
}

export async function cancelNightReminder(): Promise<void> {
  if (!isNotificationsSupported()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: NIGHT_REMINDER_ID }] });
    console.log("Night reminder cancelled");
  } catch (error) {
    console.error("Failed to cancel night reminder:", error);
  }
}

export async function toggleNightReminder(enable: boolean): Promise<boolean> {
  setNightReminderEnabled(enable);
  if (enable) {
    const success = await scheduleNightReminder();
    return success;
  } else {
    await cancelNightReminder();
    return true;
  }
}

// ---- Morning Guidance (8:30 AM) ----

export function isMorningGuidanceEnabled(): boolean {
  const stored = localStorage.getItem(MORNING_STORAGE_KEY);
  if (stored === null) return true; // ON by default
  return stored === "true";
}

export function setMorningGuidanceEnabled(enabled: boolean): void {
  localStorage.setItem(MORNING_STORAGE_KEY, enabled ? "true" : "false");
}

export async function scheduleMorningGuidance(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  try {
    const hasPermission = await hasNotificationPermission();
    if (!hasPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) return false;
    }
    await cancelMorningGuidance();
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(8, 30, 0, 0);
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    await LocalNotifications.schedule({
      notifications: [
        {
          id: MORNING_GUIDANCE_ID,
          title: "Good morning",
          body: "A new day begins. Take it one moment at a time.",
          schedule: { at: scheduledTime, repeats: true, every: "day" },
          sound: "default",
          smallIcon: "ic_stat_icon_config_sample",
          iconColor: "#5A8F7B",
        },
      ],
    });
    console.log("Morning guidance scheduled for 8:30am daily");
    return true;
  } catch (error) {
    console.error("Failed to schedule morning guidance:", error);
    return false;
  }
}

export async function cancelMorningGuidance(): Promise<void> {
  if (!isNotificationsSupported()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: MORNING_GUIDANCE_ID }] });
    console.log("Morning guidance cancelled");
  } catch (error) {
    console.error("Failed to cancel morning guidance:", error);
  }
}

export async function toggleMorningGuidance(enable: boolean): Promise<boolean> {
  setMorningGuidanceEnabled(enable);
  if (enable) {
    const success = await scheduleMorningGuidance();
    return success;
  } else {
    await cancelMorningGuidance();
    return true;
  }
}

// ---- Shared ----

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === "granted";
  } catch (error) {
    console.error("Failed to request notification permission:", error);
    return false;
  }
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display === "granted";
  } catch (error) {
    console.error("Failed to check notification permission:", error);
    return false;
  }
}

export async function initializeNotifications(): Promise<void> {
  if (!isNotificationsSupported()) return;
  
  // Initialize night reminder
  const nightEnabled = isNightReminderEnabled();
  if (nightEnabled) {
    await scheduleNightReminder();
  }
  
  // Initialize morning guidance
  const morningEnabled = isMorningGuidanceEnabled();
  if (morningEnabled) {
    await scheduleMorningGuidance();
  }
}