// client/src/lib/storageMigration.ts
// One-time migration of localStorage keys from bump_* to bloom_*

const MIGRATION_KEY = "bloom_storage_migrated_v1";

const KEY_MIGRATIONS: Record<string, string> = {
  "bump_ai_usage": "bloom_ai_usage",
  "bump_morning_checkin_enabled": "bloom_morning_checkin_enabled",
  "bump_evening_checkin_enabled": "bloom_evening_checkin_enabled",
  "bump_appointment_reminders_enabled": "bloom_appointment_reminders_enabled",
  "bump_default_reminder_times": "bloom_default_reminder_times",
  "bump_last_morning_sent": "bloom_last_morning_sent",
  "bump_last_evening_sent": "bloom_last_evening_sent",
  "bump_registries": "bloom_registries",
  "bumpplanner_show_task_suggestions": "bloom_show_task_suggestions",
  "bump_skip_due": "bloom_skip_due",
};

export function migrateLocalStorage(): void {
  if (localStorage.getItem(MIGRATION_KEY) === "true") {
    return;
  }

  console.log("[Storage Migration] Starting migration from bump_* to bloom_*");

  let migratedCount = 0;

  for (const [oldKey, newKey] of Object.entries(KEY_MIGRATIONS)) {
    const value = localStorage.getItem(oldKey);
    if (value !== null) {
      localStorage.setItem(newKey, value);
      localStorage.removeItem(oldKey);
      migratedCount++;
      console.log(`[Storage Migration] ${oldKey} → ${newKey}`);
    }
  }

  localStorage.setItem(MIGRATION_KEY, "true");
  
  if (migratedCount > 0) {
    console.log(`[Storage Migration] Complete. Migrated ${migratedCount} keys.`);
  } else {
    console.log("[Storage Migration] No keys to migrate.");
  }
}
