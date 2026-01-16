import { motion } from "framer-motion";
import { format, differenceInWeeks, addWeeks } from "date-fns";
import { getWeekData } from "@/lib/pregnancy-data";
import { cn } from "@/lib/utils";

interface WeekProgressProps {
  currentWeek: number;
  rightElement?: React.ReactNode;
  subtextElement?: React.ReactNode;
  hideTitle?: boolean;
}

export function WeekProgress({ currentWeek, rightElement, subtextElement, hideTitle = false }: WeekProgressProps) {
  // Clamp week between 1 and 40 for display
  const displayWeek = Math.max(1, Math.min(40, currentWeek));
  const weekData = getWeekData(displayWeek);
  
  const trimesterColors = {
    1: "bg-blue-200 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    2: "bg-purple-200 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    3: "bg-pink-200 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-end gap-3">
          {/* Left side: Progress label + Week number */}
          <div>
            {!hideTitle && (
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Progress</h2>
            )}
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-serif text-3xl font-bold text-foreground">Week {displayWeek}</span>
              <span className="text-muted-foreground">of 40</span>
            </div>
          </div>
          
          {/* Right side: Trimester badge */}
          <div className={cn("px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap", trimesterColors[weekData.trimester])}>
            Trimester {weekData.trimester}
          </div>
        </div>
        
        {/* Optional subtext element centered under week number */}
        {subtextElement && (
          <div className="mt-1" style={{ width: "180px", textAlign: "center" }}>
            {subtextElement}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-4 bg-muted rounded-full overflow-hidden">
        <motion.div 
          className="absolute top-0 left-0 h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(displayWeek / 40) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Markers for trimesters */}
        <div className="absolute top-0 left-[32.5%] w-0.5 h-full bg-background/50" /> {/* Week 13 */}
        <div className="absolute top-0 left-[67.5%] w-0.5 h-full bg-background/50" /> {/* Week 27 */}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Conception</span>
        <span>1st Trimester</span>
        <span>2nd Trimester</span>
        <span>3rd Trimester</span>
        <span>Due Date</span>
      </div>
    </div>
  );
}