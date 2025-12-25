import { Appointment } from "@/lib/appointments";
import { format } from "date-fns";
import { MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  appointment: Appointment;
  onDelete: (id: string) => void;
  deleting?: boolean;
};

export function AppointmentCard({ appointment, onDelete, deleting }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate">{appointment.title}</h3>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {format(new Date(appointment.starts_at), "EEE, MMM d • p")}
          </p>

          {appointment.location && (
            <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{appointment.location}</span>
            </p>
          )}

          {appointment.notes && (
            <p className="mt-2 text-sm text-muted-foreground">{appointment.notes}</p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(appointment.id)}
          disabled={!!deleting}
          aria-label="Delete appointment"
          className="shrink-0"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
