import { Layout } from "@/components/layout";
import { usePregnancyState } from "@/hooks/usePregnancyState";
import { pregnancyData, getWeekData } from "@/lib/pregnancy-data";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";

export default function Timeline() {
  const { dueDate, setDueDate, currentWeek } = usePregnancyState();

  // Group weeks by trimester
  const trimesters = [
    { label: "First Trimester", weeks: pregnancyData.filter(w => w.trimester === 1), range: "Weeks 1-13" },
    { label: "Second Trimester", weeks: pregnancyData.filter(w => w.trimester === 2), range: "Weeks 14-27" },
    { label: "Third Trimester", weeks: pregnancyData.filter(w => w.trimester === 3 && w.week <= 40), range: "Weeks 28-40" },
  ];

  const trimesterColors = {
    1: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
      accent: "bg-blue-500",
      text: "text-blue-700 dark:text-blue-300",
      lightText: "text-blue-600 dark:text-blue-400",
    },
    2: {
      bg: "bg-purple-50 dark:bg-purple-950/30",
      border: "border-purple-200 dark:border-purple-800",
      accent: "bg-purple-500",
      text: "text-purple-700 dark:text-purple-300",
      lightText: "text-purple-600 dark:text-purple-400",
    },
    3: {
      bg: "bg-pink-50 dark:bg-pink-950/30",
      border: "border-pink-200 dark:border-pink-800",
      accent: "bg-pink-500",
      text: "text-pink-700 dark:text-pink-300",
      lightText: "text-pink-600 dark:text-pink-400",
    },
  };

  return (
    <Layout dueDate={dueDate} setDueDate={setDueDate}>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <section className="text-center py-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
            Your Pregnancy Timeline
          </h1>
          <p className="text-muted-foreground text-lg">
            40 weeks of growth and development
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <Circle className="w-3 h-3 fill-current" />
            <span className="text-sm font-medium">Currently Week {currentWeek}</span>
          </div>
        </section>

        {/* Timeline by Trimester */}
        <div className="space-y-12">
          {trimesters.map((trimester, trimesterIndex) => {
            const trimesterNum = (trimesterIndex + 1) as 1 | 2 | 3;
            const colors = trimesterColors[trimesterNum];
            
            return (
              <motion.section
                key={trimester.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: trimesterIndex * 0.1 }}
                className={cn("rounded-2xl p-6 md:p-8 border", colors.bg, colors.border)}
              >
                {/* Trimester Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className={cn("font-serif text-2xl font-bold", colors.text)}>
                      {trimester.label}
                    </h2>
                    <p className={cn("text-sm", colors.lightText)}>{trimester.range}</p>
                  </div>
                  <div className={cn("px-3 py-1 rounded-full text-xs font-semibold text-white", colors.accent)}>
                    {trimester.weeks.length} weeks
                  </div>
                </div>

                {/* Week Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {trimester.weeks.map((week) => {
                    const isPast = week.week < currentWeek;
                    const isCurrent = week.week === currentWeek;
                    const isFuture = week.week > currentWeek;

                    return (
                      <motion.div
                        key={week.week}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: week.week * 0.02 }}
                        className={cn(
                          "relative rounded-xl p-4 border transition-all",
                          isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background bg-card shadow-lg",
                          isPast && "bg-card/60 dark:bg-card/40 border-border",
                          isFuture && "bg-card/40 dark:bg-card/20 border-border/50"
                        )}
                      >
                        {/* Week Number Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={cn(
                            "text-sm font-semibold",
                            isCurrent ? "text-primary" : isPast ? "text-muted-foreground" : "text-muted-foreground/50"
                          )}>
                            Week {week.week}
                          </span>
                          {isPast && (
                            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                              <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                            </div>
                          )}
                          {isCurrent && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Circle className="w-2 h-2 fill-white text-white" />
                            </div>
                          )}
                        </div>

                        {/* Baby Size */}
                        <div className={cn(
                          "font-serif text-lg font-medium mb-1",
                          isCurrent ? "text-foreground" : isPast ? "text-foreground/80" : "text-muted-foreground/50"
                        )}>
                          {week.fruit}
                        </div>

                        {/* Size Info */}
                        <div className={cn(
                          "text-xs mb-2",
                          isCurrent ? "text-muted-foreground" : isPast ? "text-muted-foreground/80" : "text-muted-foreground/40"
                        )}>
                          ~{week.size}
                        </div>

                        {/* Tip (only show for current week or on hover) */}
                        {isCurrent && (
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed border-t pt-2 border-border">
                            {week.tip}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            );
          })}
        </div>

        {/* Footer Message */}
        <section className="text-center py-8 text-muted-foreground">
          <p className="text-sm">
            Every pregnancy is unique. These milestones are general guidelines.
          </p>
        </section>
      </div>
    </Layout>
  );
}