// src/components/weekly-guidance.tsx

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface WeeklyGuidanceProps {
  currentWeek: number;
  trimester: 1 | 2 | 3;
}

function getTrimesterLabel(trimester: 1 | 2 | 3) {
  if (trimester === 1) return "First trimester";
  if (trimester === 2) return "Second trimester";
  return "Third trimester";
}

function getGuidanceSections(currentWeek: number, trimester: 1 | 2 | 3) {
  const label = getTrimesterLabel(trimester);

  return {
    body: `${label}: listen to your body this week. Stay hydrated, move gently, and rest when you can.`,
    baby:
      currentWeek <= 4
        ? "Your baby is just starting to implant and grow. Things are tiny but changing fast."
        : currentWeek <= 12
        ? "Major organs are forming and your baby is becoming more recognizable as a little human."
        : currentWeek <= 27
        ? "Your baby is practicing movements, swallowing, and reacting to the world inside the womb."
        : "Your baby is mostly focused on gaining weight and getting ready to meet you.",
    appointments:
      currentWeek <= 8
        ? "If you haven’t already, this is a good time to schedule your first prenatal visit."
        : currentWeek <= 20
        ? "You may have blood work, screening options, and an anatomy scan around this time."
        : "Check in with your provider about birth preferences, classes, and any symptoms that feel off.",
    mind: "Pregnancy is a huge mental shift. It’s okay to feel excited, nervous, tired, or all three at once.",
  };
}

export function WeeklyGuidance({ currentWeek, trimester }: WeeklyGuidanceProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null); // for daily limit later
  const { toast } = useToast();

  const sections = getGuidanceSections(currentWeek, trimester);

  async function handleAsk() {
    const trimmed = question.trim();
    if (!trimmed) return;

    setLoading(true);
    setAnswer(null);

    try {
      // Add week + trimester context before sending to Ivy
      const decoratedQuestion = `I'm around week ${currentWeek} of pregnancy, in the ${getTrimesterLabel(
        trimester
      )}. ${trimmed}`;

      const { data, error } = await supabase.functions.invoke("ask-ivy", {
        body: { question: decoratedQuestion },
      });

      if (error) {
        console.error(error);
        toast({
          title: "Ivy is unavailable",
          description: "Please try again in a little while.",
          variant: "destructive",
        });
        return;
      }

      if (!data || !data.answer) {
        setAnswer("Ivy couldn't find a helpful answer this time. Try rephrasing?");
      } else {
        setAnswer(data.answer);
      }

      if (typeof data?.remaining === "number") {
        setRemaining(data.remaining);
      }

      setQuestion("");
    } catch (err) {
      console.error(err);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-8 border border-border/70 bg-card/80 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            {/* If you want the label to read “Weekly Wisdom”, just change this text */}
            <CardTitle className="text-lg md:text-xl font-serif">
              Weekly Wisdom
            </CardTitle>
            {/* removed the extra “Week X • trimester” line here */}
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-muted-foreground bg-background/80">
            <Sparkles className="w-3 h-3" />
            <span>Powered by Ivy</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Guidance sections */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Your body this week
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {sections.body}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Your baby&apos;s development
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {sections.baby}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Appointments & planning
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {sections.appointments}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Mind, mood & emotions
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {sections.mind}
            </p>
          </div>
        </div>

        {/* Ask Ivy */}
        <div className="pt-4 border-t border-border/60 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">
              Have a question about this week? Ask Ivy below.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="Ask Ivy about symptoms, feelings, or what to expect this week…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAsk();
                }
              }}
            />
            <Button type="button" onClick={handleAsk} disabled={loading}>
              {loading ? "Ivy is thinking…" : "Ask Ivy"}
            </Button>
          </div>

          {typeof remaining === "number" && (
            <p className="text-[11px] text-muted-foreground">
              {remaining > 0
                ? `${remaining} question${remaining === 1 ? "" : "s"} left for today.`
                : "No questions left for today. Check back tomorrow or upgrade later for more."}
            </p>
          )}

          {answer && (
            <div className="rounded-md bg-muted/70 px-3 py-2 text-xs text-muted-foreground whitespace-pre-line">
              {answer}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}