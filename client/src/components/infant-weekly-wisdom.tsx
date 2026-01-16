// client/src/components/infant-weekly-wisdom.tsx
// Weekly insights for infant development

import { getInfantWeekData, getInfancyMomTip, getInfancyPartnerTip } from "@/lib/infancy-data";
import { Sparkles, Heart, Star } from "lucide-react";

interface InfantWeeklyWisdomProps {
  babyAgeWeeks: number;
  babyAgeDays: number;
  isPartnerView?: boolean;
}

export function InfantWeeklyWisdom({ 
  babyAgeWeeks, 
  babyAgeDays,
  isPartnerView = false 
}: InfantWeeklyWisdomProps) {
  // Use week + 1 since we want "Week 1" when baby is 0-6 days old
  const displayWeek = babyAgeWeeks + 1;
  const weekData = getInfantWeekData(displayWeek);
  const parentTip = isPartnerView 
    ? getInfancyPartnerTip(displayWeek)
    : getInfancyMomTip(displayWeek);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">{weekData.title}</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Week {displayWeek}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Baby Insight */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Star className="w-4 h-4" />
            <span>Your Baby This Week</span>
          </div>
          <p className="text-sm leading-relaxed">
            {weekData.babyInsight}
          </p>
        </div>

        {/* Milestone (if present) */}
        {weekData.milestone && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-sm font-medium text-primary flex items-center gap-2">
              <span>🎯</span>
              <span>Milestone: {weekData.milestone}</span>
            </p>
          </div>
        )}

        {/* Parent Tip */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Heart className="w-4 h-4" />
            <span>{isPartnerView ? "Partner Tip" : "For You"}</span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {parentTip}
          </p>
        </div>
      </div>
    </div>
  );
}