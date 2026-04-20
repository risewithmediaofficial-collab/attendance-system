/* OPTIMIZED AppLayout.tsx FOR MOBILE PERFORMANCE */
/* CRITICAL FIXES:
   1. Remove header backdrop-filter on mobile (huge performance killer)
   2. Hide app-bubbles on mobile (expensive blur + gradient)
   3. Memoize components to prevent re-renders
   4. Lazy load NotificationPanel (heavy component)
   5. Simplify animations on mobile
*/

import { useState, useEffect, memo, lazy, Suspense } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile, useHighPerformanceMode } from "@/hooks/use-performance";
import { motion } from "framer-motion";
import { storage } from "@/lib/storage";

// Lazy load NotificationPanel - it's heavy
const NotificationPanel = lazy(() =>
  import("@/components/NotificationPanel").then((m) => ({
    default: m.NotificationPanel,
  }))
);

interface Props {
  children: React.ReactNode;
  onLogout: () => void;
}

// Memoized header component to prevent re-renders
const AppHeader = memo(function AppHeader({
  isMobile,
  onToggleSidebar,
  member,
  role,
}: {
  isMobile: boolean;
  onToggleSidebar: () => void;
  member: any;
  role: string;
}) {
  return (
    <header
      className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 lg:px-8 border-b border-neutral-200 bg-white"
    >
      <div className="flex items-center gap-3">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="hover:bg-black/5 rounded-xl"
          >
            <Menu className="h-5 w-5 text-black/70" />
          </Button>
        )}
        <div className="hidden sm:block">
          <p className="text-xs font-bold tracking-widest uppercase text-black/50">
            Management Platform
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Suspense fallback={<div className="w-6 h-6" />}>
            <NotificationPanel memberId={member?.id} />
          </Suspense>
        </div>

        <div className="flex items-center gap-2.5 pl-3 border-l border-black/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground">{member?.name ?? role}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
          <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-black/10 border border-black/15">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
});

// Memoized app shell to prevent re-renders
const AppShell = memo(function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell min-h-[calc(100vh-6.5rem)] px-3 py-4 md:px-5 md:py-6">
      {children}
    </div>
  );
});

// Memoized scene background (with optimized bubbles)
const AppScene = memo(function AppScene({ isMobile }: { isMobile: boolean }) {
  if (isMobile) {
    // CRITICAL FIX: Don't render bubbles on mobile at all
    // They're expensive (blur + gradient) and invisible on small screens
    return null;
  }

  // Desktop: Render decorative bubbles
  return (
    <div className="app-scene min-h-[calc(100vh-5.5rem)]">
      <div className="app-bubble light h-24 w-24 -left-3 top-8 md:h-32 md:w-32" />
      <div className="app-bubble dark h-20 w-20 right-10 top-6 md:h-24 md:w-24" />
      <div className="app-bubble dark h-24 w-24 -left-6 bottom-16 md:h-28 md:w-28" />
      <div className="app-bubble light h-28 w-28 right-4 bottom-10 md:h-36 md:w-36" />
    </div>
  );
});

export function AppLayout({ children, onLogout }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const { shouldAnimateRoute } = useHighPerformanceMode();

  const member = storage.getCurrentMember();
  const role = storage.getCurrentRole();

  const sidebarWidth = isMobile ? 0 : collapsed ? 72 : 260;

  return (
    <div className="min-h-screen flex w-full overflow-hidden">
      {!isMobile && (
        <AppSidebar
          onLogout={onLogout}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      )}

      {/* Mobile sidebar overlay */}
      {mobileOpen && isMobile && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop - simplified for mobile performance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/25"
            onClick={() => setMobileOpen(false)}
            // CRITICAL: Don't use backdrop-filter on mobile
          />
          {/* Sidebar */}
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            transition={{ duration: shouldAnimateRoute ? 0.2 : 0 }} /* Reduced from 0.25 */
            className="relative z-10"
          >
            <AppSidebar
              onLogout={onLogout}
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
            />
          </motion.div>
        </div>
      )}

      {/* Main content */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Header with CRITICAL FIX for mobile backdrop-filter */}
        <AppHeader
          isMobile={isMobile}
          onToggleSidebar={() => setMobileOpen(true)}
          member={member}
          role={role || "User"}
        />

        {/* Main content area */}
        <main className="flex-1 overflow-auto px-3 py-3 md:px-5 md:py-4">
          <AppScene isMobile={isMobile} />
          <AppShell>{children}</AppShell>
        </main>
      </div>
    </div>
  );
}
