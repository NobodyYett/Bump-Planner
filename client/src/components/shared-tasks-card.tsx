// client/src/components/shared-tasks-card.tsx

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, CheckCircle2, Circle, ListTodo, Lightbulb, Sparkles, Baby, Moon, Milk, FlaskConical, ChevronLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { PremiumLock } from "@/components/premium-lock";
import { useToast } from "@/hooks/use-toast";
import { 
  useCreateFeeding, 
  useLastFeeding,
  formatTimeSinceFeeding,
  getFeedingEmoji,
  getSideLabel,
  type FeedingType,
  type BreastSide 
} from "@/hooks/useFeedingLogs";
import { 
  useCreateNap, 
  useLastNap,
  formatTimeSinceNap 
} from "@/hooks/useNapLogs";
import {
  useFeedingInsights,
  formatMinutesToReadable,
} from "@/hooks/useFeedingInsights";

interface SharedTask {
  id: string;
  title: string;
  completed: boolean;
  completed_by: string | null;
  created_by: string;
}

interface SharedTasksCardProps {
  momUserId: string;
  trimester: 1 | 2 | 3;
  currentWeek: number;
  isPartnerView?: boolean;
  showSuggestions?: boolean;  // Default: true
  isPaid?: boolean;           // Premium subscription status
  appMode?: "pregnancy" | "infancy";  // Mode for appropriate suggestions
}

// Smart task suggestions based on current week
// These are practical, non-medical tasks for both parents
interface TaskSuggestion {
  title: string;
  priority: "high" | "medium" | "low";
  reason?: string;
}

