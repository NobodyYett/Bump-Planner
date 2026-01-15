// client/src/components/settings/partner-access-section.tsx

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerAccess } from "@/contexts/PartnerContext";
import { supabase } from "@/lib/supabase";
import { Users, Copy, Check, Link2, Loader2 } from "lucide-react";
import { PremiumLock } from "@/components/premium-lock";
import {
  generateInviteToken,
  hashToken,
  buildInviteUrl,
} from "@/lib/partnerInvite";

interface PartnerAccessSectionProps {
  isPaid: boolean;
}

export function PartnerAccessSection({ isPaid }: PartnerAccessSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasActivePartner, refreshPartnerAccess } = usePartnerAccess();

  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [hasExistingInvite, setHasExistingInvite] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function checkExistingInvite() {
      const { data } = await supabase
        .from("partner_access")
        .select("id")
        .eq("mom_user_id", user!.id)
        .is("revoked_at", null)
        .limit(1)
        .single();

      setHasExistingInvite(!!data);
    }

    checkExistingInvite();
  }, [user]);

  async function handleCreateInvite() {
    if (!user) return;
    setInviteLoading(true);

    try {
      const token = generateInviteToken();
      const tokenHash = await hashToken(token);

      const { error } = await supabase
        .from("partner_access")
        .insert({
          mom_user_id: user.id,
          invite_token_hash: tokenHash,
        });

      if (error) throw error;

      setInviteToken(token);
      setHasExistingInvite(true);
      toast({ title: "Invite created", description: "Share this link with your partner." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Couldn't create invite." });
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRevokeAccess() {
    if (!user) return;
    if (!window.confirm("This will remove your partner's access. Are you sure?")) return;

    setInviteLoading(true);
    try {
      const { error } = await supabase
        .from("partner_access")
        .update({ revoked_at: new Date().toISOString() })
        .eq("mom_user_id", user.id)
        .is("revoked_at", null);

      if (error) throw error;

      setInviteToken(null);
      setHasExistingInvite(false);
      await refreshPartnerAccess();
      toast({ title: "Access revoked", description: "Your partner no longer has access." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Couldn't revoke access." });
    } finally {
      setInviteLoading(false);
    }
  }

  function handleCopyInvite() {
    if (!inviteToken) return;
    const inviteUrl = buildInviteUrl(inviteToken);
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
    toast({ title: "Link copied", description: "Share this link with your partner." });
  }

  return (
    <PremiumLock 
      isPaid={isPaid} 
      message="Share this experience with your partner"
    >
      <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-muted/30 px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Partner Access
          </h2>
          <p className="text-sm text-muted-foreground">
            Invite your partner to view your pregnancy journey.
          </p>
        </div>
        <div className="p-6 space-y-4">
          {inviteToken ? (
            <>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <Link2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Invite link ready!</p>
                  <p className="text-xs text-green-600 dark:text-green-400 truncate">
                    {buildInviteUrl(inviteToken)}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleCopyInvite} className="shrink-0">
                  {copiedInvite ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Important:</strong> Copy this link now. For security, you won't be able to see it again.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyInvite} className="flex-1">
                  {copiedInvite ? "Copied!" : "Copy invite link"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleRevokeAccess} disabled={inviteLoading} className="text-destructive hover:text-destructive">
                  Revoke
                </Button>
              </div>
            </>
          ) : hasExistingInvite || hasActivePartner ? (
            <>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Users className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {hasActivePartner ? "Partner connected" : "Invite pending"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasActivePartner 
                      ? "Your partner can view your pregnancy updates."
                      : "Waiting for your partner to accept the invite."
                    }
                  </p>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={handleRevokeAccess} disabled={inviteLoading} className="w-full text-destructive hover:text-destructive">
                {inviteLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Revoking...</> : "Revoke partner access"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Your partner will be able to see your baby's progress, upcoming appointments, and ways they can support you. They won't see your journal entries, symptoms, or private notes.
              </p>
              <Button onClick={handleCreateInvite} disabled={inviteLoading} className="w-full">
                {inviteLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <><Users className="w-4 h-4 mr-2" />Create partner invite</>}
              </Button>
            </>
          )}
        </div>
      </section>
    </PremiumLock>
  );
}