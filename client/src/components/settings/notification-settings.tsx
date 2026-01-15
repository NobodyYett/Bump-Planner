// client/src/components/settings/notification-settings.tsx

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Calendar, Clock } from "lucide-react";
import {
  isNotificationsSupported,
  isMorningCheckinEnabled,
  toggleMorningCheckin,
  isEveningCheckinEnabled,
  toggleEveningCheckin,
  isAppointmentRemindersEnabled,
  toggleAppointmentReminders,
  getDefaultReminderTimes,
  setDefaultReminderTimes,
  hasNotificationPermission,
  requestNotificationPermission,
  REMINDER_TIME_OPTIONS,
  type ReminderTimePreference,
} from "@/lib/notifications";
import { rescheduleAllAppointmentReminders } from "@/hooks/useAppointments";

interface NotificationSettingsProps {
  isPartnerView: boolean;
}

export function NotificationSettings({ isPartnerView }: NotificationSettingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [morningCheckinEnabled, setMorningCheckinEnabled] = useState(false);
  const [eveningCheckinEnabled, setEveningCheckinEnabled] = useState(false);
  const [appointmentRemindersEnabled, setAppointmentRemindersEnabled] = useState(false);
  const [reminderTimes, setReminderTimesState] = useState<ReminderTimePreference>({
    firstReminder: 1440,
    secondReminder: 60,
  });
  const [notificationsAvailable, setNotificationsAvailable] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [togglingMorning, setTogglingMorning] = useState(false);
  const [togglingEvening, setTogglingEvening] = useState(false);
  const [togglingAppointments, setTogglingAppointments] = useState(false);

  useEffect(() => {
    async function checkNotifications() {
      const supported = isNotificationsSupported();
      setNotificationsAvailable(supported);
      if (supported) {
        const hasPermission = await hasNotificationPermission();
        setPermissionGranted(hasPermission);
        setMorningCheckinEnabled(isMorningCheckinEnabled());
        setEveningCheckinEnabled(isEveningCheckinEnabled());
        setAppointmentRemindersEnabled(isAppointmentRemindersEnabled());
        setReminderTimesState(getDefaultReminderTimes());
      }
    }
    checkNotifications();
  }, []);

  async function handleMorningCheckinToggle(enabled: boolean) {
    setTogglingMorning(true);
    try {
      if (enabled && !permissionGranted) {
        const granted = await requestNotificationPermission();
        setPermissionGranted(granted);
        if (!granted) {
          toast({
            title: "Notifications disabled",
            description: "Please enable notifications in your device settings.",
            variant: "destructive",
          });
          setTogglingMorning(false);
          return;
        }
      }
      const success = await toggleMorningCheckin(enabled);
      if (success) {
        setMorningCheckinEnabled(enabled);
        toast({
          title: enabled ? "Morning check-in enabled" : "Morning check-in disabled",
          description: enabled
            ? "You'll receive a gentle reminder at 8:30am each morning."
            : "Morning check-in reminders have been turned off.",
        });
      }
    } catch (error) {
      console.error("Failed to toggle morning check-in:", error);
    } finally {
      setTogglingMorning(false);
    }
  }

  async function handleEveningCheckinToggle(enabled: boolean) {
    setTogglingEvening(true);
    try {
      if (enabled && !permissionGranted) {
        const granted = await requestNotificationPermission();
        setPermissionGranted(granted);
        if (!granted) {
          toast({
            title: "Notifications disabled",
            description: "Please enable notifications in your device settings.",
            variant: "destructive",
          });
          setTogglingEvening(false);
          return;
        }
      }
      const success = await toggleEveningCheckin(enabled);
      if (success) {
        setEveningCheckinEnabled(enabled);
        toast({
          title: enabled ? "Evening check-in enabled" : "Evening check-in disabled",
          description: enabled
            ? "You'll receive a gentle reminder at 8:30pm to reflect on your day."
            : "Evening check-in reminders have been turned off.",
        });
      }
    } catch (error) {
      console.error("Failed to toggle evening check-in:", error);
    } finally {
      setTogglingEvening(false);
    }
  }

  async function handleAppointmentRemindersToggle(enabled: boolean) {
    setTogglingAppointments(true);
    try {
      if (enabled && !permissionGranted) {
        const granted = await requestNotificationPermission();
        setPermissionGranted(granted);
        if (!granted) {
          toast({
            title: "Notifications disabled",
            description: "Please enable notifications in your device settings.",
            variant: "destructive",
          });
          setTogglingAppointments(false);
          return;
        }
      }
      const success = await toggleAppointmentReminders(enabled);
      if (success) {
        setAppointmentRemindersEnabled(enabled);
        
        if (enabled && user) {
          await rescheduleAllAppointmentReminders(user.id);
        }
        
        toast({
          title: enabled ? "Appointment reminders enabled" : "Appointment reminders disabled",
          description: enabled
            ? "You'll be reminded before upcoming appointments."
            : "Appointment reminders have been turned off.",
        });
      }
    } catch (error) {
      console.error("Failed to toggle appointment reminders:", error);
    } finally {
      setTogglingAppointments(false);
    }
  }

  function handleReminderTimeChange(which: "first" | "second", value: number) {
    const newTimes = {
      ...reminderTimes,
      [which === "first" ? "firstReminder" : "secondReminder"]: value,
    };
    setReminderTimesState(newTimes);
    setDefaultReminderTimes(newTimes);
    toast({
      title: "Reminder time updated",
      description: "New appointments will use this reminder time.",
    });
  }

  return (
    <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="bg-muted/30 px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h2>
        <p className="text-sm text-muted-foreground">Manage your reminder preferences.</p>
      </div>
      <div className="p-6 space-y-6">
        {/* Morning Check-in */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-sm font-medium">Morning check-in</label>
            <p className="text-xs text-muted-foreground">
              {notificationsAvailable 
                ? "\"How did you sleep?\" at 8:30am" 
                : "Available on iOS and Android apps"
              }
            </p>
          </div>
          <Switch
            checked={morningCheckinEnabled}
            onCheckedChange={handleMorningCheckinToggle}
            disabled={!notificationsAvailable || togglingMorning}
          />
        </div>

        {/* Evening Check-in - only for mom */}
        {!isPartnerView && (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm font-medium">Evening check-in</label>
              <p className="text-xs text-muted-foreground">
                {notificationsAvailable 
                  ? "\"How was your day?\" at 8:30pm" 
                  : "Available on iOS and Android apps"
                }
              </p>
            </div>
            <Switch
              checked={eveningCheckinEnabled}
              onCheckedChange={handleEveningCheckinToggle}
              disabled={!notificationsAvailable || togglingEvening}
            />
          </div>
        )}

        {/* Appointment Reminders */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Appointment reminders
              </label>
              <p className="text-xs text-muted-foreground">
                {notificationsAvailable 
                  ? "Get reminded before upcoming appointments" 
                  : "Available on iOS and Android apps"
                }
              </p>
            </div>
            <Switch
              checked={appointmentRemindersEnabled}
              onCheckedChange={handleAppointmentRemindersToggle}
              disabled={!notificationsAvailable || togglingAppointments}
            />
          </div>

          {appointmentRemindersEnabled && notificationsAvailable && (
            <div className="space-y-4 pl-6 border-l-2 border-primary/20 ml-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  First reminder
                </label>
                <select
                  value={reminderTimes.firstReminder}
                  onChange={(e) => handleReminderTimeChange("first", Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm"
                >
                  {REMINDER_TIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Second reminder
                </label>
                <select
                  value={reminderTimes.secondReminder}
                  onChange={(e) => handleReminderTimeChange("second", Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm"
                >
                  {REMINDER_TIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-muted-foreground">
                These defaults apply to new appointments. You can customize each appointment individually.
              </p>
            </div>
          )}
        </div>

        {!permissionGranted && notificationsAvailable && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Notification permission not granted. Enable a toggle above to request permission.
          </p>
        )}
      </div>
    </section>
  );
}