function getSmartSuggestions(
  currentWeek: number,
  existingTasks: SharedTask[],
  appMode: "pregnancy" | "infancy" = "pregnancy"
): TaskSuggestion[] {
  const existingTitles = existingTasks.map(t => t.title.toLowerCase());
  const suggestions: TaskSuggestion[] = [];

  // Helper to check if task already exists
  const hasTask = (keywords: string[]) => 
    existingTitles.some(title => 
      keywords.some(kw => title.includes(kw.toLowerCase()))
    );

  // ========== INFANCY MODE ==========
  if (appMode === "infancy") {
    // Week 1-2: Immediate newborn care
    if (currentWeek <= 2) {
      if (!hasTask(["pediatrician", "doctor", "checkup", "appointment"])) {
        suggestions.push({
          title: "Schedule first pediatrician visit",
          priority: "high",
          reason: "Usually needed within 3-5 days",
        });
      }
      if (!hasTask(["birth certificate", "certificate", "vital records"])) {
        suggestions.push({
          title: "File for birth certificate",
          priority: "high",
          reason: "Start the paperwork early",
        });
      }
      if (!hasTask(["social security", "ssn", "ss card"])) {
        suggestions.push({
          title: "Apply for Social Security card",
          priority: "medium",
          reason: "Needed for insurance and taxes",
        });
      }
    }
    
    // Week 2-4: Getting settled
    if (currentWeek >= 2 && currentWeek <= 4) {
      if (!hasTask(["thank you", "thank-you", "notes", "gifts"])) {
        suggestions.push({
          title: "Send thank you notes",
          priority: "low",
          reason: "For baby gifts and meal deliveries",
        });
      }
      if (!hasTask(["insurance", "add baby", "dependent", "coverage"])) {
        suggestions.push({
          title: "Add baby to health insurance",
          priority: "high",
          reason: "Usually 30-day deadline from birth",
        });
      }
    }
    
    // Week 4-8: Establishing routines
    if (currentWeek >= 4 && currentWeek <= 8) {
      if (!hasTask(["tummy time", "tummy"])) {
        suggestions.push({
          title: "Start regular tummy time",
          priority: "medium",
          reason: "Builds neck and core strength",
        });
      }
      if (!hasTask(["postpartum", "checkup", "6 week", "ob"])) {
        suggestions.push({
          title: "Schedule postpartum checkup",
          priority: "high",
          reason: "Typically at 6 weeks postpartum",
        });
      }
    }
    
    // Week 6-12: Looking ahead
    if (currentWeek >= 6) {
      if (!hasTask(["childcare", "daycare", "nanny", "care"])) {
        suggestions.push({
          title: "Research childcare options",
          priority: "medium",
          reason: "Waitlists can be long",
        });
      }
      if (!hasTask(["photos", "newborn photos", "photography"])) {
        suggestions.push({
          title: "Schedule newborn photos",
          priority: "low",
          reason: "Best in first 2 weeks, but still lovely later",
        });
      }
    }
    
    if (currentWeek >= 8) {
      if (!hasTask(["vaccine", "vaccination", "immunization", "shots"])) {
        suggestions.push({
          title: "Check baby's vaccination schedule",
          priority: "medium",
          reason: "2-month vaccines coming up",
        });
      }
    }

    // Sort and return
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return suggestions
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, 3);
  }

  // ========== FIRST TRIMESTER (Weeks 1-13) ==========
  if (currentWeek <= 13) {
    if (currentWeek >= 6 && !hasTask(["registry", "browse", "research", "babylist", "amazon"])) {
      suggestions.push({
        title: "Start browsing registry ideas",
        priority: "medium",
        reason: "No pressure — just get inspired early",
      });
    }
    if (!hasTask(["insurance", "coverage", "maternity", "benefits"])) {
      suggestions.push({
        title: "Review insurance and maternity benefits",
        priority: "medium",
        reason: "Good to understand coverage early",
      });
    }
    if (!hasTask(["budget", "finances", "savings", "baby fund"])) {
      suggestions.push({
        title: "Start a baby savings fund",
        priority: "low",
        reason: "Even small amounts add up",
      });
    }
    if (!hasTask(["announce", "announcement", "tell", "share news"])) {
      suggestions.push({
        title: "Plan pregnancy announcement",
        priority: "low",
        reason: "When you're ready to share the news",
      });
    }
  }

  // ========== SECOND TRIMESTER (Weeks 14-27) ==========
  else if (currentWeek <= 27) {
    // Registry is key in second trimester!
    if (!hasTask(["registry", "create", "babylist", "amazon"])) {
      suggestions.push({
        title: "Create baby registry",
        priority: "high",
        reason: currentWeek < 20 
          ? "Perfect time to start — gives family time to shop"
          : "Baby showers often happen soon!",
      });
    }
    if (currentWeek >= 16 && !hasTask(["nursery", "theme", "room", "decor"])) {
      suggestions.push({
        title: "Start planning nursery",
        priority: "medium",
        reason: "Fun to do while energy is good!",
      });
    }
    if (currentWeek >= 20 && !hasTask(["childbirth", "class", "birthing", "lamaze", "parenting"])) {
      suggestions.push({
        title: "Research childbirth classes",
        priority: "medium",
        reason: "Classes fill up — good to look early",
      });
    }
    if (currentWeek >= 20 && !hasTask(["name", "baby name"])) {
      suggestions.push({
        title: "Discuss baby names",
        priority: "low",
        reason: "A fun one to work on together",
      });
    }
    if (currentWeek >= 24 && !hasTask(["tour", "hospital", "birth center"])) {
      suggestions.push({
        title: "Tour birthing facility",
        priority: "medium",
        reason: "Good to know the space beforehand",
      });
    }
    if (currentWeek >= 20 && !hasTask(["car seat", "carseat"])) {
      suggestions.push({
        title: "Research car seats",
        priority: "low",
        reason: "Many options — start comparing early",
      });
    }
    if (!hasTask(["photo", "maternity", "bump"])) {
      suggestions.push({
        title: "Schedule maternity photos",
        priority: "low",
        reason: "Best around weeks 28-34",
      });
    }
  }

  // ========== THIRD TRIMESTER (Weeks 28-40) ==========
  else {
    if (!hasTask(["hospital bag", "pack", "go bag"])) {
      suggestions.push({
        title: "Pack hospital bag",
        priority: currentWeek >= 36 ? "high" : "medium",
        reason: currentWeek >= 36 
          ? "Baby could come anytime now!"
          : "Good to have ready by week 36",
      });
    }
    if (!hasTask(["car seat", "install"])) {
      suggestions.push({
        title: "Install car seat",
        priority: currentWeek >= 36 ? "high" : "medium",
        reason: "Required to bring baby home",
      });
    }
    if (!hasTask(["pediatrician", "baby doctor", "find doctor"])) {
      suggestions.push({
        title: "Research pediatricians",
        priority: "high",
        reason: "Baby will need a checkup within days",
      });
    }
    if (currentWeek >= 32 && !hasTask(["nursery", "finish", "set up", "ready", "assemble"])) {
      suggestions.push({
        title: "Finish nursery setup",
        priority: "medium",
        reason: "Nice to have done before baby arrives",
      });
    }
    if (!hasTask(["pre-register", "hospital", "paperwork"])) {
      suggestions.push({
        title: "Pre-register at hospital",
        priority: "medium",
        reason: "Less paperwork during labor",
      });
    }
    if (currentWeek >= 34 && !hasTask(["wash", "baby clothes", "laundry"])) {
      suggestions.push({
        title: "Wash baby clothes",
        priority: "low",
        reason: "Use gentle, fragrance-free detergent",
      });
    }
    if (currentWeek >= 35 && !hasTask(["freezer", "meal", "prep", "food"])) {
      suggestions.push({
        title: "Prep freezer meals",
        priority: "low",
        reason: "You'll thank yourselves later!",
      });
    }
    if (!hasTask(["birth plan", "preferences"])) {
      suggestions.push({
        title: "Discuss birth preferences together",
        priority: "medium",
        reason: "Good to be on the same page",
      });
    }
    if (currentWeek >= 36 && !hasTask(["contact", "emergency", "phone", "numbers"])) {
      suggestions.push({
        title: "Gather emergency contacts",
        priority: "low",
        reason: "Have key numbers ready to go",
      });
    }
  }

  // Sort by priority and return top suggestions
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return suggestions
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 3);
}

