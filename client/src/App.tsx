import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Timeline from "@/pages/timeline";
import Journal from "@/pages/journal";
import Login from "@/pages/login";
import Onboarding from "@/pages/onboarding";
import Appointments from "@/pages/appointments";
import Settings from "@/pages/settings"; // <--- Imported Settings Page

import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Simple auth gate that works with wouter
function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Checking your session...
      </div>
    );
  }

  if (!user) {
    // While redirecting, don't flash protected content
    return null;
  }

  return children;
}

function Router() {
  return (
    <Switch>
      {/* Public route */}
      <Route path="/login" component={Login} />

      {/* Protected routes */}
      <Route path="/onboarding">
        {() => (
          <RequireAuth>
            <Onboarding />
          </RequireAuth>
        )}
      </Route>

      <Route path="/appointments">
        {() => (
          <RequireAuth>
            <Appointments />
          </RequireAuth>
        )}
      </Route>

      <Route path="/timeline">
        {() => (
          <RequireAuth>
            <Timeline />
          </RequireAuth>
        )}
      </Route>

      <Route path="/journal">
        {() => (
          <RequireAuth>
            <Journal />
          </RequireAuth>
        )}
      </Route>

      {/* Added Settings Route */}
      <Route path="/settings">
        {() => (
          <RequireAuth>
            <Settings />
          </RequireAuth>
        )}
      </Route>

      <Route path="/">
        {() => (
          <RequireAuth>
            <Home />
          </RequireAuth>
        )}
      </Route>

      {/* Fallback */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

// Single App, all providers combined
export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}