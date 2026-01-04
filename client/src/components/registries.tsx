// client/src/components/registries.tsx
//
// Baby Registry Card
// - Facilitates creating/linking registries on external platforms
// - Does NOT recommend, display, or sell products
// - Partner access is read-only

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ExternalLink, 
  Trash2, 
  Gift, 
  Link2,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { usePartnerAccess } from "@/contexts/PartnerContext";
import {
  getEnabledPlatforms,
  openExternalLink,
  detectPlatformFromUrl,
  getPlatformDisplayName,
  type RegistryPlatform,
} from "@/config/registryLinks";

// ============================================
// Types
// ============================================

type Registry = {
  id: string;
  registry_platform: string;
  registry_url: string;
};

interface RegistriesProps {
  isReadOnly?: boolean;
}

// ============================================
// Helpers
// ============================================

function isValidUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

// ============================================
// Platform Tile Component
// ============================================

interface PlatformTileProps {
  platform: RegistryPlatform;
  disabled?: boolean;
}

function PlatformTile({ platform, disabled = false }: PlatformTileProps) {
  const isConfigured = platform.url !== null;

  function handleClick() {
    if (isConfigured && platform.url) {
      openExternalLink(platform.url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !isConfigured}
      className="flex items-center gap-3 w-full p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Gift className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {platform.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {isConfigured ? platform.description : "Link not configured"}
        </p>
      </div>
      {isConfigured && (
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
      )}
    </button>
  );
}

// ============================================
// Saved Registry Row Component
// ============================================

interface SavedRegistryRowProps {
  registry: Registry;
  canEdit: boolean;
  onDelete: (id: string) => void;
}

function SavedRegistryRow({ registry, canEdit, onDelete }: SavedRegistryRowProps) {
  const displayName = getPlatformDisplayName(registry.registry_platform);

  function handleOpen() {
    openExternalLink(registry.registry_url);
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {displayName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          Registry link saved
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        Open
        <ExternalLink className="w-3.5 h-3.5" />
      </Button>

      {canEdit && (
        <button
          type="button"
          onClick={() => onDelete(registry.id)}
          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
          title="Remove registry"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function Registries({ isReadOnly = false }: RegistriesProps) {
  const { user } = useAuth();
  const { isPartnerView, momUserId } = usePartnerAccess();
  
  const [registries, setRegistries] = useState<Registry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Link form state
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Determine which user's registries to fetch
  const targetUserId = isPartnerView ? momUserId : user?.id;
  
  // Determine if actions should be disabled (partner = read-only)
  const canEdit = !isReadOnly && !isPartnerView;

  // Get enabled platforms from config
  const platforms = getEnabledPlatforms();

  // ============================================
  // Data Fetching
  // ============================================

  useEffect(() => {
    async function loadRegistries() {
      if (!targetUserId) {
        setRegistries([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const { data, error: fetchError } = await supabase
        .from("registries")
        .select("id, registry_platform, registry_url")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: true });

      setIsLoading(false);

      if (fetchError) {
        console.error("Failed to load registries:", fetchError);
        return;
      }

      setRegistries(data || []);
    }

    loadRegistries();
  }, [targetUserId]);

  // ============================================
  // Actions
  // ============================================

  // Link an existing registry
  async function handleLinkRegistry() {
    if (!user || isPartnerView) return;
    
    setLinkError(null);

    const trimmedUrl = linkUrl.trim();

    if (!trimmedUrl) {
      setLinkError("Please enter your registry URL.");
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      setLinkError("URL must start with http:// or https://");
      return;
    }

    // Auto-detect platform from URL
    const platform = detectPlatformFromUrl(trimmedUrl);

    setIsSaving(true);

    const { data, error: insertError } = await supabase
      .from("registries")
      .insert({
        user_id: user.id,
        registry_platform: platform,
        registry_url: trimmedUrl,
      })
      .select("id, registry_platform, registry_url")
      .single();

    setIsSaving(false);

    if (insertError) {
      console.error("Failed to add registry:", insertError);
      setLinkError("Failed to add registry. Please try again.");
      return;
    }

    setRegistries((prev) => [...prev, data]);
    setLinkUrl("");
    setIsLinkSheetOpen(false);
  }

  // Delete a registry
  async function handleDelete() {
    if (!deleteId || !user || isPartnerView) return;

    const { error: deleteError } = await supabase
      .from("registries")
      .delete()
      .eq("id", deleteId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Failed to delete registry:", deleteError);
      return;
    }

    setRegistries((prev) => prev.filter((r) => r.id !== deleteId));
    setDeleteId(null);
  }

  // ============================================
  // Render
  // ============================================

  // PARTNER VIEW - Compact card
  if (isPartnerView) {
    return (
      <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Compact Header */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Gift className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-medium text-sm text-foreground">Baby Registry</h2>
              <p className="text-xs text-muted-foreground">
                {registries.length > 0 
                  ? `${registries.length} registry link${registries.length !== 1 ? "s" : ""} saved`
                  : "View and share registry links"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Compact Content */}
        <div className="p-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-2">Loading...</p>
          ) : registries.length > 0 ? (
            <div className="space-y-2">
              {registries.map((registry) => {
                const displayName = getPlatformDisplayName(registry.registry_platform);
                return (
                  <div
                    key={registry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <span className="text-sm font-medium text-foreground">{displayName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openExternalLink(registry.registry_url)}
                      className="gap-1.5 text-muted-foreground hover:text-foreground h-8 px-3"
                    >
                      Open
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No registry added yet.
            </p>
          )}
        </div>

        {/* Compact Disclaimer */}
        <div className="px-4 py-2 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground/70 text-center">
            Managed by third-party platforms.
          </p>
        </div>
      </section>
    );
  }

  // MOM VIEW - Full card with all features
  return (
    <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Gift className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Baby Registry
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create or link your baby registry on a trusted platform and manage access in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Loading...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Saved Registries */}
            {registries.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Your Registries
                </p>
                {registries.map((registry) => (
                  <SavedRegistryRow
                    key={registry.id}
                    registry={registry}
                    canEdit={canEdit}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            )}

            {/* Empty State for Saved Registries */}
            {registries.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  No registry added yet.
                </p>
              </div>
            )}

            {/* Platform Tiles - Only for Mom */}
            {canEdit && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Continue on a trusted registry platform.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {platforms.map((platform) => (
                    <PlatformTile
                      key={platform.id}
                      platform={platform}
                    />
                  ))}
                </div>

                {/* Link Existing Registry */}
                <Sheet open={isLinkSheetOpen} onOpenChange={setIsLinkSheetOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full gap-2 text-muted-foreground mt-2"
                    >
                      <Link2 className="w-4 h-4" />
                      Link an existing registry
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="rounded-t-2xl">
                    <SheetHeader className="text-left pb-4">
                      <SheetTitle>Link Existing Registry</SheetTitle>
                      <SheetDescription>
                        Paste the URL of your existing registry from any platform.
                      </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Registry URL</label>
                        <Input
                          placeholder="https://www.babylist.com/your-registry"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          type="url"
                        />
                        <p className="text-xs text-muted-foreground">
                          The platform will be detected automatically from your URL.
                        </p>
                      </div>

                      {linkError && (
                        <p className="text-sm text-destructive">{linkError}</p>
                      )}

                      <Button 
                        onClick={handleLinkRegistry} 
                        className="w-full" 
                        disabled={isSaving}
                      >
                        {isSaving ? "Adding..." : "Add Registry"}
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-6 py-3 border-t border-border bg-muted/20">
        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          Registries are created and managed by third-party platforms. Bump Planner does not sell products or provide shopping recommendations.
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      {canEdit && (
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Registry?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the registry link from your list. 
                Your actual registry on the platform is not affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </section>
  );
}