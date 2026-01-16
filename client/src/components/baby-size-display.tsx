import { getWeekData } from "@/lib/pregnancy-data";
import { getInfantWeekData } from "@/lib/infancy-data";
import wombT1 from "@/asset/womb/womb-t1.png"; 
import wombT2 from "@/asset/womb/womb-t2.png";
import wombT3 from "@/asset/womb/womb-t3.png";
import babyNewborn from "@/asset/womb/baby-newborn.png";

interface BabySizeDisplayProps {
  currentWeek: number;
  appMode?: "pregnancy" | "infancy";
}

function getWombImage(week: number) {
  if (week <= 13) return wombT1;      // 1st trimester
  if (week <= 27) return wombT2;      // 2nd trimester
  return wombT3;                      // 3rd trimester & beyond
}

// Get approximate baby weight range by week
function getWeightRange(week: number): string {
  if (week <= 8) return "< 1 oz";
  if (week <= 12) return "~0.5 oz";
  if (week <= 16) return "~3-5 oz";
  if (week <= 20) return "~10-12 oz";
  if (week <= 24) return "~1-1.5 lbs";
  if (week <= 28) return "~2-2.5 lbs";
  if (week <= 32) return "~3.5-4 lbs";
  if (week <= 36) return "~5.5-6 lbs";
  if (week <= 38) return "~6-7 lbs";
  return "~7-8 lbs"; // Week 39-40+
}

export function BabySizeDisplay({ currentWeek, appMode = "pregnancy" }: BabySizeDisplayProps) {
  // INFANCY MODE - milestone removed (shown in gentle nudge)
  if (appMode === "infancy") {
    const infantData = getInfantWeekData(currentWeek);
    
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-6 p-6">
          {/* TEXT SIDE */}
          <div className="flex-1 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Week {currentWeek}
            </p>

            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground">
              {infantData.title}
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {infantData.babyInsight}
            </p>
          </div>

          {/* BABY IMAGE SIDE */}
          <div className="relative flex-shrink-0">
            <div className="w-48 md:w-60">
              <img src={babyNewborn} alt="Baby" className="w-full h-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PREGNANCY MODE (original behavior with restored styling)
  const weekData = getWeekData(currentWeek) || { size: "Growing", fruit: "Baby", tip: "Your baby is growing every day!" };
  const wombImage = getWombImage(currentWeek);
  const weightRange = getWeightRange(currentWeek);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row items-center gap-6 p-6">
        {/* TEXT SIDE */}
        <div className="flex-1 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Your baby is the size of a
          </p>

          {/* Fruit name in PRIMARY GREEN color */}
          <h2 className="text-4xl md:text-5xl font-serif font-semibold text-primary">
            {weekData.size}
          </h2>

          {/* Weight range tag in PRIMARY GREEN (replacing duplicate fruit name) */}
          <span className="inline-block px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium">
            {weightRange}
          </span>

          <p className="text-sm text-muted-foreground leading-relaxed pt-2">
            {weekData.tip}
          </p>
        </div>

        {/* WOMB IMAGE SIDE */}
        <div className="relative flex-shrink-0">
          <div className="w-48 md:w-60">
            <img src={wombImage} alt="Baby in womb" className="w-full h-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}