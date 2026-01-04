// client/src/config/registryLinks.ts
//
// Centralized configuration for external registry platform links.
// Update referral URLs here or via environment variables.
//
// Environment variables (optional, override defaults):
// - VITE_REGISTRY_BABYLIST_URL
// - VITE_REGISTRY_AMAZON_URL

export interface RegistryPlatform {
  id: string;
  name: string;
  description: string;
  url: string | null;
  enabled: boolean;
}

// Get URL from env var or use default, return null if neither exists
function getRegistryUrl(envKey: string, fallback: string | null = null): string | null {
  const envValue = import.meta.env[envKey];
  if (envValue && typeof envValue === "string" && envValue.trim().length > 0) {
    return envValue.trim();
  }
  return fallback;
}

// Platform configurations
// Add new platforms here as needed
export const REGISTRY_PLATFORMS: RegistryPlatform[] = [
  {
    id: "babylist",
    name: "Babylist",
    description: "Opens on Babylist",
    url: getRegistryUrl(
      "VITE_REGISTRY_BABYLIST_URL",
      "https://www.babylist.com/start"
    ),
    enabled: true,
  },
  {
    id: "amazon",
    name: "Amazon",
    description: "Opens on Amazon",
    url: getRegistryUrl(
      "VITE_REGISTRY_AMAZON_URL",
      "https://www.amazon.com/baby-reg/homepage"
    ),
    enabled: true,
  },
  {
    id: "target",
    name: "Target",
    description: "Opens on Target",
    url: getRegistryUrl(
      "VITE_REGISTRY_TARGET_URL",
      "https://www.target.com/gift-registry/create-baby-registry"
    ),
    enabled: true,
  },
  {
    id: "walmart",
    name: "Walmart",
    description: "Opens on Walmart",
    url: getRegistryUrl(
      "VITE_REGISTRY_WALMART_URL",
      "https://www.walmart.com/registry/baby"
    ),
    enabled: true,
  },
];

// Get a single platform by ID
export function getPlatform(id: string): RegistryPlatform | undefined {
  return REGISTRY_PLATFORMS.find((p) => p.id === id);
}

// Get all enabled platforms with valid URLs
export function getEnabledPlatforms(): RegistryPlatform[] {
  return REGISTRY_PLATFORMS.filter((p) => p.enabled && p.url !== null);
}

// Safe link opener
export function openExternalLink(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

// Auto-detect platform from a registry URL
export function detectPlatformFromUrl(url: string): string {
  const urlLower = url.toLowerCase();
  if (urlLower.includes("babylist.com")) return "babylist";
  if (urlLower.includes("amazon.com") || urlLower.includes("amazon.ca")) return "amazon";
  if (urlLower.includes("target.com")) return "target";
  if (urlLower.includes("buybuybaby.com")) return "buybuybaby";
  if (urlLower.includes("walmart.com")) return "walmart";
  if (urlLower.includes("potterybarnkids.com")) return "potterybarn";
  return "other";
}

// Get display name for a platform ID
export function getPlatformDisplayName(platformId: string): string {
  const platform = getPlatform(platformId);
  if (platform) return platform.name;
  
  // Capitalize first letter for unknown platforms
  return platformId.charAt(0).toUpperCase() + platformId.slice(1);
}