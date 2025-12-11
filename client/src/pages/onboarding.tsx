import { useState } from "react";
import { usePregnancyState } from "@/hooks/usePregnancyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Turn an LMP date into a due date by adding 40 weeks (280 days)
function calculateDueFromLmp(lmp: string): string | null {
  if (!lmp) return null;
  const base = new Date(lmp);
  if (Number.isNaN(base.getTime())) return null;

  const due = new Date(base);
  due.setDate(due.getDate() + 280);

  const year = due.getFullYear();
  const month = String(due.getMonth() + 1).padStart(2, "0");
  const day = String(due.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // YYYY-MM-DD
}

function formatForInput(date: Date | undefined): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Onboarding() {
  const {
    dueDate,
    setDueDate,
    babyName,
    setBabyName,
    babySex,
    setBabySex,
  } = usePregnancyState();

  const { toast } = useToast();

  const [mode, setMode] = useState<"due" | "lmp">("due");
  const [dueInput, setDueInput] = useState<string>(formatForInput(dueDate));
  const [lmpInput, setLmpInput] = useState<string>("");

  function goToHome() {
    window.location.href = "/";
  }

  function handleContinue() {
    let finalDueStr = dueInput;

    // If they chose LMP mode, calculate from that
    if (!finalDueStr && mode === "lmp" && lmpInput) {
      const calc = calculateDueFromLmp(lmpInput);
      if (!calc) {
        toast({
          title: "Couldn’t calculate due date",
          description: "Please check the last period date and try again.",
          variant: "destructive",
        });
        return;
      }
      finalDueStr = calc;
    }

    if (finalDueStr) {
      const finalDate = new Date(finalDueStr);
      if (Number.isNaN(finalDate.getTime())) {
        toast({
          title: "Invalid date",
          description: "Please choose a valid due date.",
          variant: "destructive",
        });
        return;
      }

      setDueDate(finalDate);
      localStorage.removeItem("bump_skip_due");
      toast({
        title: "Due date saved",
        description: "You can change this any time from the home screen.",
      });
    }

    // Baby name + sex are already stored via their own inputs
    // Just continue to home
    goToHome();
  }

  function handleSkip() {
    localStorage.setItem("bump_skip_due", "true");
    goToHome();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card/80 backdrop-blur p-8 shadow-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Welcome to
          </p>
          <h1 className="text-3xl font-serif font-semibold tracking-tight">
            Bump Planner
          </h1>
          <p className="text-sm text-muted-foreground">
            Let&apos;s roughly place your baby on the timeline. You can always
            adjust this later once things are more concrete.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 text-sm">
          <Button
            type="button"
            variant={mode === "due" ? "default" : "outline"}
            className="w-full"
            onClick={() => setMode("due")}
          >
            I know my due date
          </Button>
          <Button
            type="button"
            variant={mode === "lmp" ? "default" : "outline"}
            className="w-full"
            onClick={() => setMode("lmp")}
          >
            Calculate from last period
          </Button>
        </div>

        {/* Due date / LMP input */}
        {mode === "due" ? (
          <div className="space-y-2">
            <Label htmlFor="due">Due date (estimated or confirmed)</Label>
            <Input
              id="due"
              type="date"
              value={dueInput}
              onChange={(e) => setDueInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Not exact yet? That&apos;s okay. You can update this after your
              first scan or whenever you get a clearer date.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="lmp">First day of your last period (LMP)</Label>
            <Input
              id="lmp"
              type="date"
              value={lmpInput}
              onChange={(e) => setLmpInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll estimate your due date by adding 40 weeks (280 days) to
              this date.
            </p>
          </div>
        )}

        {/* Baby Details */}
        <div className="mt-4 bg-card rounded-xl border border-border p-4 space-y-4">
          <h3 className="font-serif text-lg font-medium">Baby details</h3>

          {/* Baby Name */}
          <div className="space-y-2">
            <Label htmlFor="babyName">Baby name (optional)</Label>
            <Input
              id="babyName"
              type="text"
              placeholder="Enter a name or leave blank for now"
              value={babyName ?? ""}
              onChange={(e) => setBabyName(e.target.value)}
            />
          </div>

          {/* Baby Sex */}
          <div className="space-y-2">
            <Label>Baby sex</Label>
            <div className="flex gap-2">
              {[
                { value: "boy", label: "Boy" },
                { value: "girl", label: "Girl" },
                { value: "unknown", label: "Not sure yet" },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={babySex === opt.value ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setBabySex(opt.value as "boy" | "girl" | "unknown")}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <Button className="w-full" onClick={handleContinue}>
            Continue to your dashboard
          </Button>
          <Button
            variant="ghost"
            className="w-full text-xs"
            onClick={handleSkip}
          >
            Skip for now – I&apos;ll set this later
          </Button>
        </div>
      </div>
    </div>
  );
}
