import { LayoutDashboard, Users, CalendarCheck, FileText, Palmtree, LogOut, ChevronLeft, ChevronRight, KanbanSquare, TrendingUp, CheckCircle2, Settings, List, Calendar, Activity, Clock, ClipboardCheck, ClipboardList } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo.png";
import { storage } from "@/lib/storage";

interface Props {
  onLogout: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  title: string;
  url: string;
  icon: any;
}

interface NavItemProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}

const NavItemComponent = memo(({ item, active, collapsed }: NavItemProps) => {
  return (
    <motion.div key={item.title} initial={false}>
      <NavLink
        to={item.url}
        end={item.url === "/"}
        className={cn(
          "relative overflow-hidden group transition-colors duration-150",
          collapsed
            ? "mx-auto h-11 w-11 rounded-xl flex items-center justify-center"
            : "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold",
          active ? "text-black bg-black/10 border border-black/15" : "text-black/65 hover:text-black/80 hover:bg-black/5"
        )}
      >
        {active && !collapsed && (
          <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-black rounded-full" />
        )}

        <div className={cn("shrink-0", !collapsed && "ml-1")}>
          <item.icon
            className="h-4.5 w-4.5"
            style={{ color: active ? "#111111" : "rgba(0,0,0,0.55)" }}
          />
        </div>

        {!collapsed && (
          <span className="whitespace-nowrap overflow-hidden">
            {item.title}
          </span>
        )}
      </NavLink>
    </motion.div>
  );
});

NavItemComponent.displayName = "NavItem";

export const AppSidebar = memo(function AppSidebarComponent({ onLogout, collapsed, onToggle }: Props) {
  const location = useLocation();
  const role = storage.getCurrentRole();

  const items = useMemo(() => {
    const baseItems: NavItem[] = [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Attendance", url: "/attendance", icon: CalendarCheck },
      { title: "Board", url: "/board", icon: KanbanSquare },
      { title: "List View", url: "/list", icon: List },
      { title: "Calendar", url: "/calendar", icon: Calendar },
      { title: "Activity", url: "/activity", icon: Activity },
      { title: "Work Reports", url: "/reports", icon: FileText },
      { title: "Performance", url: "/performance", icon: TrendingUp },
    ];

    if (role !== "Admin") {
      baseItems.splice(1, 0, { title: "My Work", url: "/my-work", icon: CheckCircle2 });
    }
    
    if (role === "Admin") {
      baseItems.push(
        { title: "Manage Attendance", url: "/manage-attendance", icon: ClipboardList },
        { title: "Review Tasks", url: "/admin-review", icon: ClipboardCheck },
        { title: "Members", url: "/members", icon: Users },
        { title: "Holidays", url: "/holidays", icon: Palmtree }
      );
    } else {
      // Only show Daily Status for non-admin users (Employees and Interns)
      baseItems.push(
        { title: "Daily Status", url: "/daily-status", icon: Clock }
      );
    }
    
    return baseItems;
  }, [role]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25 }}
      className="fixed top-0 left-0 bottom-0 z-40 flex flex-col bg-white/80 backdrop-blur-lg border-r border-black/10"
      style={{
        backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(244,244,245,0.88) 100%)",
      }}
    >
      <motion.div className="h-20 flex items-center px-4 border-b border-black/10">
        <div className="relative shrink-0">
          <img
            src={logoImg}
            alt="Rise With Media"
            className="h-9 w-9 rounded-xl object-cover shadow-md"
          />
        </div>

        {!collapsed && (
          <div className="ml-3 flex flex-col overflow-hidden">
            <span className="font-bold text-sm text-foreground">Rise With</span>
            <span className="font-bold text-xs bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
              Media
            </span>
          </div>
        )}
      </motion.div>

      <nav
        className={cn(
          "flex-1 py-5 space-y-1 overflow-y-auto",
          collapsed
            ? "px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "px-3 [scrollbar-width:thin]"
        )}
      >
        {!collapsed && (
          <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-black/50">
            Navigation
          </p>
        )}
        {items.map((item) => {
          const active = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
          return (
            <NavItemComponent
              key={item.title}
              item={item}
              active={active}
              collapsed={collapsed}
            />
          );
        })}
      </nav>

      <div className="p-3 border-t border-black/10">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150 text-black/60 hover:text-black/90 hover:bg-white/50"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </button>

        <NavLink
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 w-full relative overflow-hidden group mt-1",
            location.pathname === "/settings"
              ? "text-black bg-black/10 border border-black/15"
              : "text-black/65 hover:text-black/80"
          )}
        >
          {location.pathname === "/settings" && (
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-black rounded-full" />
          )}
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">Settings</span>}
        </NavLink>

        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 text-black/70 hover:text-black/90 hover:bg-black/5 mt-1"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
});
