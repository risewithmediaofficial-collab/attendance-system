import {
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileText,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Palmtree,
  Settings,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { memo, useMemo, useState } from "react";

import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";
import logoImg from "@/assets/RISE WITH MEDIA - LOGO.png";

interface Props {
  onLogout: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

interface NavLinkItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  aliases?: string[];
}

interface NavGroupItem {
  title: string;
  url: string;
  icon: LucideIcon;
  children: NavLinkItem[];
  aliases?: string[];
}

interface NavSection {
  title: string;
  items: Array<NavLinkItem | NavGroupItem>;
}

function isGroup(item: NavLinkItem | NavGroupItem): item is NavGroupItem {
  return "children" in item;
}

function matchesRoute(pathname: string, url: string, aliases: string[] = []) {
  const candidates = [url, ...aliases];
  return candidates.some((candidate) => {
    if (candidate === "/") {
      return pathname === "/" || pathname === "/dashboard";
    }

    return pathname === candidate || pathname.startsWith(`${candidate}/`);
  });
}

interface SidebarLinkProps {
  item: NavLinkItem;
  active: boolean;
  collapsed: boolean;
  child?: boolean;
}

const SidebarLink = memo(function SidebarLink({
  item,
  active,
  collapsed,
  child = false,
}: SidebarLinkProps) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.url}
      end={item.url === "/" || item.url === "/tasks"}
      className={cn(
        "relative overflow-hidden group transition-all duration-150",
        collapsed
          ? "mx-auto flex h-11 w-11 items-center justify-center rounded-2xl"
          : child
            ? "ml-11 flex items-center gap-3 rounded-xl px-3 py-2 text-sm"
            : "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium",
        active
          ? child
            ? "bg-[#eef3ff] text-[#1f3f80]"
            : "border border-[#d6e0f6] bg-[#eef3ff] text-[#1f3f80]"
          : child
            ? "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
            : "border border-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      )}
    >
      {active && !collapsed && !child && (
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-[#5B7DC8]" />
      )}

      {Icon ? (
        <Icon className={cn("shrink-0", child ? "h-4 w-4" : "h-5 w-5")} />
      ) : (
        <span
          className={cn(
            "shrink-0 rounded-full",
            child ? "ml-0.5 h-1.5 w-1.5" : "h-2 w-2",
            active ? "bg-current" : "bg-neutral-300"
          )}
        />
      )}

      {!collapsed && <span className="flex-1 overflow-hidden whitespace-nowrap">{item.title}</span>}
    </NavLink>
  );
});

interface SidebarGroupProps {
  item: NavGroupItem;
  pathname: string;
  collapsed: boolean;
}

const SidebarGroup = memo(function SidebarGroup({
  item,
  pathname,
  collapsed,
}: SidebarGroupProps) {
  const [manuallyOpen, setManuallyOpen] = useState(false);
  const active = matchesRoute(pathname, item.url, item.aliases);
  const shouldShowChildren = !collapsed && (active || manuallyOpen);
  const Icon = item.icon;

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "relative overflow-hidden transition-all duration-150",
          collapsed
            ? "mx-auto h-11 w-11 rounded-2xl"
            : "rounded-2xl border",
          active
            ? "border-[#d6e0f6] bg-[#eef3ff] text-[#1f3f80]"
            : "bg-transparent text-neutral-600 border-transparent hover:bg-neutral-100"
        )}
      >
        {!collapsed && active && (
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-[#5B7DC8]" />
        )}

        <div className={cn("flex items-center", collapsed ? "justify-center h-full" : "gap-2 px-2 py-1.5")}>
          <NavLink
            to={item.url}
            className={cn(
              "flex min-w-0 items-center gap-3",
              collapsed ? "h-full w-full justify-center" : "flex-1 rounded-xl px-2 py-1"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate text-sm font-medium">{item.title}</span>}
          </NavLink>

          {!collapsed && (
            <button
              type="button"
              onClick={() => setManuallyOpen((open) => !open)}
              className={cn(
                "rounded-xl p-2 transition-colors",
                active ? "hover:bg-[#dce7fb]" : "hover:bg-white"
              )}
              aria-label={shouldShowChildren ? `Collapse ${item.title}` : `Expand ${item.title}`}
            >
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", shouldShowChildren && "rotate-180")}
              />
            </button>
          )}
        </div>
      </div>

      {shouldShowChildren && (
        <div className="space-y-1 pb-1">
          {item.children.map((child) => (
            <SidebarLink
              key={child.title}
              item={child}
              active={matchesRoute(pathname, child.url, child.aliases)}
              collapsed={false}
              child
            />
          ))}
        </div>
      )}
    </div>
  );
});

export const AppSidebar = memo(function AppSidebarComponent({
  onLogout,
  collapsed,
  onToggle,
}: Props) {
  const location = useLocation();
  const role = storage.getCurrentRole();

  const sections = useMemo<NavSection[]>(() => {
    const taskViews: NavGroupItem = {
      title: role === "Admin" ? "Tasks" : "Work",
      url: role === "Admin" ? "/tasks" : "/my-work",
      icon: role === "Admin" ? KanbanSquare : CheckCircle2,
      aliases: ["/tasks", "/board", "/calendar", "/activity", "/my-work"],
      children: [
        ...(role === "Admin"
          ? []
          : [{ title: "My Work", url: "/my-work" }]),
        { title: "Tasks", url: "/tasks", aliases: ["/board"] },
        { title: "Calendar", url: "/calendar" },
        { title: "Activity", url: "/activity" },
      ],
    };

    const attendanceViews: NavGroupItem = {
      title: "Attendance",
      url: "/attendance",
      icon: CalendarCheck,
      aliases: ["/attendance", "/manage-attendance", "/holidays", "/daily-status"],
      children: [
        { title: "Overview", url: "/attendance" },
        ...(role === "Admin"
          ? [
              { title: "Manage Attendance", url: "/manage-attendance", icon: ClipboardList },
              { title: "Holidays", url: "/holidays", icon: Palmtree },
            ]
          : [{ title: "Daily Status", url: "/daily-status" }]),
      ],
    };

    const reportingViews: NavGroupItem = {
      title: "Reports",
      url: "/reports",
      icon: FileText,
      aliases: ["/reports", "/performance", "/admin-review"],
      children: [
        { title: "Work Reports", url: "/reports" },
        { title: "Performance", url: "/performance", icon: TrendingUp },
        ...(role === "Admin"
          ? [{ title: "Review Tasks", url: "/admin-review", icon: ClipboardCheck }]
          : []),
      ],
    };

    const coreItems: Array<NavLinkItem | NavGroupItem> = [
      { title: "Dashboard", url: "/", icon: LayoutDashboard, aliases: ["/dashboard"] },
      taskViews,
      attendanceViews,
      reportingViews,
    ];

    const adminItems: Array<NavLinkItem | NavGroupItem> =
      role === "Admin"
        ? [{ title: "Team", url: "/members", icon: Users }]
        : [];

    return [
      { title: "Core", items: coreItems },
      ...(adminItems.length > 0 ? [{ title: "Admin", items: adminItems }] : []),
    ];
  }, [role]);

  return (
    <aside
      className="fixed top-0 left-0 bottom-0 z-40 flex flex-col border-r border-neutral-200 bg-white shadow-none transition-[width] duration-150"
      style={{ width: collapsed ? 72 : 260 }}
    >
      <div className="flex h-20 items-center border-b border-neutral-200 px-4">
        <div className="relative shrink-0">
          <img
            src={logoImg}
            alt="Rise With Media"
            className="h-10 w-10 rounded-xl object-cover"
          />
        </div>

        {!collapsed && (
          <div className="ml-3 flex flex-col overflow-hidden">
            <span className="font-bold text-sm text-neutral-900">Rise With</span>
            <span className="text-xs font-bold text-[#5B7DC8]">Media</span>
          </div>
        )}
      </div>

      <nav
        className={cn(
          "flex-1 py-6 overflow-y-auto",
          collapsed
            ? "px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "px-3 [scrollbar-width:thin]"
        )}
      >
        {sections.map((section) => (
          <div key={section.title} className="mb-6 last:mb-0">
            {!collapsed && (
              <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {section.title}
              </p>
            )}

            <div className="space-y-1">
              {section.items.map((item) =>
                isGroup(item) ? (
                  <SidebarGroup
                    key={item.title}
                    item={item}
                    pathname={location.pathname}
                    collapsed={collapsed}
                  />
                ) : (
                  <SidebarLink
                    key={item.title}
                    item={item}
                    active={matchesRoute(location.pathname, item.url, item.aliases)}
                    collapsed={collapsed}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-neutral-200 bg-neutral-50/50">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2.5 rounded-2xl text-xs font-medium transition-all duration-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent hover:border-neutral-200"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </button>

        <NavLink
          to="/settings"
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 w-full relative overflow-hidden group mt-1",
              location.pathname === "/settings"
                ? "border border-[#d6e0f6] bg-[#eef3ff] text-[#1f3f80]"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent"
            )}
          >
            {location.pathname === "/settings" && (
             <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-[#5B7DC8]" />
            )}
            <Settings className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="whitespace-nowrap flex-1">Settings</span>}
        </NavLink>

        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 text-neutral-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 mt-1"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="whitespace-nowrap flex-1">Logout</span>}
        </button>
      </div>
    </aside>
  );
});
