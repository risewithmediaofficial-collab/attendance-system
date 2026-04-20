import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
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
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10">
            <AppSidebar onLogout={onLogout} collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarWidth }}
      >
        <header
          className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 lg:px-8 bg-white border-b border-neutral-200"
        >
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(true)}
                className="hover:bg-neutral-100 rounded-2xl"
              >
                <Menu className="h-5 w-5 text-neutral-600" />
              </Button>
            )}
            <div className="hidden sm:block">
              <p className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
                Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <NotificationPanel memberId={member?.id} />
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-neutral-900">{member?.name ?? role}</p>
                <p className="text-xs text-neutral-500">{role}</p>
              </div>
              <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 bg-neutral-900 text-white">
                <User className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-neutral-50 px-3 py-3 md:px-5 md:py-4">
          <div className="flex-1 min-h-[calc(100vh-5.5rem)]">
            <div className="app-shell min-h-[calc(100vh-6.5rem)] px-3 py-6 md:px-6 md:py-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
