import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { usePregnancyState, type BabySex } from "@/hooks/usePregnancyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { Loader2, Save, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user, deleteAccount } = useAuth();
  const { toast } = useToast();

  const {
    dueDate,
    setDueDate,
    babyName,
    setBabyName,
    babySex,
    setBabySex,
  } = usePregnancyState();

  // Local state for form
  const [nameInput, setNameInput] = useState("");
  const [dateInput, setDateInput] = useState(""); // "yyyy-MM-dd" or ""
  const [sexInput, setSexInput] = useState<"boy" | "girl" | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const email = user?.email ?? "Unknown";

  // Keep local form in sync with global state
  useEffect(() => {
    setNameInput(babyName ?? "");
    setDateInput(dueDate ? format(new Date(dueDate), "yyyy-MM-dd") : "");
    setSexInput(babySex && babySex !== "unknown" ? (babySex as "boy" | "girl") : null);
  }, [babyName, dueDate, babySex]);

  function parseDateInput(value: string): Date | null {
    if (!value || value.trim() === "") return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function validateDueDate(d: Date): { ok: boolean; message?: string } {
    // We’re guarding against obvious mistakes (e.g., wrong year).
    // Typical pregnancy ~40 weeks; due date usually in near future.
    // Allow some flexibility:
    // - up to 6 weeks in the past (late entry / postpartum)
    // - up to 45 weeks in the future (early entry / uncertain dating)
    const daysFromToday = differenceInDays(d, new Date());
    const minDays = -42;  // 6 weeks past
    const maxDays = 315;  // ~45 weeks ahead

    if (daysFromToday < minDays || daysFromToday > maxDays) {
      return {
        ok: false,
        message: "That due date looks unusual. Please double-check the year and month.",
      };
    }
    return { ok: true };
  }

  async function handleSaveChanges() {
    if (!user) return;

    const sexToSave: BabySex = sexInput ?? "unknown";
    const trimmedName = nameInput.trim();
    const parsedDue = parseDateInput(dateInput);

    // If user entered a date string but it parses invalid, block
    if (dateInput.trim() && !parsedDue) {
      toast({
        variant: "destructive",
        title: "Invalid date",
        description: "Please choose a valid due date.",
      });
      return;
    }

    // Pregnancy range guard (optional but recommended)
    if (parsedDue) {
      const v = validateDueDate(parsedDue);
      if (!v.ok) {
        toast({
          variant: "destructive",
          title: "Please double-check",
          description: v.message,
        });
        return;
      }
    }

    setIsSaving(true);

    try {
      // IMPORTANT: store null for empty, never ""
      const dueToSave = dateInput.trim() ? dateInput.trim() : null;

      const { error } = await supabase
        .from("pregnancy_profiles")
        .update({
          baby_name: trimmedName.length > 0 ? trimmedName : null,
          due_date: dueToSave,
          baby_sex: sexToSave,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      // Update global state safely (no Invalid Date)
      setBabyName(trimmedName.length > 0 ? trimmedName : null);
      setDueDate(parsedDue); // can be null, which is fine
      setBabySex(sexToSave);

      toast({
        title: "Saved",
        description: "Your settings have been updated.",
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "Could not update settings. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!user) return;
    if (confirmText !== "DELETE") return;

    try {
      setDeleting(true);
      await deleteAccount();
      // deleteAccount likely logs you out / navigates away
    } catch (err) {
      console.error("Delete failed:", err);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Could not delete your account. Please try again.",
      });
      setDeleting(false);
    }
  }

  return (
    <Layout dueDate={dueDate} setDueDate={setDueDate}>
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        <header className="space-y-2">
          <h1 className="font-serif text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your pregnancy details and account preferences.
          </p>
        </header>

        {/* Pregnancy Details */}
        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="bg-muted/30 px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold">Pregnancy Details</h2>
            <p className="text-sm text-muted-foreground">
              Update your info to recalculate your timeline.
            </p>
          </div>

          <div className="p-6 grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Baby&apos;s Name</label>
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Due Date</label>
              <Input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank if you don’t want to set it yet.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Baby&apos;s Sex</label>
              <div className="flex gap-4">
                <label
                  className={cn(
                    "flex-1 flex items-center justify-center cursor-pointer border rounded-md px-4 py-3 transition-all",
                    sexInput === "boy"
                      ? "bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-200"
                      : "hover:bg-muted",
                  )}
                >
                  <input
                    type="radio"
                    name="sex"
                    checked={sexInput === "boy"}
                    onChange={() => setSexInput("boy")}
                    className="sr-only"
                  />
                  <span>Boy</span>
                </label>

                <label
                  className={cn(
                    "flex-1 flex items-center justify-center cursor-pointer border rounded-md px-4 py-3 transition-all",
                    sexInput === "girl"
                      ? "bg-pink-50 border-pink-200 text-pink-700 ring-1 ring-pink-200"
                      : "hover:bg-muted",
                  )}
                >
                  <input
                    type="radio"
                    name="sex"
                    checked={sexInput === "girl"}
                    onChange={() => setSexInput("girl")}
                    className="sr-only"
                  />
                  <span>Girl</span>
                </label>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setSexInput(null)}
                className="w-full"
              >
                Prefer not to say
              </Button>
            </div>
          </div>

          <div className="bg-muted/30 px-6 py-4 border-t border-border flex justify-end">
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
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
                Signed in as{" "}
                <span className="font-mono text-foreground font-medium">{email}</span>.
              </p>
              <p className="text-sm text-muted-foreground">
                To permanently delete your account and all data, type{" "}
                <span className="font-bold text-destructive">DELETE</span> below.
              </p>
            </div>

            <div className="flex gap-4 items-center">
              <Input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="max-w-[220px]"
              />

              <Button
                variant="destructive"
                disabled={confirmText !== "DELETE" || deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
