import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { remoteStorageImpl } from "@/lib/storageRemote";
import type { Task } from "@/lib/storageTypes";

export interface SmartInsight {
  id: string;
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  color: "red" | "green" | "blue" | "amber" | "purple";
  trend?: "up" | "down" | "neutral";
}

interface SmartInsightsProps {
  maxItems?: number;
  userMemberId?: string;
  compact?: boolean;
}

const colorClasses = {
  red: "from-white/10 to-white/5 border-white/20",
  green: "from-white/10 to-white/5 border-white/20",
  blue: "from-white/10 to-white/5 border-white/20",
  amber: "from-white/10 to-white/5 border-white/20",
  purple: "from-white/10 to-white/5 border-white/20",
};

const iconColors = {
  red: "text-gray-400",
  green: "text-gray-400",
  blue: "text-gray-400",
  amber: "text-gray-400",
  purple: "text-gray-400",
};

function SmartInsightCard({ insight, index }: { insight: SmartInsight; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "p-4 rounded-lg border",
        "bg-gradient-to-br backdrop-blur-md",
        colorClasses[insight.color]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm text-muted-foreground mb-1">{insight.label}</div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-white">{insight.value}</div>
            {insight.trend && (
              <div
                className={cn(
                  "text-xs font-medium",
                  insight.trend === "up" && "text-green-400",
                  insight.trend === "down" && "text-red-400",
                  insight.trend === "neutral" && "text-gray-400"
                )}
              >
                {insight.trend === "up" && "↑"}
                {insight.trend === "down" && "↓"}
                {insight.trend === "neutral" && "→"}
              </div>
            )}
          </div>
          {insight.subtext && (
            <div className="text-xs text-muted-foreground/70 mt-2">{insight.subtext}</div>
          )}
        </div>
        <div className={cn("p-2 rounded-lg bg-white/5", iconColors[insight.color])}>
          {insight.icon}
        </div>
      </div>
    </motion.div>
  );
}

export function SmartInsights({
  maxItems = 4,
  userMemberId,
  compact = false,
}: SmartInsightsProps) {
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        setLoading(true);
        const allTasks = await remoteStorageImpl.getTasks();
        const tasks = Array.isArray(allTasks) ? allTasks : allTasks.tasks || [];

        // Filter to current user's tasks if memberId provided
        const userTasks = userMemberId
          ? tasks.filter(
              (t) =>
                t.assignedTo?.includes(userMemberId) ||
                t.createdBy === userMemberId
            )
          : tasks;

        // Calculate insights
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());

        // Overdue tasks
        const overdueTasks = userTasks.filter(
          (t) =>
            t.dueDate &&
            new Date(t.dueDate) < now &&
            t.status !== "Completed"
        );

        // Completed today
        const completedToday = userTasks.filter(
          (t) =>
            t.status === "Completed" &&
            t.completedAt &&
            new Date(t.completedAt) >= startOfDay
        );

        // Completed this week
        const completedThisWeek = userTasks.filter(
          (t) =>
            t.status === "Completed" &&
            t.completedAt &&
            new Date(t.completedAt) >= startOfWeek
        );

        // High priority pending
        const highPriorityPending = userTasks.filter(
          (t) => t.priority === "High" && t.status !== "Completed"
        );

        const newInsights: SmartInsight[] = [];

        if (overdueTasks.length > 0) {
          newInsights.push({
            id: "overdue",
            label: "Overdue Tasks",
            value: overdueTasks.length,
            subtext: "Requiring immediate attention",
            icon: <AlertCircle className="w-6 h-6" />,
            color: "red",
            trend: overdueTasks.length > 3 ? "up" : "neutral",
          });
        }

        if (completedToday.length > 0) {
          newInsights.push({
            id: "completed-today",
            label: "Completed Today",
            value: completedToday.length,
            subtext: "Great progress!",
            icon: <CheckCircle2 className="w-6 h-6" />,
            color: "green",
            trend: "up",
          });
        }

        newInsights.push({
          id: "completed-week",
          label: "Completed This Week",
          value: completedThisWeek.length,
          subtext: `${Math.round((completedThisWeek.length / (userTasks.length || 1)) * 100)}% of your tasks`,
          icon: <TrendingUp className="w-6 h-6" />,
          color: "blue",
          trend: completedThisWeek.length > 5 ? "up" : "neutral",
        });

        if (highPriorityPending.length > 0) {
          newInsights.push({
            id: "high-priority",
            label: "High Priority Pending",
            value: highPriorityPending.length,
            subtext: "Should be prioritized",
            icon: <AlertCircle className="w-6 h-6" />,
            color: "amber",
            trend: highPriorityPending.length > 2 ? "down" : "neutral",
          });
        }

        // Add default insights if none generated
        if (newInsights.length === 0) {
          newInsights.push({
            id: "all-tasks",
            label: "Total Tasks",
            value: userTasks.length,
            subtext: "All statuses",
            icon: <TrendingUp className="w-6 h-6" />,
            color: "blue",
          });
        }

        setInsights(newInsights.slice(0, maxItems));
      } catch (error) {
        console.error("Failed to load insights:", error);
        setInsights([]);
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
    const interval = setInterval(loadInsights, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [userMemberId, maxItems]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(maxItems)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-white/5 rounded-lg animate-pulse border border-white/10"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "gap-4",
        compact
          ? "grid grid-cols-2 md:grid-cols-4"
          : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      )}
    >
      {insights.length === 0 ? (
        <Card className="p-4 text-center text-muted-foreground">
          No insights available yet
        </Card>
      ) : (
        insights.map((insight, index) => (
          <SmartInsightCard key={insight.id} insight={insight} index={index} />
        ))
      )}
    </div>
  );
}

export function SmartInsightsWidget({ userMemberId }: { userMemberId?: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold">Your Insights</h2>
      </div>
      <SmartInsights userMemberId={userMemberId} maxItems={4} />
    </div>
  );
}
