import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.zelkz.bloom",
  appName: "Bloom",
  webDir: "dist/public",

  ios: {
    contentInset: "automatic",
    scheme: "com.zelkz.bloom",
  },

  android: {
    allowMixedContent: false,
  },

  plugins: {
    App: {
      allowExternalUrls: ["com.zelkz.bloom://"],
    },
  },
};

export default config;