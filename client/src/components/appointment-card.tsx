import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

type NextAppt = {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
};

export function NextAppointmentCard() {
  const { user } = useAuth();
  const [nextAppt, setNextAppt] = useState<NextAppt | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function loadNextAppt() {
      setLoading(true);
      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from("pregnancy_appointments")
        .select("id, title, starts_at, location")
        .eq("user_id", user.id)
        .gte("starts_at", nowIso)
        .order("starts_at", { ascending: true })
        .limit(1);

      setLoading(false);

      if (error) {
        console.error("Error loading next appointment:", error);
        setNextAppt(null);
        return;
      }

      setNextAppt(data && data.length > 0 ? (data[0] as NextAppt) : null);
    }

    loadNextAppt();
  }, [user]);

  return (
    <div className="mt-6 pt-5 border-t border-border/70">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">
            Next appointment
          </h3>
        </div>

        <Link href="/appointments">
          <span className="text-xs text-primary hover:underline cursor-pointer">
            View calendar
          </span>
        </Link>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Checking your schedule…</p>
      ) : !nextAppt ? (
        <p className="text-xs text-muted-foreground">
          No upcoming appointments yet. Add one from the calendar.
        </p>
      ) : (
        <Link href="/appointments">
          <div className="mt-2 cursor-pointer rounded-xl border border-primary/40 bg-primary/10 px-3 py-3 text-sm text-primary hover:bg-primary/15 transition-colors">
            <div className="font-medium truncate">{nextAppt.title}</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-primary/80">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(nextAppt.starts_at), "EEE, MMM d • h:mm a")}
              </span>
              {nextAppt.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {nextAppt.location}
                </span>
              )}
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
