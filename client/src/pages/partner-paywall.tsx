// client/src/pages/partner-paywall.tsx

import { Heart, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePartnerAccess } from "@/contexts/PartnerContext";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function PartnerPaywall() {
  const { momName } = usePartnerAccess();
  const [, navigate] = useLocation();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl border border-border shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          
          <h1 className="font-serif text-2xl font-bold mb-4">Access Paused</h1>
          
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {momName 
              ? `${momName}'s Bloom Premium subscription has expired.`
              : "The primary account's Bloom Premium subscription has expired."
            }
            <br />
            Partner access requires an active subscription.
          </p>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate("/subscribe")} 
              className="w-full"
            >
              <Heart className="w-4 h-4 mr-2" />
              Subscribe to Bloom Premium
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleSignOut} 
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
            
            <p className="text-xs text-muted-foreground pt-2">
              Or let {momName || "your partner"} know they can restore access by renewing.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Your connection is still active. Once premium is restored, you'll automatically regain access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
