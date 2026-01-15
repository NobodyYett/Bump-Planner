// client/src/components/settings/danger-zone-section.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";

export function DangerZoneSection() {
  const { user, deleteAccount } = useAuth();
  const { toast } = useToast();
  
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const email = user?.email ?? "Unknown";

  async function handleDeleteAccount() {
    if (confirmText !== "DELETE" || !user) return;
    try {
      setDeleting(true);
      await deleteAccount();
    } catch (err) {
      console.error("Delete failed:", err);
      toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete account." });
      setDeleting(false);
    }
  }

  return (
    <section className="border border-destructive/30 rounded-xl overflow-hidden">
      <div className="bg-destructive/5 px-6 py-4 border-b border-destructive/20">
        <h2 className="text-lg font-semibold text-destructive flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>
      </div>
      <div className="p-6 space-y-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            You are currently signed in as <span className="font-mono text-foreground font-medium">{email}</span>.
          </p>
          <p className="text-sm text-muted-foreground">
            To permanently delete your account, type <span className="font-bold text-destructive">DELETE</span> below.
          </p>
        </div>
        <div className="flex gap-4">
          <Input 
            type="text" 
            value={confirmText} 
            onChange={(e) => setConfirmText(e.target.value)} 
            placeholder="Type DELETE to confirm" 
            className="max-w-[200px]" 
          />
          <Button 
            variant="destructive" 
            disabled={confirmText !== "DELETE" || deleting} 
            onClick={handleDeleteAccount}
          >
            {deleting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</>
            ) : (
              <><Trash2 className="mr-2 h-4 w-4" />Delete Account</>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}