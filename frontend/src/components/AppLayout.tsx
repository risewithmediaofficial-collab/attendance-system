import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu, User } from "lucide-react";
import { Bell, BellDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { storage } from "@/lib/storage";

interface Props {
  children: React.ReactNode;
  onLogout: () => void;
}

export function AppLayout({ children, onLogout }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const [notifOpen, setNotifOpen] = useState(false);
  const [, setNotifTick] = useState(0);

  const member = storage.getCurrentMember();
  const role = storage.getCurrentRole();
  const today = new Date().toISOString().slice(0, 10);
  const notificationsRead = storage.getAuth().notificationsRead ?? {};

  const sidebarWidth = isMobile ? 0 : collapsed ? 72 : 260;

  const notifications = (() => {
    const tasks = storage.getTasks();
    const attendance = storage.getAttendance();
    const holidays = storage.getHolidays();
    const pending = storage.getPendingUsers();
    const directNotifications = storage.getUserNotifications();
    if (!member) return [];

    const holidayToday = holidays.some((h) => h.date === today);
    const missingAttendanceKey = `attendance-missing:${member.id}:${today}`;
    const hasAttendanceToday = attendance.some((a) => a.memberId === member.id && a.date === today);

    const list: Array<{ key: string; title: string; description: string }> = [];

    if (!holidayToday && !hasAttendanceToday) {
      list.push({
        key: missingAttendanceKey,
        title: "Missing attendance today",
        description: "You haven't logged your attendance yet.",
      });
    }

    const personalNotifications = directNotifications
      .filter((n) => n.targetMemberIds.includes(member.id))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((n) => ({ key: `user-notif:${n.id}`, title: n.title, description: n.message }));

    const now = new Date();
    const in2Days = new Date(now);
    in2Days.setDate(in2Days.getDate() + 2);

    const deadlineTasks = tasks
      .filter((t) => t.assignedTo === member.id && t.status !== "Completed")
      .filter((t) => {
        const d = new Date(t.deadline + "T00:00:00");
        return d.getTime() >= now.getTime() && d.getTime() <= in2Days.getTime();
      })
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 5)
      .map((t) => ({ key: `task-deadline:${t.id}`, title: "Deadline approaching", description: `${t.title} - Due ${t.deadline}` }));

    const recentTasks = tasks
      .filter((t) => t.assignedTo === member.id && t.status !== "Completed")
      .filter((t) => Date.now() - t.createdAt <= 24 * 60 * 60 * 1000)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 3)
      .map((t) => ({ key: `task-assigned:${t.id}`, title: "Task assigned to you", description: `${t.title} - Priority ${t.priority}` }));

    list.push(...deadlineTasks);
    list.push(...recentTasks);
    list.push(...personalNotifications);

    if (role === "Admin" && pending.length > 0) {
      list.push({
        key: "pending-accounts",
        title: "New account requests",
        description: `${pending.length} user${pending.length > 1 ? "s" : ""} waiting for approval.`,
      });
    }
    return list;
  })();

  const unreadCount = notifications.filter((n) => !notificationsRead[n.key]).length;

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
          className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 lg:px-8"
          style={{
            background: "rgba(250,252,255,0.54)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            borderBottom: "1px solid rgba(255,255,255,0.58)",
            boxShadow: "0 10px 28px rgba(26,32,44,0.08), 0 1px 0 rgba(255,255,255,0.7) inset",
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
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
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "rgba(0,0,0,0.52)" }}>
                Management Platform
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <motion.div whileHover={{ scale: 1.05 }} className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNotifOpen(true)}
                className="rounded-xl hover:bg-black/5"
              >
                {unreadCount > 0
                  ? <BellDot className="h-5 w-5 text-black/80" />
                  : <Bell className="h-5 w-5 text-black/55" />
                }
              </Button>
              {unreadCount > 0 && (
                <div
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#111111,#4b5563)", boxShadow: "0 2px 8px rgba(0,0,0,0.36)" }}
                >
                  {unreadCount}
                </div>
              )}

              <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
                <DialogContent
                  className="max-w-md rounded-2xl"
                  style={{
                    background: "linear-gradient(145deg,rgba(255,255,255,0.95),rgba(245,245,246,0.92))",
                    border: "1px solid rgba(0,0,0,0.1)",
                    backdropFilter: "blur(28px)",
                  }}
                >
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-foreground">Notifications</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2.5 max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="text-sm py-10 text-center text-muted-foreground">
                        All caught up.
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const isRead = !!notificationsRead[n.key];
                        return (
                          <div
                            key={n.key}
                            className="p-3.5 rounded-xl border transition-all duration-200"
                            style={{
                              background: isRead ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.06)",
                              borderColor: isRead ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.18)",
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-foreground">{n.title}</p>
                                <p className="text-xs mt-1 text-muted-foreground">{n.description}</p>
                              </div>
                              {!isRead && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    storage.markNotificationRead(n.key);
                                    setNotifTick((t) => t + 1);
                                  }}
                                  className="text-xs shrink-0"
                                >
                                  Mark read
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>

            <div className="flex items-center gap-2.5 pl-3 border-l" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-foreground">{member?.name ?? role}</p>
                <p className="text-xs text-muted-foreground">{role}</p>
              </div>
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg,rgba(0,0,0,0.16),rgba(0,0,0,0.08))",
                  border: "1px solid rgba(0,0,0,0.2)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                }}
              >
                <User className="h-4 w-4 text-white" />
              </div>
            </div>
          </motion.div>
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
