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

  // Update premium status from customer info
  const updatePremiumStatus = useCallback((info: CustomerInfo | null) => {
    setCustomerInfo(info);
    setIsPremium(hasEntitlement(info, ENTITLEMENT_ID));
  }, []);

  // Refresh entitlement from RevenueCat
  const refreshEntitlement = useCallback(async () => {
    if (!canPurchase) {
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
  }, [canPurchase, updatePremiumStatus]);

  // Initialize RevenueCat on mount
  useEffect(() => {
    async function init() {
      if (!canPurchase) {
        // Web: not premium, not loading
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
  }, [canPurchase]);

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