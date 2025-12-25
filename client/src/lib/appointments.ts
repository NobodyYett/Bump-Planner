import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Appointment {
  id: string;
  user_id: string;
  title: string;
  starts_at: string; // ISO string (UTC)
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

async function getUserIdOrThrow(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Not logged in");
  return data.user.id;
}

// ---- Queries ----

async function fetchAppointmentsForUser(userId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("pregnancy_appointments")
    .select("*")
    .eq("user_id", userId)
    .order("starts_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Appointment[];
}

async function fetchNextAppointmentForUser(userId: string): Promise<Appointment | null> {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("pregnancy_appointments")
    .select("*")
    .eq("user_id", userId)
    .gte("starts_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // maybeSingle returns null when no row; PGRST116 can show up in some edge cases
  if (error && error.code !== "PGRST116") throw error;

  return (data ?? null) as Appointment | null;
}

type QueryOpts = {
  enabled?: boolean;
};

export function useAppointments(opts?: QueryOpts) {
  return useQuery({
    queryKey: ["appointments", "me"],
    enabled: opts?.enabled ?? true,
    queryFn: async () => {
      const userId = await getUserIdOrThrow();
      return fetchAppointmentsForUser(userId);
    },
  });
}

export function useNextAppointment(opts?: QueryOpts) {
  return useQuery({
    queryKey: ["next-appointment", "me"],
    enabled: opts?.enabled ?? true,
    queryFn: async () => {
      const userId = await getUserIdOrThrow();
      return fetchNextAppointmentForUser(userId);
    },
  });
}

// ---- Mutations ----

interface CreateAppointmentInput {
  title: string;
  starts_at: string; // ISO (UTC)
  location?: string;
  notes?: string;
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAppointmentInput) => {
      const userId = await getUserIdOrThrow();

      const title = input.title.trim();
      if (!title) throw new Error("Title is required");

      const location = input.location?.trim() || null;
      const notes = input.notes?.trim() || null;

      const { data, error } = await supabase
        .from("pregnancy_appointments")
        .insert({
          user_id: userId,
          title,
          starts_at: input.starts_at,
          location,
          notes,
        })
        .select("*")
        .single();

      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => {
      // invalidate both lists + next card
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["next-appointment"] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await getUserIdOrThrow();

      const { error } = await supabase
        .from("pregnancy_appointments")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["next-appointment"] });
    },
  });
}
