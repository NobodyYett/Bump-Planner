// client/src/pages/baby-arrived.tsx
// Post-birth transition flow: Congratulations → Infancy Intro → Baby Info

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { usePregnancyState } from "@/hooks/usePregnancyState";
import { usePremium } from "@/contexts/PremiumContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Sparkles, Heart, Baby, Calendar, Check } from "lucide-react";

// Helper: parse "yyyy-MM-dd" and optional "HH:mm" as LOCAL date
function parseLocalDateTime(dateString: string, timeString?: string): Date | null {
  if (!dateString) return null;
  const trimmed = dateString.trim();
  if (!trimmed) return null;
  const [year, month, day] = trimmed.split("-").map(Number);
  if (!year || !month || !day) return null;
  
  if (timeString && timeString.trim()) {
    const [hours, minutes] = timeString.trim().split(":").map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      return new Date(year, month - 1, day, hours, minutes);
    }
  }
  
  return new Date(year, month - 1, day);
}

export default function BabyArrived() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  
  const {
    babyName,
    setBabyName,
    babySex,
    setBabySex,
    transitionToInfancy,
    setInfancyOnboardingComplete,
    refetch,
  } = usePregnancyState();

  // Steps: 1 = Congrats, 2 = Infancy Intro, 3 = Baby Info
  const [step, setStep] = useState(1);
  const [birthDateInput, setBirthDateInput] = useState(format(new Date(), "yyyy-MM-dd"));
  const [birthTimeInput, setBirthTimeInput] = useState("");
  const [nameInput, setNameInput] = useState(babyName ?? "");
  const [sexInput, setSexInput] = useState<"boy" | "girl" | "unknown">(babySex);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  // Sync name from state
  useEffect(() => {
    setNameInput(babyName ?? "");
  }, [babyName]);

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  async function handleComplete() {
    if (!user) return;
    
    const birthDate = parseLocalDateTime(birthDateInput, birthTimeInput);
    if (!birthDate) {
      toast({
        title: "Please enter a valid birth date",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Update baby name/sex if changed
      if (nameInput !== babyName) {
        await setBabyName(nameInput.trim() || null);
      }
      if (sexInput !== babySex) {
        await setBabySex(sexInput);
      }

      // Transition to infancy mode
      await transitionToInfancy(birthDate);
      await setInfancyOnboardingComplete(true);

      // Refetch and navigate home
      await refetch();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Failed to complete transition:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleSkipToLater() {
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 px-4 relative overflow-hidden">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#F59E0B', '#FCD34D', '#98D8C8', '#F7DC6F', '#AED6F1'][
                    Math.floor(Math.random() * 5)
                  ],
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="w-full max-w-md rounded-2xl border bg-card/90 backdrop-blur p-8 shadow-xl space-y-6 relative z-10">
        {/* STEP 1: Congratulations */}
        {step === 1 && (
          <>
            <div className="text-center space-y-4">
              {/* Decorative icon */}
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 dark:from-primary/30 dark:to-primary/40 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
              </div>
              
              <h1 className="text-3xl font-serif font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Baby is here!
              </h1>
              
              <p className="text-muted-foreground leading-relaxed">
                Congratulations on the beginning of a beautiful new chapter.
              </p>
              
              <p className="text-sm text-muted-foreground">
                We're honored to continue this journey with you.
              </p>
            </div>

            <div className="pt-4">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setStep(2)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Continue
              </Button>
            </div>
          </>
        )}

        {/* STEP 2: Infancy Guide Intro */}
        {step === 2 && (
          <>
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 dark:from-primary/30 dark:to-primary/40 flex items-center justify-center">
                  <Baby className="w-8 h-8 text-primary" />
                </div>
              </div>
              
              <h2 className="text-2xl font-serif font-semibold">
                Continue with the Infancy Guide
              </h2>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bloom now supports you through your baby's first weeks with gentle insights, 
                reminders, and simple tracking — designed to grow with your family.
              </p>

              {isPremium && (
                <div className="bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 rounded-lg p-3">
                  <p className="text-sm text-foreground dark:text-foreground flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    Included with your Premium subscription
                  </p>
                </div>
              )}
            </div>

            {/* Highlights */}
            <div className="space-y-3 py-2">
              {[
                "Weekly infant insights",
                "Feeding tracking",
                "Appointment reminders",
                "Partner access",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 space-y-3">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setStep(3)}
              >
                Continue with Infancy Guide
              </Button>
              
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={handleSkipToLater}
              >
                Maybe later
              </Button>
            </div>
          </>
        )}

        {/* STEP 3: Baby Info */}
        {step === 3 && (
          <>
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 dark:from-primary/30 dark:to-primary/40 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
              </div>
              
              <h2 className="text-2xl font-serif font-semibold">
                Baby's details
              </h2>
              
              <p className="text-sm text-muted-foreground">
                Confirm or update your baby's information.
              </p>
            </div>

            <div className="space-y-5 pt-2">
              {/* Birth Date - Required */}
              <div className="space-y-2">
                <Label htmlFor="birthDate" className="flex items-center gap-1">
                  Date of Birth
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDateInput}
                  onChange={(e) => setBirthDateInput(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {/* Birth Time - Optional */}
              <div className="space-y-2">
                <Label htmlFor="birthTime">Time of Birth (optional)</Label>
                <Input
                  id="birthTime"
                  type="time"
                  value={birthTimeInput}
                  onChange={(e) => setBirthTimeInput(e.target.value)}
                  disabled={isSaving}
                  placeholder="e.g., 14:30"
                />
              </div>

              {/* Name - Optional */}
              <div className="space-y-2">
                <Label htmlFor="name">Baby's Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Oliver, Emma"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {/* Sex - Optional */}
              <div className="space-y-2">
                <Label>Baby's Sex (optional)</Label>
                <div className="flex gap-2">
                  {[
                    { value: "boy", label: "Boy" },
                    { value: "girl", label: "Girl" },
                    { value: "unknown", label: "Prefer not to say" },
                  ].map((opt) => (
                    <Button
                      key={opt.value}
                      type="button"
                      variant={sexInput === opt.value ? "default" : "outline"}
                      className="flex-1 text-sm"
                      onClick={() => setSexInput(opt.value as "boy" | "girl" | "unknown")}
                      disabled={isSaving}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleComplete}
                disabled={isSaving}
              >
                {isSaving ? "Setting up..." : "Continue"}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full text-xs"
                onClick={() => setStep(2)}
                disabled={isSaving}
              >
                Back
              </Button>
            </div>
          </>
        )}
      </div>

      {/* CSS for confetti animation */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}