// Sample suggestions for free users (always visible, shows value of premium)
function getSampleSuggestions(currentWeek: number, appMode: "pregnancy" | "infancy" = "pregnancy"): TaskSuggestion[] {
  // Infancy mode samples
  if (appMode === "infancy") {
    if (currentWeek <= 2) {
      return [
        { title: "Schedule first pediatrician visit", priority: "high", reason: "Usually needed within 3-5 days" },
        { title: "File for birth certificate", priority: "high", reason: "Start the paperwork early" },
      ];
    } else if (currentWeek <= 6) {
      return [
        { title: "Add baby to health insurance", priority: "high", reason: "Usually 30-day deadline" },
        { title: "Schedule postpartum checkup", priority: "medium", reason: "Typically at 6 weeks" },
      ];
    } else {
      return [
        { title: "Research childcare options", priority: "medium", reason: "Waitlists can be long" },
        { title: "Check vaccination schedule", priority: "medium", reason: "2-month vaccines coming up" },
      ];
    }
  }

  // Pregnancy mode samples (original)
  if (currentWeek < 14) {
    return [
      { title: "Schedule first prenatal visit", priority: "high", reason: "Important for early care" },
      { title: "Start prenatal vitamins", priority: "high", reason: "Key for baby's development" },
    ];
  } else if (currentWeek < 28) {
    return [
      { title: "Research childbirth classes", priority: "medium", reason: "Classes fill up — good to look early" },
      { title: "Create baby registry", priority: "medium", reason: "Gives family time to shop" },
    ];
  } else {
    return [
      { title: "Pack hospital bag", priority: "high", reason: "Baby could come anytime!" },
      { title: "Install car seat", priority: "high", reason: "Required to bring baby home" },
    ];
  }
}

