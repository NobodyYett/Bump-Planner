// client/src/components/daily-checkin.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Smile, Frown, Meh, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useCreatePregnancyLog,
  useTodayLogs,
} from "@/hooks/usePregnancyLogs";
import { format } from "date-fns";

const formSchema = z.object({
  mood: z.enum(["happy", "neutral", "sad"]),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
});

interface DailyCheckInProps {
  currentWeek: number;
}

export function DailyCheckIn({ currentWeek }: DailyCheckInProps) {
  const { toast } = useToast();
  const todayDate = format(new Date(), "yyyy-MM-dd");

  // 🔎 now returns *all* logs for today
  const {
    data: todayLogs = [],
    isLoading: checkingTodayLogs,
  } = useTodayLogs(todayDate);

  const createLogMutation = useCreatePregnancyLog();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mood: "happy",
      symptoms: "",
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createLogMutation.mutateAsync({
        date: todayDate,
        week: currentWeek,
        mood: values.mood,
        symptoms: values.symptoms || undefined,
        notes: values.notes || undefined,
      });

      toast({
        title: "Check-in saved!",
        description: "Thanks for tracking your day.",
      });

      form.reset();
      setShowForm(false);
    } catch (error) {
      toast({
        title: "Oops!",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save check-in",
        variant: "destructive",
      });
    }
  }

  // shared card styles (h-full keeps it same height as the left column)
  const cardClass =
    "h-full bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col";

  // ⏳ loading state
  if (checkingTodayLogs) {
    return (
      <div className={cardClass + " items-center justify-center"}>
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const hasAnyLogs = todayLogs.length > 0;
  const latestLog: any | null = hasAnyLogs ? todayLogs[todayLogs.length - 1] : null;

  // ✅ summary state when you already logged at least once
  if (hasAnyLogs && !showForm && latestLog) {
    const moodLabel =
      latestLog.mood === "happy"
        ? "great"
        : latestLog.mood === "neutral"
        ? "okay"
        : "not so good";

    return (
      <div className={cardClass + " justify-center text-center"}>
        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Smile className="w-6 h-6" />
        </div>

        <h3 className="font-serif text-xl font-medium mb-1">
          All caught up!
        </h3>

        <p className="text-sm text-muted-foreground mb-1">
          You’ve already logged {todayLogs.length === 1 ? "once" : `${todayLogs.length} times`} today —{" "}
          <span className="font-medium">feeling {moodLabel}</span>.
        </p>

        {latestLog.notes && (
          <p className="text-sm text-muted-foreground italic mb-4">
            “{latestLog.notes}”
          </p>
        )}

        <Button
          variant="outline"
          className="mt-2"
          onClick={() => setShowForm(true)}
        >
          Add another entry for today
        </Button>

        <p className="mt-2 text-[11px] text-muted-foreground">
          You can log morning, afternoon, and evening to capture your full day.
        </p>
      </div>
    );
  }

  // ✍️ default form (first entry of the day, or after tapping "Add another entry")
  return (
    <div className={cardClass}>
      <div className="mb-6">
        <h3 className="font-serif text-2xl font-semibold">Daily Check-in</h3>
        <p className="text-base text-muted-foreground mt-1">
          How are you feeling today?
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 flex-1 flex flex-col"
        >
          <FormField
            control={form.control}
            name="mood"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mood</FormLabel>
                <div className="flex gap-4">
                  {[
                    { value: "happy", icon: Smile, label: "Great" },
                    { value: "neutral", icon: Meh, label: "Okay" },
                    { value: "sad", icon: Frown, label: "Not good" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                        field.value === option.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      <option.icon className="w-6 h-6" />
                      <span className="text-xs font-medium">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="symptoms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Symptoms</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any symptoms today? (nausea, fatigue, cravings...)"
                    className="resize-none bg-background"
                    rows={2}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any other thoughts or notes for today?"
                    className="resize-none bg-background"
                    rows={2}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="mt-6">
            <Button
              type="submit"
              className="w-full"
              disabled={createLogMutation.isPending}
            >
              {createLogMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Check-in"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
