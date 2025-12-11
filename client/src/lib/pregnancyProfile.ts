import { supabase } from "@/lib/supabase";

// Load due date for a given user from Supabase
export async function fetchDueDateForUser(
  userId: string
): Promise<Date | undefined> {
  const { data, error } = await supabase
    .from("pregnancy_profiles")
    .select("due_date")
    .eq("user_id", userId)
    .maybeSingle(); // null if no row yet

  if (error) {
    console.error("Error fetching pregnancy profile", error);
    return undefined;
  }

  if (!data?.due_date) return undefined;

  const parsed = new Date(data.due_date as string);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

// Save or update due date for a user
export async function saveDueDateForUser(
  userId: string,
  dueDate: Date | undefined
) {
  const payload = {
    user_id: userId,
    // Supabase "date" column wants YYYY-MM-DD
    due_date: dueDate ? dueDate.toISOString().slice(0, 10) : null,
  };

  const { error } = await supabase
    .from("pregnancy_profiles")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("Error saving pregnancy profile", error);
  }
}
