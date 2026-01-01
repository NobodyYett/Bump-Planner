// client/src/components/gentle-nudge.tsx

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getNudgeForCheckin, isNudgeCompleted, markNudgeCompleted, type CheckinContext } from "@/lib/nudges";
import { Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface GentleNudgeProps {
  checkinContext?: CheckinContext | null;
}

export function GentleNudge({ checkinContext = null }: GentleNudgeProps) {
  const [completed, setCompleted] = useState(false);
  const nudge = getNudgeForCheckin(checkinContext);

  useEffect(() => {
    setCompleted(isNudgeCompleted());
  }, []);

  function handleComplete() {
    markNudgeCompleted();
    setCompleted(true);
  }

  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
      <div className="flex items-start gap-3">
        <div className={cn(
          "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          completed 
            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
            : "bg-primary/10 text-primary"
        )}>
          {completed ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-muted-foreground mb-1">Gentle nudge</h3>
          {completed ? (
            <p className="text-sm text-foreground">Nice. Small wins count.</p>
          ) : (
            <>
              <p className="text-sm text-foreground mb-3">{nudge.message}</p>
              <Button size="sm" variant="outline" onClick={handleComplete} className="h-8">
                <Check className="w-3 h-3 mr-1" />
                Done
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}