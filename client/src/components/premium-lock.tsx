// client/src/components/premium-lock.tsx
//
// Glass preview overlay for premium features
// Shows blurred/frosted content with subtle CTA

import { ReactNode } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface PremiumLockProps {
  children: ReactNode;
  isPaid: boolean;
  /** Short, calm text - no sales language */
  message?: string;
  /** Additional class for the wrapper */
  className?: string;
  /** Show the premium badge */
  showBadge?: boolean;
  /** Disable the entire overlay (for sections that should just be hidden) */
  hideIfFree?: boolean;
}

export function PremiumLock({
  children,
  isPaid,
  message = "Available with Premium",
  className,
  showBadge = true,
  hideIfFree = false,
}: PremiumLockProps) {
  const [, setLocation] = useLocation();

  // If user is paid, render children normally
  if (isPaid) {
    return <>{children}</>;
  }

  // If hideIfFree, don't render at all
  if (hideIfFree) {
    return null;
  }

  function handleUnlock() {
    setLocation("/subscribe");
  }

  return (
    <div className={cn("relative", className)}>
      {/* Content - slightly dimmed but readable */}
      <div
        className="select-none pointer-events-none opacity-50"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Clear overlay with pill badge */}
      <div
        className={cn(
          "absolute inset-0 z-10",
          "flex items-center justify-center",
          "cursor-pointer",
          "rounded-xl",
          "border border-dashed border-primary/30",
          "hover:border-primary/50 hover:bg-primary/5",
          "transition-all duration-200"
        )}
        onClick={handleUnlock}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleUnlock();
          }
        }}
        aria-label={message}
      >
        {showBadge && (
          <span className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-sm">
            Available with Premium
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Inline premium lock for smaller elements (e.g., single buttons, small sections)
 */
export function PremiumLockInline({
  children,
  isPaid,
  message = "Premium",
  className,
}: {
  children: ReactNode;
  isPaid: boolean;
  message?: string;
  className?: string;
}) {
  const [, setLocation] = useLocation();

  if (isPaid) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-2 cursor-pointer group",
        className
      )}
      onClick={() => setLocation("/subscribe")}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          setLocation("/subscribe");
        }
      }}
    >
      <div className="blur-[2px] opacity-50 pointer-events-none select-none">
        {children}
      </div>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
          {message}
        </span>
      </span>
    </div>
  );
}