export function SharedTasksCard({ 
  momUserId, 
  trimester, 
  currentWeek, 
  isPartnerView = false, 
  showSuggestions = true, 
  isPaid = false, 
  appMode = "pregnancy"
}: SharedTasksCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<SharedTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [tableExists, setTableExists] = useState(true);
  
  // Feeding & Nap hooks for infancy mode
  const createFeeding = useCreateFeeding();
  const createNap = useCreateNap();
  const { data: lastFeeding } = useLastFeeding();
  const { data: lastNap } = useLastNap();
  const { data: feedingInsights } = useFeedingInsights();
  
  // UI state for multi-step selections
  type QuickLogStep = null | "breast-side" | "bottle-type" | "nap-duration";
  const [quickLogStep, setQuickLogStep] = useState<QuickLogStep>(null);
  const [selectedNapDuration, setSelectedNapDuration] = useState<number>(30);
  
  // Quick log handlers
  async function handleLogFeeding(type: FeedingType, side?: BreastSide) {
    try {
      await createFeeding.mutateAsync({ type, side, fed_at: new Date() });
      const sideText = side ? ` (${getSideLabel(side)})` : "";
      toast({
        title: "Feeding logged",
        description: `${getFeedingEmoji(type)} ${type}${sideText}`,
      });
      setQuickLogStep(null);
    } catch (err) {
      console.error("Failed to log feeding:", err);
      toast({
        title: "Couldn't save",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }
  
  async function handleLogNap(duration: number) {
    try {
      await createNap.mutateAsync({ duration_minutes: duration });
      toast({
        title: "Nap logged",
        description: `😴 ${duration} min nap recorded`,
      });
      setQuickLogStep(null);
      setSelectedNapDuration(30);
    } catch (err) {
      console.error("Failed to log nap:", err);
      toast({
        title: "Couldn't save",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }
  
  const isLoggingBusy = createFeeding.isPending || createNap.isPending;

  // Get smart suggestions based on week and existing tasks
  // For free users: always show sample suggestions (for locked preview)
  // For paid users: respect the showSuggestions setting and filter existing
  const smartSuggestions = useMemo(
    () => {
      // For free users, always show sample suggestions (unfiltered) so they see the value
      if (!isPaid) {
        return getSampleSuggestions(currentWeek, appMode);
      }
      // For paid users, respect the toggle setting and filter out existing tasks
      return showSuggestions ? getSmartSuggestions(currentWeek, tasks, appMode) : [];
    },
    [currentWeek, tasks, showSuggestions, isPaid, appMode]
  );

  // Fetch tasks
  useEffect(() => {
    async function loadTasks() {
      if (!momUserId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("shared_tasks")
          .select("id, title, completed, completed_by, created_by")
          .eq("mom_user_id", momUserId)
          .order("created_at", { ascending: true });

        if (error) {
          // Table might not exist yet - hide component silently
          console.error("Failed to load tasks:", error);
          setTableExists(false);
          setTasks([]);
        } else {
          setTasks(data || []);
        }
      } catch (err) {
        console.error("Error loading tasks:", err);
        setTableExists(false);
        setTasks([]);
      }
      setIsLoading(false);
    }

    loadTasks();
  }, [momUserId]);

  // Add task
  async function handleAddTask() {
    if (!newTaskTitle.trim() || !user || !momUserId || !tableExists) return;

    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from("shared_tasks")
        .insert({
          mom_user_id: momUserId,
          title: newTaskTitle.trim(),
          created_by: user.id,
        })
        .select("id, title, completed, completed_by, created_by")
        .single();

      if (error) {
        console.error("Failed to add task:", error);
      } else if (data) {
        setTasks((prev) => [...prev, data]);
        setNewTaskTitle("");
      }
    } catch (err) {
      console.error("Error adding task:", err);
    }
    setIsAdding(false);
  }

  // Toggle task completion
  async function handleToggleTask(taskId: string, completed: boolean) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("shared_tasks")
        .update({
          completed,
          completed_by: completed ? user.id : null,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", taskId);

      if (error) {
        console.error("Failed to update task:", error);
      } else {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, completed, completed_by: completed ? user.id : null }
              : t
          )
        );
      }
    } catch (err) {
      console.error("Error updating task:", err);
    }
  }

  // Delete task
  async function handleDeleteTask(taskId: string) {
    try {
      const { error } = await supabase
        .from("shared_tasks")
        .delete()
        .eq("id", taskId);

      if (error) {
        console.error("Failed to delete task:", error);
      } else {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  }

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  // Add a suggested task
  async function handleAddSuggestion(title: string) {
    if (!user || !momUserId || !tableExists) return;

    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from("shared_tasks")
        .insert({
          mom_user_id: momUserId,
          title: title,
          created_by: user.id,
        })
        .select("id, title, completed, completed_by, created_by")
        .single();

      if (error) {
        console.error("Failed to add task:", error);
      } else if (data) {
        setTasks((prev) => [...prev, data]);
      }
    } catch (err) {
      console.error("Error adding task:", err);
    }
    setIsAdding(false);
  }

  // Don't render if table doesn't exist - prevents crashes
  if (!tableExists || isLoading) {
    if (isLoading) {
      return (
        <section className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="text-sm text-muted-foreground text-center">
            Loading tasks...
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <ListTodo className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-medium">Shared To-Do List</h2>
            <p className="text-xs text-muted-foreground">
              {isPartnerView ? "Tasks you can work on together" : "Collaborate with your partner"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Quick Actions for Infancy Mode */}
        {appMode === "infancy" && (
          <div className="mb-4 pb-4 border-b border-border">
            {/* Today's Summary */}
            {feedingInsights && (feedingInsights.todayFeedingCount > 0 || feedingInsights.todayNapCount > 0) && (
              <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs font-medium text-primary mb-2">Today's Summary</p>
                <div className="space-y-2">
                  {/* Feedings row */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <Baby className="w-4 h-4 text-pink-500" />
                      <span className="font-medium">{feedingInsights.todayFeedingCount}</span>
                      <span className="text-muted-foreground">feedings</span>
                    </div>
                    {lastFeeding && (
                      <span className="text-xs text-muted-foreground">
                        Last: {formatTimeSinceFeeding(lastFeeding.fed_at)}
                      </span>
                    )}
                  </div>
                  {/* Naps row */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <Moon className="w-4 h-4 text-indigo-500" />
                      <span className="font-medium">
                        {feedingInsights.todayTotalNapMinutes > 0 
                          ? formatMinutesToReadable(feedingInsights.todayTotalNapMinutes)
                          : "0m"
                        }
                      </span>
                      <span className="text-muted-foreground">naps</span>
                    </div>
                    {lastNap && (
                      <span className="text-xs text-muted-foreground">
                        Last: {formatTimeSinceNap(lastNap.started_at)}
                      </span>
                    )}
                  </div>
                </div>
                {/* Patterns */}
                {feedingInsights.avgTimeBetweenFeedings && (
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-primary/10">
                    {feedingInsights.feedingPatternText}
                  </p>
                )}
                {/* Next feeding suggestion */}
                {feedingInsights.suggestedNextFeedingIn !== null && feedingInsights.suggestedNextFeedingIn <= 30 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {feedingInsights.suggestedNextFeedingIn <= 0 
                      ? "Feeding may be due soon"
                      : `Next feeding in ~${feedingInsights.suggestedNextFeedingIn}m`
                    }
                  </p>
                )}
              </div>
            )}

            <p className="text-xs font-medium text-muted-foreground mb-3">Quick Log</p>
            
            {quickLogStep === null ? (
              /* Main buttons */
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-10"
                    onClick={() => setQuickLogStep("breast-side")}
                    disabled={isLoggingBusy}
                  >
                    <Baby className="w-4 h-4 mr-1.5 text-pink-500" />
                    Breast
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-10"
                    onClick={() => setQuickLogStep("bottle-type")}
                    disabled={isLoggingBusy}
                  >
                    <Milk className="w-4 h-4 mr-1.5 text-blue-500" />
                    Bottle
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-10 justify-center"
                  onClick={() => setQuickLogStep("nap-duration")}
                  disabled={isLoggingBusy}
                >
                  <Moon className="w-4 h-4 mr-2 text-indigo-500" />
                  Log Nap
                </Button>
              </div>
            ) : quickLogStep === "breast-side" ? (
              /* Breast side selection */
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickLogStep(null)}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={isLoggingBusy}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-muted-foreground">Which side?</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-10"
                    onClick={() => handleLogFeeding("breast", "left")}
                    disabled={isLoggingBusy}
                  >
                    Left
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-10"
                    onClick={() => handleLogFeeding("breast", "right")}
                    disabled={isLoggingBusy}
                  >
                    Right
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-10"
                    onClick={() => handleLogFeeding("breast", "both")}
                    disabled={isLoggingBusy}
                  >
                    Both
                  </Button>
                </div>
              </div>
            ) : quickLogStep === "bottle-type" ? (
              /* Bottle type selection - formula or breast milk */
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickLogStep(null)}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={isLoggingBusy}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-muted-foreground">What's in the bottle?</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-10"
                    onClick={() => handleLogFeeding("bottle")}
                    disabled={isLoggingBusy}
                  >
                    <Milk className="w-4 h-4 mr-1.5 text-blue-500" />
                    Breast Milk
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-10"
                    onClick={() => handleLogFeeding("formula")}
                    disabled={isLoggingBusy}
                  >
                    <FlaskConical className="w-4 h-4 mr-1.5 text-purple-500" />
                    Formula
                  </Button>
                </div>
              </div>
            ) : quickLogStep === "nap-duration" ? (
              /* Nap duration selection */
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickLogStep(null)}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={isLoggingBusy}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-muted-foreground">How long was the nap?</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[15, 30, 45, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setSelectedNapDuration(mins)}
                      className={cn(
                        "px-3 py-2 rounded-md text-sm border transition-colors",
                        selectedNapDuration === mins
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-muted"
                      )}
                      disabled={isLoggingBusy}
                    >
                      {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="w-full h-10"
                  onClick={() => handleLogNap(selectedNapDuration)}
                  disabled={isLoggingBusy}
                >
                  <Moon className="w-4 h-4 mr-2" />
                  Log {selectedNapDuration < 60 ? `${selectedNapDuration}m` : `${selectedNapDuration / 60}h`} Nap
                </Button>
              </div>
            ) : null}
          </div>
        )}

        <div className="space-y-4">
          {/* Add task input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              className="h-10 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim() || isAdding}
              className="shrink-0 h-10 w-10 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Task list */}
          {tasks.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  No tasks yet. Add your first shared task above.
                </p>
              </div>
              
              {/* Smart suggestions when no tasks - Premium feature */}
              {smartSuggestions.length > 0 && (
                <PremiumLock 
                  isPaid={isPaid} 
                  message="Suggestions based on pregnancy progress"
                  showBadge={true}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Suggested for week {currentWeek}
                    </div>
                    {smartSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleAddSuggestion(suggestion.title)}
                        disabled={isAdding}
                        className="w-full text-left p-3 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                            suggestion.priority === "high" 
                              ? "border-amber-400 group-hover:border-amber-500" 
                              : "border-border group-hover:border-primary/50"
                          )}>
                            <Plus className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium group-hover:text-primary transition-colors">
                              {suggestion.title}
                            </p>
                            {suggestion.reason && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {suggestion.reason}
                              </p>
                            )}
                          </div>
                          {suggestion.priority === "high" && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Recommended
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </PremiumLock>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {/* Incomplete tasks */}
              {incompleteTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 group transition-colors"
                >
                  <button
                    onClick={() => handleToggleTask(task.id, true)}
                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Circle className="w-5 h-5" />
                  </button>
                  <span className="flex-1 text-sm">{task.title}</span>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Completed tasks */}
              {completedTasks.length > 0 && (
                <div className="pt-3 mt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2 px-3">
                    Completed ({completedTasks.length})
                  </p>
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 group transition-colors"
                    >
                      <button
                        onClick={() => handleToggleTask(task.id, false)}
                        className="shrink-0 text-primary"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <span className="flex-1 text-sm text-muted-foreground line-through">
                        {task.title}
                      </span>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Smart suggestions when there are tasks - Premium feature */}
              {smartSuggestions.length > 0 && (
                <PremiumLock 
                  isPaid={isPaid} 
                  message="Suggestions based on pregnancy progress"
                  showBadge={true}
                >
                  <div className="pt-4 mt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2 px-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Suggestions for week {currentWeek}
                    </div>
                    <div className="space-y-1">
                      {smartSuggestions.slice(0, 2).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleAddSuggestion(suggestion.title)}
                          disabled={isAdding}
                          className="w-full text-left p-2.5 rounded-lg hover:bg-muted/50 transition-all group flex items-center gap-3"
                        >
                          <div className="w-5 h-5 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center shrink-0 group-hover:border-primary/50">
                            <Plus className="w-3 h-3 text-muted-foreground/60 group-hover:text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                              {suggestion.title}
                            </span>
                          </div>
                          {suggestion.priority === "high" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100/50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                              Recommended
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </PremiumLock>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}