import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Scroll, Clock, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";

export interface ActivityLogEntry {
  id: string;
  memberId: string;
  memberName?: string;
  action: string;
  targetType?: string;
  targetName?: string;
  description?: string;
  timestamp: string;
}

interface MiniActivityPanelProps {
  limit?: number;
  compact?: boolean;
  showScroll?: boolean;
  onActivityClick?: (activity: ActivityLogEntry) => void;
}

function getActionIcon(action: string) {
  const iconProps = { className: "w-4 h-4" };
  switch (action) {
    case "created":
      return <MessageSquare {...iconProps} className="text-emerald-400" />;
    case "updated":
      return <Scroll {...iconProps} className="text-blue-400" />;
    case "deleted":
      return <Scroll {...iconProps} className="text-red-400" />;
    case "completed":
      return <MessageSquare {...iconProps} className="text-green-400" />;
    case "assigned":
      return <User {...iconProps} className="text-purple-400" />;
    default:
      return <Scroll {...iconProps} className="text-gray-400" />;
  }
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function MiniActivityPanel({
  limit = 10,
  compact = false,
  showScroll = true,
  onActivityClick,
}: MiniActivityPanelProps) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        const data = await storage.getActivityFeed();

        // Ensure timestamp is a valid string
        const formatted = (Array.isArray(data) ? data : data.activities || [])
          .slice(0, limit)
          .map((activity) => ({
            ...activity,
            timestamp: typeof activity.timestamp === "string" 
              ? activity.timestamp 
              : new Date(activity.timestamp).toISOString(),
          }))
          .sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

        setActivities(formatted);
      } catch (error) {
        console.error("Failed to load activities:", error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, [limit]);

  if (loading) {
    return (
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Scroll className="w-4 h-4" />
          Activity
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-10 bg-white/5 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Scroll className="w-4 h-4" />
        Recent Activity
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-4 text-xs text-muted-foreground">
          No recent activity
        </div>
      ) : (
        <div className={cn("space-y-2", showScroll && "max-h-80 overflow-y-auto pr-2")}>
          <AnimatePresence>
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onActivityClick?.(activity)}
                className={cn(
                  "flex items-start gap-3 p-2 rounded-lg text-xs",
                  "border border-white/5 bg-white/5",
                  onActivityClick && "cursor-pointer hover:bg-white/10 transition-colors"
                )}
              >
                <div className="mt-0.5">{getActionIcon(activity.action)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white/90 truncate">
                    {activity.memberName || "Unknown"}
                  </div>
                  <div className="text-muted-foreground truncate">
                    {activity.action} {activity.targetName || activity.description || "item"}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground/70 mt-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(activity.timestamp)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
}

export function ActivityPanelSidebar() {
  return (
    <div className="w-80">
      <MiniActivityPanel limit={15} showScroll={true} />
    </div>
  );
}
