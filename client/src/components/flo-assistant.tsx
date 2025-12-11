import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FloAssistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setAnswer(null);

    const { data, error } = await supabase.functions.invoke("ask-flo", {
      body: { question },
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
    <div className="mt-10 bg-card rounded-3xl border border-border shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-xl font-semibold">Ask FLO</h2>
          <p className="text-xs text-muted-foreground">
            A gentle companion for questions about your pregnancy journey
            (not a doctor).
          </p>
        </div>
        <span className="text-2xl">🌸</span>
      </div>

      <form onSubmit={handleAsk} className="space-y-3">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            What would you like to ask FLO?
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="Example: Is it normal to feel more tired this week?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Thinking…" : "Ask FLO"}
            </Button>
          </div>
        </div>
      </form>

      {errorMsg && (
        <p className="text-xs text-destructive mt-1">{errorMsg}</p>
      )}

      {answer && (
        <div className="mt-3 rounded-2xl bg-muted/70 border border-border px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
            FLO’s reply
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{answer}</p>
          <p className="mt-2 text-[10px] text-muted-foreground">
            FLO shares general education & emotional support only. For anything
            medical or urgent, please contact your healthcare provider.
          </p>
        </div>
      )}
    </div>
  );
}
