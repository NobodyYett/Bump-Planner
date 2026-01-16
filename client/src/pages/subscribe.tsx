// client/src/pages/subscribe.tsx
//
// Subscription purchase page
// Clean UI with single upgrade button

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { usePregnancyState } from "@/hooks/usePregnancyState";
import { usePremium } from "@/contexts/PremiumContext";
import { usePartnerAccess } from "@/contexts/PartnerContext";
import {
  getCurrentOffering,
  purchasePackage,
  restorePurchases,
  type Package,
} from "@/lib/purchases";
import {
  Sparkles,
  Check,
  Heart,
  Users,
  ListTodo,
  Lightbulb,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function SubscribePage() {
  const { dueDate, setDueDate } = usePregnancyState();
  const { isPremium, canPurchase, refreshEntitlement } = usePremium();
  const { isPartnerView, momName } = usePartnerAccess();
  const [, setLocation] = useLocation();

  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Feature lists
  const momFeatures = [
    {
      icon: <Users className="w-5 h-5" />,
      title: "Partner View",
      description: "Your partner gets their own dashboard with pregnancy updates, upcoming appointments, and personalized tips on how to support you each week.",
    },
    {
      icon: <ListTodo className="w-5 h-5" />,
      title: "Shared To-Do List",
      description: "Plan together with a shared task list. Assign responsibilities, track progress, and make sure nothing falls through the cracks before baby arrives.",
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      title: "Smart Suggestions",
      description: "Get personalized task recommendations based on your current week — from scheduling appointments to prepping the nursery, timed perfectly.",
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "More Ivy Questions",
      description: "Ask Ivy up to 5 questions per day. Get personalized guidance on symptoms, what to expect, and how to prepare — whenever you need it.",
    },
  ];

  const partnerFeatures = [
    "See pregnancy updates and milestones",
    "View upcoming appointments",
    "Get personalized tips on how to support each week",
    "Ask Ivy up to 5 questions per day",
  ];

  // Redirect if already premium
  useEffect(() => {
    if (isPremium) {
      const timer = setTimeout(() => {
        setLocation("/");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isPremium, setLocation]);

  // Handle purchase - fetches offering and purchases in one go
  async function handlePurchase() {
    console.log("[Subscribe] handlePurchase called");
    console.log("[Subscribe] purchasing:", purchasing, "canPurchase:", canPurchase);
    
    if (purchasing || !canPurchase) {
      console.log("[Subscribe] Aborting - already purchasing or cannot purchase");
      return;
    }

    setPurchasing(true);
    setError(null);

    try {
      // Get current offering
      console.log("[Subscribe] Fetching current offering...");
      const offering = await getCurrentOffering();
      console.log("[Subscribe] Offering received:", offering);
      
      if (!offering?.availablePackages?.length) {
        console.log("[Subscribe] No packages available in offering");
        setError("Unable to load subscription. Please try again.");
        setPurchasing(false);
        return;
      }

      // Get first available package (monthly)
      const pkg: Package = offering.availablePackages[0];
      console.log("[Subscribe] Selected package:", pkg);
      
      console.log("[Subscribe] Calling purchasePackage...");
      const result = await purchasePackage(pkg);
      console.log("[Subscribe] Purchase result:", result);

      if (result.success) {
        console.log("[Subscribe] Purchase successful, refreshing entitlement");
        await refreshEntitlement();
      } else if (result.error && result.error !== "cancelled") {
        console.log("[Subscribe] Purchase failed:", result.error);
        setError(result.error);
      }
    } catch (err) {
      console.error("[Subscribe] Purchase error:", err);
      setError("Something went wrong. Please try again.");
    }

    setPurchasing(false);
  }

  // Handle restore
  async function handleRestore() {
    console.log("[Subscribe] handleRestore called");
    if (restoring) return;

    setRestoring(true);
    setError(null);

    console.log("[Subscribe] Calling restorePurchases...");
    const result = await restorePurchases();
    console.log("[Subscribe] Restore result:", result);

    if (result.success) {
      await refreshEntitlement();
      if (!result.customerInfo?.entitlements?.active?.premium) {
        setError("No previous purchases found");
      }
    } else if (result.error) {
      setError(result.error);
    }

    setRestoring(false);
  }

  // Success state
  if (isPremium) {
    return (
      <Layout dueDate={dueDate} setDueDate={setDueDate}>
        <div className="max-w-lg mx-auto py-16 px-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
            <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-3">
            Welcome to Premium
          </h1>
          <p className="text-muted-foreground mb-6">
            All features are now unlocked. Enjoy your journey together.
          </p>
          <Button onClick={() => setLocation("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </Layout>
    );
  }

  // Partner view
  if (isPartnerView) {
    return (
      <Layout dueDate={dueDate} setDueDate={setDueDate}>
        <div className="max-w-xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-serif text-3xl font-bold mb-2">Unlock Partner Access</h1>
            <p className="text-muted-foreground">
              {momName ? `Subscribe to access ${momName}'s pregnancy journey` : "Subscribe to unlock the partner experience"}
            </p>
          </div>

          {/* Features */}
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h3 className="font-medium mb-4">With Premium, you'll be able to:</h3>
            <div className="space-y-3">
              {partnerFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}

          {/* Purchase button */}
          {canPurchase ? (
            <Button
              onClick={handlePurchase}
              disabled={purchasing}
              className="w-full h-12 text-base mb-6"
              size="lg"
            >
              {purchasing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </>
              )}
            </Button>
          ) : (
            <div className="bg-muted/50 border border-border rounded-xl p-6 text-center mb-6">
              <p className="text-sm text-muted-foreground">
                To subscribe, please use the iOS or Android app.
              </p>
            </div>
          )}

          {/* Footer links */}
          <div className="text-center space-y-4">
            {canPurchase && (
              <button
                onClick={handleRestore}
                disabled={restoring}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {restoring ? "Restoring..." : "Restore Purchases"}
              </button>
            )}
            
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <button 
                type="button"
                onClick={() => window.open('/privacy.html', '_blank')} 
                className="underline hover:text-foreground transition-colors"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button 
                type="button"
                onClick={() => window.open('/terms.html', '_blank')} 
                className="underline hover:text-foreground transition-colors"
              >
                Terms of Service
              </button>
            </div>

            <Button onClick={() => setLocation("/settings")} variant="link" className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Mom view
  return (
    <Layout dueDate={dueDate} setDueDate={setDueDate}>
      <div className="max-w-xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">Bloom Premium</h1>
          <p className="text-muted-foreground">
            Share your pregnancy journey with your partner
          </p>
        </div>

        {/* Features */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="space-y-5">
            {momFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary mt-0.5">
                  {feature.icon}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">{feature.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
            <p className="text-sm text-destructive text-center">{error}</p>
          </div>
        )}

        {/* Purchase button */}
        {canPurchase ? (
          <Button
            onClick={handlePurchase}
            disabled={purchasing}
            className="w-full h-12 text-base mb-6"
            size="lg"
          >
            {purchasing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </>
            )}
          </Button>
        ) : (
          <div className="bg-muted/50 border border-border rounded-xl p-6 text-center mb-6">
            <p className="text-sm text-muted-foreground">
              Subscriptions are available on the iOS and Android apps.
            </p>
          </div>
        )}

        {/* Footer links */}
        <div className="text-center space-y-4">
          {canPurchase && (
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {restoring ? "Restoring..." : "Restore Purchases"}
            </button>
          )}
          
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <button 
              type="button"
              onClick={() => window.open('/privacy.html', '_blank')} 
              className="underline hover:text-foreground transition-colors"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button 
              type="button"
              onClick={() => window.open('/terms.html', '_blank')} 
              className="underline hover:text-foreground transition-colors"
            >
              Terms of Service
            </button>
          </div>

          <Button onClick={() => setLocation("/")} variant="link" className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </Layout>
  );
}