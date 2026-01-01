// client/src/main.tsx

import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./theme/theme-provider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);