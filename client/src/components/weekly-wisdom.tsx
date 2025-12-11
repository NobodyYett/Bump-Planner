import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMomTip } from "@/lib/pregnancy-data";

interface WeeklyWisdomProps {
  currentWeek: number;
  trimester: 1 | 2 | 3;
}

export function WeeklyWisdom({ currentWeek, trimester }: WeeklyWisdomProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const momTip = getMomTip(currentWeek);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setAnswer(null);

    const { data, error } = await supabase.functions.invoke("ask-flo", {
      body: { question, week: currentWeek, trimester },
    });

    setLoading(false);

    if (error) {
      console.error(error);
      setErrorMsg(
        "FLO couldn’t answer right now. Please try again in a moment."
      );
      return;
    }

    setAnswer(data?.answer ?? "FLO answered, but something looked empty.");
  }

  return (
    <section className="bg-primary/10 rounded-3xl border border-primary/20 px-6 py-6 md:px-10 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="font-serif text-xl md:text-2xl font-semibold text-primary">
            Weekly Wisdom
          </h2>
          <p className="text-[11px] text-primary/70 mt-1">
            A quick check-in just for you this week.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-[10px] font-medium text-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Powered by FLO
        </span>
      </div>

      {/* Mom-focused tip text */}
      <p className="text-sm md:text-base text-primary/80 leading-relaxed mb-4">
        {momTip}
      </p>

      {/* Ask FLO input */}
      <form
        onSubmit={handleAsk}
        className="mt-2 flex flex-col gap-3 border-t border-primary/20 pt-4"
      >
        <p className="text-[11px] text-primary/80">
          Have a question about this week, how you’re feeling, or what to
          expect? Ask FLO below.
        </p>

        <div className="flex flex-col md:flex-row gap-2">
          <Input
            placeholder="Ask FLO about this week..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 text-sm"
          />
          <Button
            type="submit"
            disabled={loading}
            className="md:w-28 shrink-0"
          >
            {loading ? "Thinking…" : "Ask FLO"}
          </Button>
        </div>
      </form>

      {errorMsg && (
        <p className="mt-2 text-xs text-destructive">{errorMsg}</p>
      )}

      {answer && (
        <div className="mt-3 rounded-2xl bg-primary/5 border border-primary/20 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary/70 mb-1">
            FLO’s reply
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {answer}
          </p>
          <p className="mt-2 text-[10px] text-primary/70">
            FLO shares general education & emotional support only. For anything
            medical or urgent, please contact your healthcare provider.
          </p>
        </div>
      )}
    </section>
  );
}
