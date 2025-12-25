import { useMemo, useState } from "react";
import { Layout } from "@/components/layout";
import { usePregnancyState } from "@/hooks/usePregnancyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  useAppointments,
  useCreateAppointment,
  useDeleteAppointment,
  Appointment,
} from "@/lib/appointments";
import { AppointmentCard } from "@/components/appointment-card";

export default function AppointmentsPage() {
  const { dueDate, setDueDate } = usePregnancyState();
  const { user } = useAuth();

  const { data, isLoading, error } = useAppointments({ enabled: !!user });
  const createAppt = useCreateAppointment();
  const deleteAppt = useDeleteAppointment();

  const [title, setTitle] = useState("");
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const sorted = useMemo(() => {
    return (data ?? []).slice().sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }, [data]);

  const upcomingAndPast = useMemo(() => {
    const now = new Date().toISOString();
    const upcoming: Appointment[] = [];
    const past: Appointment[] = [];

    for (const a of sorted) {
      if (a.starts_at >= now) upcoming.push(a);
      else past.push(a);
    }

    // past: most recent first
    past.sort((a, b) => b.starts_at.localeCompare(a.starts_at));

    return { upcoming, past };
  }, [sorted]);

  async function handleCreate() {
    const t = title.trim();
    if (!t) return;

    if (!startsAtLocal) {
      alert("Please choose a date & time.");
      return;
    }

    // datetime-local -> local Date -> ISO UTC
    const iso = new Date(startsAtLocal).toISOString();

    await createAppt.mutateAsync({
      title: t,
      starts_at: iso,
      location,
      notes,
    });

    setTitle("");
    setStartsAtLocal("");
    setLocation("");
    setNotes("");
  }

  function handleDelete(id: string) {
    deleteAppt.mutate(id);
  }

  return (
    <Layout dueDate={dueDate} setDueDate={setDueDate}>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Appointments</h1>
            <p className="text-sm text-muted-foreground">
              Add upcoming visits, scans, checkups—anything you want to remember.
            </p>
          </div>
        </div>

        {/* Create form */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., OB Checkup"
                disabled={createAppt.isPending}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Date & time
              </label>
              <Input
                type="datetime-local"
                value={startsAtLocal}
                onChange={(e) => setStartsAtLocal(e.target.value)}
                disabled={createAppt.isPending}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Location (optional)
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., NYU Langone"
                disabled={createAppt.isPending}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Notes (optional)
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., bring insurance card"
                disabled={createAppt.isPending}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleCreate} disabled={createAppt.isPending || !user}>
              {createAppt.isPending ? "Saving..." : "Add appointment"}
            </Button>

            {!user && (
              <p className="text-sm text-muted-foreground">
                Log in to add appointments.
              </p>
            )}

            {createAppt.isError && (
              <p className="text-sm text-destructive">
                {(createAppt.error as any)?.message ?? "Failed to create appointment."}
              </p>
            )}
          </div>
        </div>

        {/* Lists */}
        <div className="space-y-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading appointments…</p>
          ) : error ? (
            <p className="text-sm text-destructive">
              {(error as any)?.message ?? "Failed to load appointments."}
            </p>
          ) : (
            <>
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
                  Upcoming
                </h2>

                {upcomingAndPast.upcoming.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      No upcoming appointments yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingAndPast.upcoming.map((a) => (
                      <AppointmentCard
                        key={a.id}
                        appointment={a}
                        onDelete={handleDelete}
                        deleting={deleteAppt.isPending}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
                  Past
                </h2>

                {upcomingAndPast.past.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      Past appointments will show here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingAndPast.past.map((a) => (
                      <AppointmentCard
                        key={a.id}
                        appointment={a}
                        onDelete={handleDelete}
                        deleting={deleteAppt.isPending}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
