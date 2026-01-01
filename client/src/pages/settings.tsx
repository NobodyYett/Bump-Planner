// client/src/pages/settings.tsx

import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { usePregnancyState, type BabySex } from "@/hooks/usePregnancyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { Loader2, Save, Trash2, AlertTriangle, Sun, Moon, Monitor, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme, type ThemeMode } from "@/theme/theme-provider";
import {
  isNotificationsSupported,
  isNightReminderEnabled,
  toggleNightReminder,
  hasNotificationPermission,
  requestNotificationPermission,
} from "@/lib/notifications";

function parseLocalDate(dateString: string): Date | null {
  const trimmed = dateString.trim();
  if (!trimmed) return null;
  const [year, month, day] = trimmed.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export default function SettingsPage() {
  const { user, deleteAccount } = useAuth();
  const { toast } = useToast();
  const { mode, setMode } = useTheme();

  const {
    dueDate, setDueDate,
    babyName, setBabyName,
    babySex, setBabySex,
    momName, setMomName,
    partnerName, setPartnerName,
  } = usePregnancyState();

  const [nameInput, setNameInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [sexInput, setSexInput] = useState<"boy" | "girl" | null>(null);
  const [momInput, setMomInput] = useState("");
  const [partnerInput, setPartnerInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Notification state
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [notificationsAvailable, setNotificationsAvailable] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [togglingReminder, setTogglingReminder] = useState(false);

  const email = user?.email ?? "Unknown";

  useEffect(() => {
    async function checkNotifications() {
      const supported = isNotificationsSupported();
      setNotificationsAvailable(supported);
      if (supported) {
        const hasPermission = await hasNotificationPermission();
        setPermissionGranted(hasPermission);
        setReminderEnabled(isNightReminderEnabled());
      }
    }
    checkNotifications();
  }, []);

  useEffect(() => {
    setNameInput(babyName ?? "");
    setDateInput(dueDate ? format(dueDate, "yyyy-MM-dd") : "");
    setSexInput(babySex && babySex !== "unknown" ? (babySex as "boy" | "girl") : null);
    setMomInput(momName ?? "");
    setPartnerInput(partnerName ?? "");
  }, [babyName, dueDate, babySex, momName, partnerName]);

  async function handleReminderToggle(enabled: boolean) {
    setTogglingReminder(true);
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
          setTogglingReminder(false);
          return;
        }
      }
      const success = await toggleNightReminder(enabled);
      if (success) {
        setReminderEnabled(enabled);
        toast({
          title: enabled ? "Reminder enabled" : "Reminder disabled",
          description: enabled
            ? "You'll receive a gentle reminder at 8:30pm each evening."
            : "Evening reminders have been turned off.",
        });
      }
    } catch (error) {
      console.error("Failed to toggle reminder:", error);
    } finally {
      setTogglingReminder(false);
    }
  }

  async function handleSaveChanges() {
    if (!user) return;
    setIsSaving(true);
    const sexToSave: BabySex = sexInput ?? "unknown";
    const parsedDueDate = parseLocalDate(dateInput);

    if (parsedDueDate) {
      const daysFromToday = differenceInDays(parsedDueDate, new Date());
      if (daysFromToday < -30 || daysFromToday > 310) {
        setIsSaving(false);
        toast({ variant: "destructive", title: "That date looks unusual", description: "Please double-check the due date." });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from("pregnancy_profiles")
        .update({
          baby_name: nameInput.trim() || null,
          due_date: dateInput.trim() || null,
          baby_sex: sexToSave,
          mom_name: momInput.trim() || null,
          partner_name: partnerInput.trim() || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setBabyName(nameInput.trim() || null);
      setDueDate(parsedDueDate);
      setBabySex(sexToSave);
      setMomName(momInput.trim() || null);
      setPartnerName(partnerInput.trim() || null);

      toast({ title: "Settings Saved", description: "Your details have been updated." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Failed to save changes." });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (confirmText !== "DELETE" || !user) return;
    try {
      setDeleting(true);
      await deleteAccount();
    } catch (err) {
      console.error("Delete failed:", err);
      toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete account." });
      setDeleting(false);
    }
  }

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: "system", label: "System", icon: <Monitor className="w-4 h-4" /> },
    { value: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
    { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
  ];

  return (
    <Layout dueDate={dueDate} setDueDate={setDueDate}>
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        <header className="space-y-2">
          <h1 className="font-serif text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your pregnancy details and account preferences.</p>
        </header>

        {/* Appearance */}
        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="bg-muted/30 px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">Choose how Bump Planner looks to you.</p>
          </div>
          <div className="p-6 space-y-3">
            <label className="text-sm font-medium">Theme</label>
            <div className="flex gap-3">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMode(opt.value)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 border rounded-lg px-4 py-3 transition-all",
                    mode === opt.value ? "bg-primary/10 border-primary text-primary ring-1 ring-primary/20" : "hover:bg-muted border-border"
                  )}
                >
                  {opt.icon}
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">System matches your device appearance.</p>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="bg-muted/30 px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h2>
            <p className="text-sm text-muted-foreground">Manage your reminder preferences.</p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Evening check-in reminder</label>
                <p className="text-xs text-muted-foreground">
                  {notificationsAvailable ? "Receive a gentle reminder at 8:30pm" : "Available on iOS and Android apps"}
                </p>
              </div>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={handleReminderToggle}
                disabled={!notificationsAvailable || togglingReminder}
              />
            </div>
            {!permissionGranted && notificationsAvailable && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                Notification permission not granted. Enable the toggle to request permission.
              </p>
            )}
          </div>
        </section>

        {/* Pregnancy Details */}
        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="bg-muted/30 px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold">Pregnancy Details</h2>
            <p className="text-sm text-muted-foreground">Update your info to recalculate your timeline.</p>
          </div>
          <div className="p-6 grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Baby&apos;s Name</label>
              <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="e.g. Oliver" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Baby&apos;s Sex</label>
              <div className="flex gap-4">
                <label
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 cursor-pointer border rounded-md px-4 py-3 transition-all",
                    sexInput === "boy"
                      ? "bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300"
                      : "hover:bg-muted"
                  )}
                >
                  <input type="radio" name="sex" checked={sexInput === "boy"} onChange={() => setSexInput("boy")} className="sr-only" />
                  <span>Boy</span>
                </label>
                <label
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 cursor-pointer border rounded-md px-4 py-3 transition-all",
                    sexInput === "girl"
                      ? "bg-pink-50 border-pink-200 text-pink-700 ring-1 ring-pink-200 dark:bg-pink-950 dark:border-pink-800 dark:text-pink-300"
                      : "hover:bg-muted"
                  )}
                >
                  <input type="radio" name="sex" checked={sexInput === "girl"} onChange={() => setSexInput("girl")} className="sr-only" />
                  <span>Girl</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Parent Names */}
        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="bg-muted/30 px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold">Parents</h2>
            <p className="text-sm text-muted-foreground">Optional. Displayed on your home screen.</p>
          </div>
          <div className="p-6 grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mom&apos;s Name</label>
              <Input value={momInput} onChange={(e) => setMomInput(e.target.value)} placeholder="e.g. Sarah" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Partner&apos;s Name</label>
              <Input value={partnerInput} onChange={(e) => setPartnerInput(e.target.value)} placeholder="e.g. Alex" />
            </div>
          </div>
          <div className="bg-muted/30 px-6 py-4 border-t border-border flex justify-end">
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
            </Button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="border border-destructive/30 rounded-xl overflow-hidden">
          <div className="bg-destructive/5 px-6 py-4 border-b border-destructive/20">
            <h2 className="text-lg font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                You are currently signed in as <span className="font-mono text-foreground font-medium">{email}</span>.
              </p>
              <p className="text-sm text-muted-foreground">
                To permanently delete your account, type <span className="font-bold text-destructive">DELETE</span> below.
              </p>
            </div>
            <div className="flex gap-4">
              <Input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="max-w-[200px]"
              />
              <Button variant="destructive" disabled={confirmText !== "DELETE" || deleting} onClick={handleDeleteAccount}>
                {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : <><Trash2 className="mr-2 h-4 w-4" />Delete Account</>}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}