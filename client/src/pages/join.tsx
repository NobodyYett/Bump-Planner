// client/src/pages/join.tsx

import { useEffect, useState } from "react";
import { useSearch, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerAccess } from "@/contexts/PartnerContext";
import { supabase } from "@/lib/supabase";
import { hashToken, getTokenFromUrl } from "@/lib/partnerInvite";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, CheckCircle, XCircle, LogIn } from "lucide-react";

type JoinState = 
  | "loading"
  | "not-logged-in"
  | "invalid-token"      // Covers: invalid, already used, revoked (can't distinguish)
  | "already-accepted"   // User is already a partner somewhere
  | "already-has-profile"
  | "ready-to-accept"
  | "accepting"
  | "success";

export default function JoinPage() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { refreshPartnerAccess } = usePartnerAccess();
  
  const [state, setState] = useState<JoinState>("loading");
  const [momName, setMomName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const token = getTokenFromUrl(searchString);

  useEffect(() => {
    async function validateInvite() {
      // Wait for auth to load
      if (authLoading) {
        setState("loading");
        return;
      }

      // Check if user is logged in
      if (!user) {
        setState("not-logged-in");
        return;
      }

      // Check if token is provided
      if (!token) {
        setState("invalid-token");
        setErrorMessage("No invite token provided.");
        return;
      }

      // Check if user already has their own pregnancy profile
      const { data: ownProfile } = await supabase
        .from("pregnancy_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (ownProfile) {
        setState("already-has-profile");
        return;
      }

      // Check if user is already a partner somewhere
      const { data: existingPartnerAccess } = await supabase
        .from("partner_access")
        .select("id")
        .eq("partner_user_id", user.id)
        .not("accepted_at", "is", null)
        .is("revoked_at", null)
        .single();

      if (existingPartnerAccess) {
        setState("already-accepted");
        return;
      }

      // We can NOT SELECT the invite (RLS blocks unclaimed invites for privacy)
      // Instead, show ready state and do blind claim on accept
      setState("ready-to-accept");
    }

    validateInvite();
  }, [token, user, authLoading]);

  async function handleAcceptInvite() {
    if (!token || !user) return;

    setState("accepting");

    try {
      const tokenHash = await hashToken(token);

      // BLIND CLAIM: Try to update without SELECT first
      // RLS ensures: unclaimed + not revoked + not self-accept + sets partner to self
      const { data: claimedInvite, error } = await supabase
        .from("partner_access")
        .update({
          partner_user_id: user.id,
          accepted_at: new Date().toISOString(),
        })
        .eq("invite_token_hash", tokenHash)
        .is("partner_user_id", null)  // Must be unclaimed
        .is("accepted_at", null)
        .is("revoked_at", null)
        .select("id, mom_user_id")    // Get the row back to confirm success
        .single();

      // If no row returned, invite was invalid/used/revoked
      if (error || !claimedInvite) {
        setState("invalid-token");
        setErrorMessage("This invite is invalid, already used, or has been revoked.");
        return;
      }

      // Success! Fetch mom's name for the success message
      const { data: momProfile } = await supabase
        .from("pregnancy_profiles")
        .select("mom_name")
        .eq("user_id", claimedInvite.mom_user_id)
        .single();

      setMomName(momProfile?.mom_name ?? null);

      // Refresh partner access context
      await refreshPartnerAccess();
      
      setState("success");
      
      // Clear the stored return URL since we're done
      sessionStorage.removeItem("returnTo");
      
      // Redirect to home after a short delay
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    } catch (err) {
      console.error("Failed to accept invite:", err);
      setState("invalid-token");
      setErrorMessage("This invite is invalid, already used, or has been revoked.");
    }
  }

  function handleLoginRedirect() {
    // Store the FULL current URL so login can redirect back
    const returnUrl = window.location.pathname + window.location.search;
    sessionStorage.setItem("returnTo", returnUrl);
    setLocation("/login");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl border border-border shadow-lg p-8 text-center">
          {/* Loading */}
          {state === "loading" && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold mb-2">Checking invite...</h1>
              <p className="text-muted-foreground">Please wait a moment.</p>
            </>
          )}

          {/* Not logged in */}
          {state === "not-logged-in" && (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-serif text-2xl font-bold mb-2">Sign in to continue</h1>
              <p className="text-muted-foreground mb-6">
                You need to sign in or create an account to accept this partner invite.
              </p>
              <Button onClick={handleLoginRedirect} className="w-full">
                Sign in or create account
              </Button>
            </>
          )}

          {/* Invalid token */}
          {state === "invalid-token" && (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="font-serif text-2xl font-bold mb-2">Invalid invite</h1>
              <p className="text-muted-foreground mb-6">
                {errorMessage || "This invite link is invalid, has already been used, or was revoked. Please ask for a new invite."}
              </p>
              <Button variant="outline" onClick={() => setLocation("/")} className="w-full">
                Go to home
              </Button>
            </>
          )}

          {/* Already accepted (by someone) */}
          {state === "already-accepted" && (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="font-serif text-2xl font-bold mb-2">Already connected</h1>
              <p className="text-muted-foreground mb-6">
                This invite has already been used, or you're already connected as a partner.
              </p>
              <Button onClick={() => setLocation("/")} className="w-full">
                Go to home
              </Button>
            </>
          )}

          {/* User already has their own profile */}
          {state === "already-has-profile" && (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="font-serif text-2xl font-bold mb-2">You have your own profile</h1>
              <p className="text-muted-foreground mb-6">
                You already have a pregnancy profile. You can't be a partner on another account with this login.
              </p>
              <Button onClick={() => setLocation("/")} className="w-full">
                Go to your profile
              </Button>
            </>
          )}

          {/* Ready to accept */}
          {state === "ready-to-accept" && (
            <>
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-rose-600 dark:text-rose-400" />
              </div>
              <h1 className="font-serif text-2xl font-bold mb-2">You're invited!</h1>
              <p className="text-muted-foreground mb-6">
                {momName 
                  ? `${momName} has invited you to follow along with their pregnancy journey.`
                  : "You've been invited to follow along with a pregnancy journey."
                }
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">As a partner, you'll be able to:</strong>
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• See baby's progress and weekly updates</li>
                  <li>• View upcoming appointments</li>
                  <li>• Get tips on how to support this week</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                  Journal entries, symptoms, and private notes will remain private.
                </p>
              </div>
              <Button onClick={handleAcceptInvite} className="w-full">
                Accept invite
              </Button>
            </>
          )}

          {/* Accepting */}
          {state === "accepting" && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold mb-2">Connecting...</h1>
              <p className="text-muted-foreground">Setting up your partner access.</p>
            </>
          )}

          {/* Success */}
          {state === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="font-serif text-2xl font-bold mb-2">You're connected!</h1>
              <p className="text-muted-foreground mb-6">
                {momName 
                  ? `Welcome! You can now follow ${momName}'s pregnancy journey.`
                  : "Welcome to the journey."
                } Redirecting...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}