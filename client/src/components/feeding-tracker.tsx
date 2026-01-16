// client/src/components/feeding-tracker.tsx
// Compact feeding tracker card for infancy mode

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useLastFeeding,
  useCreateFeeding,
  useTodayFeedings,
  formatTimeSinceFeeding,
  getFeedingEmoji,
  getSideLabel,
  type FeedingType,
  type BreastSide,
} from "@/hooks/useFeedingLogs";
import { cn } from "@/lib/utils";
import { Baby, ChevronLeft } from "lucide-react";

interface FeedingTrackerProps {
  isPartnerView?: boolean;
  momUserId?: string | null;  // For partner to log under mom's account
}

export function FeedingTracker({ isPartnerView = false, momUserId }: FeedingTrackerProps) {
  const { toast } = useToast();
  const { data: lastFeeding, isLoading: lastLoading } = useLastFeeding();
  const { data: todayFeedings = [] } = useTodayFeedings();
  const createFeeding = useCreateFeeding();
  
  // UI state: null = show buttons, "breast" = show side selection
  const [selectingSide, setSelectingSide] = useState(false);

  async function handleQuickLog(type: FeedingType, side?: BreastSide) {
    try {
      await createFeeding.mutateAsync({ type, side, fed_at: new Date() });
      
      const sideText = side ? ` (${getSideLabel(side)})` : "";
      toast({
        title: "Feeding logged",
        description: `${getFeedingEmoji(type)} ${type}${sideText}`,
      });
      
      setSelectingSide(false);
    } catch (err) {
      console.error("Failed to log feeding:", err);
      toast({
        title: "Couldn't save",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }

  const todayCount = todayFeedings.length;
  const isPending = createFeeding.isPending;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Baby className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Feeding</h3>
        </div>
        {todayCount > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {todayCount} today
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Last feeding display */}
        {lastLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : lastFeeding ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">{getFeedingEmoji(lastFeeding.type)}</span>
            <div>
              <span className="font-medium">
                {formatTimeSinceFeeding(lastFeeding.fed_at)}
              </span>
              {lastFeeding.side && (
                <span className="text-muted-foreground ml-1">
                  ({getSideLabel(lastFeeding.side)})
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No feedings logged yet</p>
        )}

        {/* Quick log buttons - both mom and partner can log */}
        {!selectingSide ? (
              /* Main buttons */
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-9"
                  onClick={() => setSelectingSide(true)}
                  disabled={isPending}
                >
                  🤱 Breast
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-9"
                  onClick={() => handleQuickLog("bottle")}
                  disabled={isPending}
                >
                  🍼 Bottle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-9"
                  onClick={() => handleQuickLog("formula")}
                  disabled={isPending}
                >
                  🥛 Formula
                </Button>
              </div>
            ) : (
              /* Side selection for breast */
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectingSide(false)}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={isPending}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-muted-foreground">Which side?</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-9"
                    onClick={() => handleQuickLog("breast", "left")}
                    disabled={isPending}
                  >
                    Left
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-9"
                    onClick={() => handleQuickLog("breast", "right")}
                    disabled={isPending}
                  >
                    Right
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-9"
                    onClick={() => handleQuickLog("breast", "both")}
                    disabled={isPending}
                  >
                    Both
                  </Button>
                </div>
              </div>
            )}
      </div>
    </div>
  );
}