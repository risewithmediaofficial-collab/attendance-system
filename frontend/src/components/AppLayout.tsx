import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { storage } from "@/lib/storage";
import { NotificationPanel } from "@/components/NotificationPanel";

interface Props {
  children: React.ReactNode;
  onLogout: () => void;
}

export function AppLayout({ children, onLogout }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

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

      {mobileOpen && isMobile && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/25 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <motion.div initial={{ x: -300 }} animate={{ x: 0 }} className="relative z-10">
            <AppSidebar onLogout={onLogout} collapsed={false} onToggle={() => setMobileOpen(false)} />
          </motion.div>
        </div>
      )}

      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarWidth }}
      >
        <header
          className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 lg:px-8 bg-white/50 backdrop-blur-lg border-b border-white/80"
        >
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(true)}
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
              <NotificationPanel memberId={member?.id} />
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

        <main className="flex-1 overflow-auto px-3 py-3 md:px-5 md:py-4">
          <div className="app-scene min-h-[calc(100vh-5.5rem)]">
            <div className="app-bubble light h-24 w-24 -left-3 top-8 md:h-32 md:w-32" />
            <div className="app-bubble dark h-20 w-20 right-10 top-6 md:h-24 md:w-24" />
            <div className="app-bubble dark h-24 w-24 -left-6 bottom-16 md:h-28 md:w-28" />
            <div className="app-bubble light h-28 w-28 right-4 bottom-10 md:h-36 md:w-36" />

            <div className="app-shell min-h-[calc(100vh-6.5rem)] px-3 py-4 md:px-5 md:py-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
