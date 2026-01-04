// client/src/lib/purchases.ts
//
// RevenueCat integration for Capacitor
// Native-only — web builds must not crash

import { Capacitor } from "@capacitor/core";

// ============================================
// Constants
// ============================================

export const ENTITLEMENT_ID = "premium";

// ============================================
// Types
// ============================================

export interface Package {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    priceString: string;
    price: number;
    currencyCode: string;
  };
}

export interface CustomerInfo {
  entitlements: {
    active: Record<string, {
      identifier: string;
      isActive: boolean;
      willRenew: boolean;
      expirationDate: string | null;
    }>;
  };
  activeSubscriptions: string[];
  originalAppUserId: string;
}

export interface Offering {
  identifier: string;
  availablePackages: Package[];
  monthly?: Package;
  annual?: Package;
  lifetime?: Package;
}

// ============================================
// Platform check
// ============================================

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function getPlatform(): "ios" | "android" | "web" {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") return "ios";
  if (platform === "android") return "android";
  return "web";
}

// ============================================
// RevenueCat SDK (lazy loaded for native only)
// ============================================

let Purchases: typeof import("@revenuecat/purchases-capacitor").Purchases | null = null;
let LOG_LEVEL: typeof import("@revenuecat/purchases-capacitor").LOG_LEVEL | null = null;

async function loadPurchasesSDK() {
  if (!isNativePlatform()) {
    return null;
  }
  
  if (!Purchases) {
    const module = await import("@revenuecat/purchases-capacitor");
    Purchases = module.Purchases;
    LOG_LEVEL = module.LOG_LEVEL;
  }
  
  return Purchases;
}

// ============================================
// Initialization
// ============================================

let isInitialized = false;

export async function initializePurchases(): Promise<boolean> {
  if (!isNativePlatform()) {
    console.log("[Purchases] Skipping init — not on native platform");
    return false;
  }

  if (isInitialized) {
    console.log("[Purchases] Already initialized");
    return true;
  }

  const SDK = await loadPurchasesSDK();
  if (!SDK) {
    console.error("[Purchases] Failed to load SDK");
    return false;
  }

  const platform = getPlatform();
  const apiKey = platform === "ios"
    ? import.meta.env.VITE_REVENUECAT_IOS_API_KEY
    : import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY;

  if (!apiKey) {
    console.error(`[Purchases] Missing API key for ${platform}`);
    return false;
  }

  try {
    // Enable debug logs in development
    if (import.meta.env.DEV && LOG_LEVEL) {
      await SDK.setLogLevel({ level: LOG_LEVEL.DEBUG });
    }

    await SDK.configure({
      apiKey,
    });

    isInitialized = true;
    console.log("[Purchases] Initialized successfully");
    return true;
  } catch (error) {
    console.error("[Purchases] Init failed:", error);
    return false;
  }
}

// ============================================
// User identification
// ============================================

export async function loginUser(userId: string): Promise<CustomerInfo | null> {
  if (!isNativePlatform()) return null;

  const SDK = await loadPurchasesSDK();
  if (!SDK) return null;

  try {
    const { customerInfo } = await SDK.logIn({ appUserID: userId });
    return customerInfo as CustomerInfo;
  } catch (error) {
    console.error("[Purchases] Login failed:", error);
    return null;
  }
}

export async function logoutUser(): Promise<CustomerInfo | null> {
  if (!isNativePlatform()) return null;

  const SDK = await loadPurchasesSDK();
  if (!SDK) return null;

  try {
    const { customerInfo } = await SDK.logOut();
    return customerInfo as CustomerInfo;
  } catch (error) {
    console.error("[Purchases] Logout failed:", error);
    return null;
  }
}

// ============================================
// Customer info & entitlements
// ============================================

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isNativePlatform()) return null;

  const SDK = await loadPurchasesSDK();
  if (!SDK) return null;

  try {
    const { customerInfo } = await SDK.getCustomerInfo();
    return customerInfo as CustomerInfo;
  } catch (error) {
    console.error("[Purchases] Get customer info failed:", error);
    return null;
  }
}

export function hasEntitlement(customerInfo: CustomerInfo | null, entitlementId: string = ENTITLEMENT_ID): boolean {
  if (!customerInfo) return false;
  
  const entitlement = customerInfo.entitlements?.active?.[entitlementId];
  return entitlement?.isActive === true;
}

// ============================================
// Offerings & packages
// ============================================

export async function getCurrentOffering(): Promise<Offering | null> {
  if (!isNativePlatform()) return null;

  const SDK = await loadPurchasesSDK();
  if (!SDK) return null;

  try {
    const { offerings } = await SDK.getOfferings();
    return offerings?.current as Offering | null;
  } catch (error) {
    console.error("[Purchases] Get offerings failed:", error);
    return null;
  }
}

// ============================================
// Purchases
// ============================================

export async function purchasePackage(pkg: Package): Promise<{
  success: boolean;
  customerInfo: CustomerInfo | null;
  error?: string;
}> {
  if (!isNativePlatform()) {
    return { success: false, customerInfo: null, error: "Not on native platform" };
  }

  const SDK = await loadPurchasesSDK();
  if (!SDK) {
    return { success: false, customerInfo: null, error: "SDK not loaded" };
  }

  try {
    const { customerInfo } = await SDK.purchasePackage({
      aPackage: pkg as any,
    });
    
    return {
      success: true,
      customerInfo: customerInfo as CustomerInfo,
    };
  } catch (error: any) {
    // User cancelled
    if (error?.code === "1" || error?.userCancelled) {
      return { success: false, customerInfo: null, error: "cancelled" };
    }
    
    console.error("[Purchases] Purchase failed:", error);
    return {
      success: false,
      customerInfo: null,
      error: error?.message || "Purchase failed",
    };
  }
}

// ============================================
// Restore purchases
// ============================================

export async function restorePurchases(): Promise<{
  success: boolean;
  customerInfo: CustomerInfo | null;
  error?: string;
}> {
  if (!isNativePlatform()) {
    return { success: false, customerInfo: null, error: "Not on native platform" };
  }

  const SDK = await loadPurchasesSDK();
  if (!SDK) {
    return { success: false, customerInfo: null, error: "SDK not loaded" };
  }

  try {
    const { customerInfo } = await SDK.restorePurchases();
    return {
      success: true,
      customerInfo: customerInfo as CustomerInfo,
    };
  } catch (error: any) {
    console.error("[Purchases] Restore failed:", error);
    return {
      success: false,
      customerInfo: null,
      error: error?.message || "Restore failed",
    };
  }
}

// ============================================
// Listener for customer info updates
// ============================================

export async function addCustomerInfoListener(
  callback: (customerInfo: CustomerInfo) => void
): Promise<(() => void) | null> {
  if (!isNativePlatform()) return null;

  const SDK = await loadPurchasesSDK();
  if (!SDK) return null;

  try {
    const listener = await SDK.addCustomerInfoUpdateListener((info) => {
      callback(info.customerInfo as CustomerInfo);
    });
    
    // Return cleanup function
    return () => {
      listener?.remove?.();
    };
  } catch (error) {
    console.error("[Purchases] Failed to add listener:", error);
    return null;
  }
}