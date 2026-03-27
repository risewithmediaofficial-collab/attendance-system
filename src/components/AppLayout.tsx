import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Moon, Sun, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { motion } from "framer-motion";

interface Props {
  children: React.ReactNode;
  onLogout: () => void;
}

export function AppLayout({ children, onLogout }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AppSidebar
          onLogout={onLogout}
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10">
            <AppSidebar
              onLogout={onLogout}
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-[margin-left] duration-[250ms] ease-in-out"
        style={{ marginLeft: typeof window !== "undefined" && window.innerWidth >= 768 ? (collapsed ? 72 : 260) : 0 }}
      >
        {/* Top navbar */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 border-b bg-card/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-xl"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-base font-semibold text-foreground hidden sm:block">
              Intern Attendance & Work Report
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="rounded-xl hover:bg-accent"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2 pl-3 ml-1 border-l border-border">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium hidden sm:block">Admin</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
