// client/src/lib/notifications.ts

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const NIGHT_REMINDER_ID = 8830;
const STORAGE_KEY = "bump_night_reminder_enabled";

export function isNotificationsSupported(): boolean {
  return Capacitor.isNativePlatform();
}

export function isNightReminderEnabled(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) return true;
  return stored === "true";
}

export function setNightReminderEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
}

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
          title: "Evening Check-in 🌙",
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

export async function initializeNotifications(): Promise<void> {
  if (!isNotificationsSupported()) return;
  const enabled = isNightReminderEnabled();
  if (enabled) {
    await scheduleNightReminder();
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
