import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bumpplanner.app",
  appName: "Bump Planner",
  webDir: "dist/public",

  ios: {
    contentInset: "automatic",
    scheme: "com.bumpplanner.app",
  },

  android: {
    allowMixedContent: false,
  },

  plugins: {
    App: {
      allowExternalUrls: ["com.bumpplanner.app://"],
    },
  },
};

export default config;
