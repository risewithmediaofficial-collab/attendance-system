import { useState, useMemo, useCallback, memo } from "react";
import { Bell, BellDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isHoliday, storage } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface NotificationPanelProps {
  memberId?: string;
}

function NotificationPanelComponent({ memberId }: NotificationPanelProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const today = new Date().toISOString().slice(0, 10);
  const notificationsRead = useMemo(() => storage.getAuth().notificationsRead ?? {}, [refreshKey]);

  const notifications = useMemo(() => {
    const tasks = storage.getTasks();
    const attendance = storage.getAttendance();
    const pending = storage.getPendingUsers();
    const directNotifications = storage.getUserNotifications();
    if (!memberId) return [];

    const holidayToday = isHoliday(today);
    const hasAttendanceToday = attendance.some((a) => a.memberId === memberId && a.date === today);
    const missingAttendanceKey = `attendance-missing:${memberId}:${today}`;

    const list: Array<{ key: string; title: string; description: string }> = [];

    if (!holidayToday && !hasAttendanceToday) {
      list.push({
        key: missingAttendanceKey,
        title: "Missing attendance today",
        description: "You haven't logged your attendance yet.",
      });
    }

    const personalNotifications = directNotifications
      .filter((n) => n.targetMemberIds.includes(memberId))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((n) => ({ key: `user-notif:${n.id}`, title: n.title, description: n.message }));

    const now = new Date();
    const in2Days = new Date(now);
    in2Days.setDate(in2Days.getDate() + 2);

    const deadlineTasks = tasks
      .filter((t) => {
        const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
        return assignees.includes(memberId) && t.status !== "Completed";
      })
      .filter((t) => {
        const d = new Date(t.deadline + "T00:00:00");
        return d.getTime() >= now.getTime() && d.getTime() <= in2Days.getTime();
      })
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 5)
      .map((t) => ({ key: `task-deadline:${t.id}`, title: "Deadline approaching", description: `${t.title} - Due ${t.deadline}` }));

    const recentTasks = tasks
      .filter((t) => {
        const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
        return assignees.includes(memberId) && t.status !== "Completed";
      })
      .filter((t) => {
        const daysAgo = (new Date(t.createdAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo >= -2 && daysAgo <= 0;
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((t) => ({ key: `task-new:${t.id}`, title: "New task", description: `${t.title}` }));

    return [
      ...list,
      ...personalNotifications,
      ...deadlineTasks,
      ...recentTasks,
    ];
  }, [memberId, refreshKey]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !notificationsRead[n.key]).length,
    [notifications, notificationsRead]
  );

  const handleMarkRead = useCallback((key: string) => {
    storage.markNotificationRead(key);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setNotifOpen(true)}
        className="relative h-10 w-10 rounded-lg hover:bg-black/10 text-black/70"
      >
        {unreadCount > 0 ? <BellDot className="h-5 w-5 text-black/80" /> : <Bell className="h-5 w-5 text-black/55" />}
      </Button>
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center bg-black/80">
          {unreadCount}
        </div>
      )}

      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white/95 backdrop-blur-lg border border-black/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">Notifications</DialogTitle>
          </DialogHeader>
          <div className="space-y-2.5 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-sm py-10 text-center text-muted-foreground">All caught up.</div>
            ) : (
              notifications.map((n) => {
                const isRead = !!notificationsRead[n.key];
                return (
                  <div
                    key={n.key}
                    className={cn(
                      "p-3.5 rounded-xl border transition-colors",
                      isRead ? "bg-white/50 border-black/10" : "bg-black/5 border-black/15"
                    )}
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
                          onClick={() => handleMarkRead(n.key)}
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
    </>
  );
}

export const NotificationPanel = memo(NotificationPanelComponent);
