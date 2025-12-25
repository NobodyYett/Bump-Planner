// client/src/pages/onboarding.tsx

import { useState } from "react";
import { usePregnancyState } from "@/hooks/usePregnancyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

// --- Helper Functions ---
function calculateDueFromLmp(lmp: string): string | null {
  if (!lmp) return null;
  const base = new Date(lmp);
  if (Number.isNaN(base.getTime())) return null;
  base.setDate(base.getDate() + 280); // Naegele rule: LMP + 280 days
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDateString(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !Number.isNaN(d.getTime());
}

// --- Component ---
export default function Onboarding() {
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    setDueDate,
    setBabyName,
    setBabySex,
    setIsOnboardingComplete,
    refetch,
  } = usePregnancyState();

  // Steps:
  // 1 = ask if user knows due date
  // 2 = due date input
  // 2.5 = offer to calculate due date
  // 2.1 = last period input (LMP)
  // 2.2 = show calculated due date
  // 3 = baby details (name + sex)
  const [step, setStep] = useState<number>(1);

  const [dueInput, setDueInput] = useState<string>("");
  const [lmpInput, setLmpInput] = useState<string>("");
  const [calcDue, setCalcDue] = useState<string>("");

  const [babyName, setBabyNameLocal] = useState<string>("");
  const [babySex, setBabySexLocal] = useState<"boy" | "girl" | "unknown">(
    "unknown"
  );

  const [isSaving, setIsSaving] = useState(false);
  const [confirmedDueDate, setConfirmedDueDate] = useState<Date | null>(null);

  function goToHome() {
    window.location.href = "/";
  }

  async function saveAndComplete(
    finalDate: Date | null,
    currentBabyName: string | null = null,
    currentBabySex: "boy" | "girl" | "unknown" = "unknown"
  ) {
    if (!user) return;
    setIsSaving(true);

    const payload: {
      user_id: string;
      due_date?: string | null;
      onboarding_complete: boolean;
      baby_name: string | null;
      baby_sex: string;
    } = {
      user_id: user.id,
      onboarding_complete: true,
      baby_name: currentBabyName,
      baby_sex: currentBabySex,
    };

    if (finalDate) {
      const year = finalDate.getFullYear();
      const month = String(finalDate.getMonth() + 1).padStart(2, "0");
      const day = String(finalDate.getDate()).padStart(2, "0");
      payload.due_date = `${year}-${month}-${day}`;
    } else {
      payload.due_date = null;
    }

    const { error } = await supabase
      .from("pregnancy_profiles")
      .upsert(payload, { onConflict: "user_id" });

    setIsSaving(false);

    if (error) {
      console.error("Failed to complete onboarding:", error);
      toast({
        title: "Error saving profile",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsOnboardingComplete(true);

    if (refetch) {
      refetch();
    }

    goToHome();
  }

  // Step 1: User knows due date -> go to step 2a
  function handleYesKnowDueDate() {
    setStep(2);
  }

  // Step 1: User doesn't know due date -> ask if they want to calculate
  function handleNoKnowDueDate() {
    setStep(2.5); // Intermediate step: offer calculation
  }

  // Step 2.5: User wants to calculate -> go to step 2.1
  function handleWantToCalculate() {
    setStep(2.1); // Go to LMP input
  }

  // Step 2.5: User doesn't want to calculate -> skip to home
  async function handleSkipEverything() {
    await saveAndComplete(null, null, "unknown");
  }

  // Step 2a: User entered due date -> validate and go to baby details
  function handleDueDateContinue() {
    if (!dueInput) {
      toast({
        title: "Please enter a due date",
        variant: "destructive",
      });
      return;
    }

    if (!isValidDateString(dueInput)) {
      toast({
        title: "Invalid due date",
        description: "Please enter a valid date.",
        variant: "destructive",
      });
      return;
    }

    const d = new Date(dueInput);
    setConfirmedDueDate(d);
    setDueDate(d);
    setStep(3);
  }

  // Step 2.1: User entered LMP -> calculate due date and show it (step 2.2)
  function handleLmpContinue() {
    if (!lmpInput) {
      toast({
        title: "Please enter the first day of your last period",
        variant: "destructive",
      });
      return;
    }

    if (!isValidDateString(lmpInput)) {
      toast({
        title: "Invalid date",
        description: "Please enter a valid date.",
        variant: "destructive",
      });
      return;
    }

    const due = calculateDueFromLmp(lmpInput);
    if (!due) {
      toast({
        title: "Could not calculate due date",
        description: "Please check your date and try again.",
        variant: "destructive",
      });
      return;
    }

    setCalcDue(due);
    setStep(2.2);
  }

  // Step 2.2: Confirm calculated due date -> go to baby details
  function handleConfirmCalculatedDueDate() {
    if (!calcDue || !isValidDateString(calcDue)) {
      toast({
        title: "Invalid calculated due date",
        description: "Please try calculating again.",
        variant: "destructive",
      });
      return;
    }

    const d = new Date(calcDue);
    setConfirmedDueDate(d);
    setDueDate(d);
    setStep(3);
  }

  // Step 3: Final save with all details
  async function handleFinalContinue() {
    const nameTrimmed = babyName.trim();
    const finalName = nameTrimmed.length > 0 ? nameTrimmed : null;

    setBabyName(finalName);
    setBabySex(babySex);

    await saveAndComplete(confirmedDueDate, finalName, babySex);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-sm p-6 space-y-6">
        {step === 1 && (
          <>
            <h1 className="text-2xl font-semibold">Welcome</h1>
            <p className="text-muted-foreground">
              Do you know your baby&apos;s due date?
            </p>
            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={handleYesKnowDueDate}
                disabled={isSaving}
              >
                Yes
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={handleNoKnowDueDate}
                disabled={isSaving}
              >
                No
              </Button>
            </div>
          </>
        )}

        {step === 2.5 && (
          <>
            <h1 className="text-2xl font-semibold">No worries</h1>
            <p className="text-muted-foreground">
              Would you like to calculate your due date?
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleWantToCalculate} disabled={isSaving}>
                Yes, calculate it
              </Button>
              <Button
                variant="outline"
                onClick={handleSkipEverything}
                disabled={isSaving}
              >
                Skip for now
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-semibold">Enter Due Date</h1>
            <p className="text-muted-foreground">
              You can update this later in Settings.
            </p>

            <div className="space-y-2">
              <Label>Due date</Label>
              <Input
                type="date"
                value={dueInput}
                onChange={(e) => setDueInput(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleDueDateContinue} disabled={isSaving}>
                Continue
              </Button>
            </div>
          </>
        )}

        {step === 2.1 && (
          <>
            <h1 className="text-2xl font-semibold">Calculate Due Date</h1>
            <p className="text-muted-foreground">
              Enter the first day of your last menstrual period (LMP).
            </p>

            <div className="space-y-2">
              <Label>First day of last period</Label>
              <Input
                type="date"
                value={lmpInput}
                onChange={(e) => setLmpInput(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleLmpContinue} disabled={isSaving}>
                Calculate
              </Button>
            </div>
          </>
        )}

        {step === 2.2 && (
          <>
            <h1 className="text-2xl font-semibold">Your Estimated Due Date</h1>
            <p className="text-muted-foreground">
              Based on your last period, your estimated due date is:
            </p>

            <div className="text-xl font-semibold">{calcDue}</div>

            <div className="flex justify-end">
              <Button
                onClick={handleConfirmCalculatedDueDate}
                disabled={isSaving}
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-2xl font-semibold">Baby Details</h1>
            <p className="text-muted-foreground">
              Optional — you can change this later.
            </p>

            <div className="space-y-2">
              <Label>Baby name</Label>
              <Input
                value={babyName}
                onChange={(e) => setBabyNameLocal(e.target.value)}
                placeholder="Optional"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-3">
              <Label>Baby&apos;s sex</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={babySex === "boy" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setBabySexLocal("boy")}
                  disabled={isSaving}
                >
                  Boy
                </Button>
                <Button
                  type="button"
                  variant={babySex === "girl" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setBabySexLocal("girl")}
                  disabled={isSaving}
                >
                  Girl
                </Button>
              </div>
              <Button
                type="button"
                variant={babySex === "unknown" ? "default" : "outline"}
                className="w-full"
                onClick={() => setBabySexLocal("unknown")}
                disabled={isSaving}
              >
                Prefer not to say
              </Button>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleFinalContinue} disabled={isSaving}>
                Finish
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
