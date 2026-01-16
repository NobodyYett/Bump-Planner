import { createRoot } from "react-dom/client";
import { isSupabaseConfigured, missingEnvVars } from "./lib/supabase";
import { ConfigError } from "./components/ConfigError";
import App from "./App";
import { ThemeProvider } from "./theme/theme-provider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    {isSupabaseConfigured ? (
      <App />
    ) : (
      <ConfigError missingVars={missingEnvVars} />
    )}
  </ThemeProvider>
);