// client/src/contexts/PremiumContext.tsx
//
// Single source of truth for premium subscription status
// Wraps RevenueCat and provides usePremium() hook

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  initializePurchases,
  getCustomerInfo,
  loginUser,
  logoutUser,
  hasEntitlement,
  addCustomerInfoListener,
  isNativePlatform,
  ENTITLEMENT_ID,
  type CustomerInfo,
} from "@/lib/purchases";

// ============================================
// Types
// ============================================

interface PremiumContextValue {
  /** User has active premium subscription */
  isPremium: boolean;
  /** Loading initial state */
  isLoading: boolean;
  /** Full customer info from RevenueCat */
  customerInfo: CustomerInfo | null;
  /** Manually refresh entitlement status */
  refreshEntitlement: () => Promise<void>;
  /** Whether we're on a native platform (can purchase) */
  canPurchase: boolean;
  /** Sync premium status to Supabase (for server-side checks) */
  syncPremiumToSupabase: (isPremium: boolean) => Promise<void>;
}

// ============================================
// Context
// ============================================

const PremiumContext = createContext<PremiumContextValue | null>(null);

// ============================================
// Provider
// ============================================

interface PremiumProviderProps {
  children: ReactNode;
}

export function PremiumProvider({ children }: PremiumProviderProps) {
  const { user } = useAuth();
  
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  const canPurchase = isNativePlatform();

  // Sync premium status to Supabase for server-side enforcement (ask-ivy limits)
  const syncPremiumToSupabase = useCallback(async (premium: boolean) => {
    if (!user?.id) {
      console.log("[Premium] Cannot sync - no user");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          is_premium: premium,
          premium_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

      if (error) {
        console.error("[Premium] Sync to Supabase failed:", error);
      } else {
        console.log("[Premium] Synced to Supabase: is_premium =", premium);
      }
    } catch (err) {
      console.error("[Premium] Sync error:", err);
    }
  }, [user?.id]);

  // Update premium status from customer info
  const updatePremiumStatus = useCallback((info: CustomerInfo | null) => {
    setCustomerInfo(info);
    const hasPremium = hasEntitlement(info, ENTITLEMENT_ID);
    setIsPremium(hasPremium);
    
    // Auto-sync to Supabase when premium status changes
    if (user?.id) {
      syncPremiumToSupabase(hasPremium);
    }
  }, [user?.id, syncPremiumToSupabase]);

  // Refresh entitlement from RevenueCat (native) or Supabase (web)
  const refreshEntitlement = useCallback(async () => {
    if (!canPurchase) {
      // Web: refresh from Supabase
      if (user?.id) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("is_premium")
            .eq("id", user.id)
            .single();
          
          setIsPremium(data?.is_premium === true);
        } catch (err) {
          console.log("[Premium] Web refresh failed");
        }
      }
      setIsLoading(false);
      return;
    }

    try {
      const info = await getCustomerInfo();
      updatePremiumStatus(info);
    } catch (error) {
      console.error("[Premium] Refresh failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [canPurchase, user?.id, updatePremiumStatus]);

  // Initialize RevenueCat on mount (native) or check Supabase (web)
  useEffect(() => {
    async function init() {
      if (!canPurchase) {
        // Web: Check Supabase for premium status (purchased on mobile)
        if (user?.id) {
          try {
            const { data } = await supabase
              .from("profiles")
              .select("is_premium")
              .eq("id", user.id)
              .single();
            
            if (data?.is_premium) {
              setIsPremium(true);
              console.log("[Premium] Web user has premium (from mobile purchase)");
            }
          } catch (err) {
            console.log("[Premium] Could not check web premium status");
          }
        }
        setIsLoading(false);
        setInitialized(true);
        return;
      }

      const success = await initializePurchases();
      if (success) {
        setInitialized(true);
      } else {
        setIsLoading(false);
      }
    }

    init();
  }, [canPurchase, user?.id]);

  // Login/logout user when auth changes
  useEffect(() => {
    async function syncUser() {
      if (!initialized || !canPurchase) return;

      setIsLoading(true);

      try {
        if (user?.id) {
          // Login to RevenueCat with user ID
          const info = await loginUser(user.id);
          updatePremiumStatus(info);
        } else {
          // Logout from RevenueCat
          const info = await logoutUser();
          updatePremiumStatus(info);
        }
      } catch (error) {
        console.error("[Premium] User sync failed:", error);
      } finally {
        setIsLoading(false);
      }
    }

    syncUser();
  }, [user?.id, initialized, canPurchase, updatePremiumStatus]);

  // Listen for customer info updates (e.g., subscription renewal, cancellation)
  useEffect(() => {
    if (!initialized || !canPurchase) return;

    let cleanup: (() => void) | null = null;

    async function setupListener() {
      cleanup = await addCustomerInfoListener((info) => {
        console.log("[Premium] Customer info updated");
        updatePremiumStatus(info);
      });
    }

    setupListener();

    return () => {
      cleanup?.();
    };
  }, [initialized, canPurchase, updatePremiumStatus]);

  const value: PremiumContextValue = {
    isPremium,
    isLoading,
    customerInfo,
    refreshEntitlement,
    canPurchase,
    syncPremiumToSupabase,
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function usePremium(): PremiumContextValue {
  const context = useContext(PremiumContext);
  
  if (!context) {
    throw new Error("usePremium must be used within a PremiumProvider");
  }
  
  return context;
}