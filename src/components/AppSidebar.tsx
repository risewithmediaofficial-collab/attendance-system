import { LayoutDashboard, Users, CalendarCheck, FileText, Palmtree, LogOut, ChevronLeft, ChevronRight, KanbanSquare, TrendingUp } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo.png";
import { storage } from "@/lib/storage";

interface Props {
  onLogout: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ onLogout, collapsed, onToggle }: Props) {
  const location = useLocation();
  const role = storage.getCurrentRole();

  const items = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Attendance", url: "/attendance", icon: CalendarCheck },
    { title: "Board", url: "/board", icon: KanbanSquare },
    { title: "Work Reports", url: "/reports", icon: FileText },
    { title: "Performance", url: "/performance", icon: TrendingUp },
    ...(role === "Admin"
      ? [
          { title: "Members", url: "/members", icon: Users },
          { title: "Holidays", url: "/holidays", icon: Palmtree },
        ]
      : []),
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 bottom-0 z-40 flex flex-col"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(244,244,245,0.88) 100%)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(0,0,0,0.1)",
        boxShadow: "4px 0 32px rgba(0,0,0,0.08), 1px 0 0 rgba(255,255,255,0.8) inset",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.25), transparent)" }}
      />

      <motion.div
        className="h-20 flex items-center px-4 border-b"
        style={{ borderColor: "rgba(0,0,0,0.08)" }}
      >
        <motion.div whileHover={{ scale: 1.08 }} className="relative shrink-0">
          <div
            className="absolute inset-0 rounded-xl blur-md"
            style={{ background: "radial-gradient(circle, rgba(0,0,0,0.3), transparent)" }}
          />
          <img
            src={logoImg}
            alt="Rise With Media"
            className="h-9 w-9 rounded-xl object-cover relative shadow-md"
            style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.26)" }}
          />
        </motion.div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="ml-3 flex flex-col overflow-hidden"
            >
              <span className="font-bold text-sm text-foreground">Rise With</span>
              <span
                className="font-bold text-xs"
                style={{ background: "linear-gradient(135deg,#111111,#6b7280)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                Media
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-black/50">
            Navigation
          </p>
        )}
        {items.map((item) => {
          const active = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
          return (
            <motion.div key={item.title} whileHover={{ x: collapsed ? 0 : 3 }}>
              <NavLink
                to={item.url}
                end={item.url === "/"}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative overflow-hidden group",
                  active ? "text-black" : "hover:text-black"
                )}
                style={
                  active
                    ? {
                        background: "linear-gradient(135deg, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.08) 100%)",
                        border: "1px solid rgba(0,0,0,0.2)",
                        color: "#111111",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                      }
                    : { color: "rgba(0,0,0,0.65)", border: "1px solid transparent" }
                }
                activeClassName=""
              >
                {active && (
                  <motion.div
                    layoutId="active-bar"
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                    style={{ background: "linear-gradient(180deg, #111111, #6b7280)" }}
                  />
                )}

                <motion.div
                  whileHover={{ scale: 1.15, rotate: active ? 0 : 3 }}
                  className="shrink-0 ml-1"
                >
                  <item.icon
                    className="h-4.5 w-4.5"
                    style={{ color: active ? "#111111" : "rgba(0,0,0,0.55)" }}
                  />
                </motion.div>

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>

                {!active && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 100%)" }}
                  />
                )}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      <div className="px-3 pb-5 space-y-1 border-t pt-3" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
          style={{
            color: "rgba(0,0,0,0.6)",
            background: "rgba(255,255,255,0)",
            border: "1px solid transparent",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.65)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.12)";
            (e.currentTarget as HTMLElement).style.color = "#111111";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0)";
            (e.currentTarget as HTMLElement).style.borderColor = "transparent";
            (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.6)";
          }}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="ml-2"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{ color: "rgba(0,0,0,0.7)", border: "1px solid transparent" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.08)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.14)";
            (e.currentTarget as HTMLElement).style.color = "#111111";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "";
            (e.currentTarget as HTMLElement).style.borderColor = "transparent";
            (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.7)";
          }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}
