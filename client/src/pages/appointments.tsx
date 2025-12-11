import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { usePregnancyState } from "@/hooks/usePregnancyState";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Clock, Trash2, Plus } from "lucide-react";

type Appointment = {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
  notes: string | null;
};

export default function Appointments() {
  const { dueDate, setDueDate } = usePregnancyState();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // form state
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  // load all appointments for this user
  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from("pregnancy_appointments")
        .select("id, title, starts_at, location, notes")
        .order("starts_at", { ascending: true });

      setLoading(false);

      if (error) {
        console.error(error);
        setErrorMsg("Couldn’t load your appointments. Please try again.");
        return;
      }

      setAppointments((data || []) as Appointment[]);
    }

    load();
  }, [user]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!title.trim() || !startsAt) {
      setErrorMsg("Please add a title and date/time.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from("pregnancy_appointments")
      .insert([
        {
          user_id: user.id,
          title: title.trim(),
          starts_at: new Date(startsAt).toISOString(),
          location: location.trim() || null,
          notes: notes.trim() || null,
        },
      ])
      .select("id, title, starts_at, location, notes")
      .single();

    setSaving(false);

    if (error) {
      console.error(error);
      setErrorMsg("Couldn’t save this appointment. Please try again.");
      return;
    }

    if (data) {
      setAppointments((prev) =>
        [...prev, data as Appointment].sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
        )
      );
    }

    // reset form
    setTitle("");
    setStartsAt("");
    setLocation("");
    setNotes("");
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this appointment?")) return;

    const { error } = await supabase
      .from("pregnancy_appointments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setErrorMsg("Couldn’t delete that appointment.");
      return;
    }

    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }

  const upcoming = appointments.filter(
    (a) => new Date(a.starts_at).getTime() >= Date.now()
  );
  const past = appointments.filter(
    (a) => new Date(a.starts_at).getTime() < Date.now()
  );

  return (
    <Layout dueDate={dueDate} setDueDate={setDueDate}>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* header */}
        <section>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
            Appointments
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Keep track of upcoming prenatal visits, ultrasounds, and anything
            else you don’t want to miss.
          </p>
        </section>

        {/* main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* list column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-sm tracking-wide uppercase text-muted-foreground">
                Upcoming
              </h2>
            </div>

            <div className="space-y-3">
              {loading && (
                <p className="text-sm text-muted-foreground">
                  Loading your appointments…
                </p>
              )}

              {!loading && upcoming.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No upcoming appointments yet. When you add one, it will also
                  appear under <span className="font-medium">Current Progress</span> on
                  your Today page.
                </p>
              )}

              {upcoming.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="mt-1">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">
                        {appt.title}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(appt.starts_at), "EEE, MMM d • p")}
                      </span>
                    </div>

                    {appt.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {appt.location}
                      </p>
                    )}

                    {appt.notes && (
                      <p className="text-xs text-muted-foreground">
                        {appt.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(appt.id)}
                    className="ml-2 text-xs text-muted-foreground hover:text-destructive"
                    title="Delete appointment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {past.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border/60">
                <h2 className="font-semibold text-sm tracking-wide uppercase text-muted-foreground">
                  Past
                </h2>
                <div className="space-y-2">
                  {past.map((appt) => (
                    <div
                      key={appt.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3"
                    >
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-sm">{appt.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(appt.starts_at), "EEE, MMM d • p")}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(appt.id)}
                        className="text-xs text-muted-foreground hover:text-destructive"
                        title="Delete appointment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* form column */}
          <div className="space-y-4 lg:sticky lg:top-8 h-fit">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm tracking-wide uppercase text-muted-foreground">
                Add appointment
              </h2>
            </div>

            <form
              onSubmit={handleAdd}
              className="space-y-3 rounded-2xl border border-border bg-card p-4"
            >
              {errorMsg && (
                <p className="text-xs text-destructive mb-1">{errorMsg}</p>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Anatomy scan, OB visit…"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Date & time
                </label>
                <Input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Location (optional)
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Hospital, clinic, virtual, etc."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Notes (optional)
                </label>
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Questions to ask, things to remember…"
                />
              </div>

              <Button
                type="submit"
                className={cn("w-full mt-2")}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save appointment"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
