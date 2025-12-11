import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>; // <--- Added this type
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Check current session on first load
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error("Error loading user", error);
        }
        setUser(data?.user ?? null);
        setLoading(false);
      });

    // Listen for login/logout events
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/login";
  };

  // <--- Added this function
  const deleteAccount = async () => {
  try {
    if (!user) throw new Error("No user");
    
    // Delete user data from all tables
    await supabase.from("pregnancy_logs").delete().eq("user_id", user.id);
    await supabase.from("pregnancy_appointments").delete().eq("user_id", user.id);
    await supabase.from("pregnancy_profiles").delete().eq("user_id", user.id);
    
    // Sign out
    await signOut();
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
};

  return (
    // <--- Added deleteAccount to the value object
    <AuthContext.Provider value={{ user, loading, signOut, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}