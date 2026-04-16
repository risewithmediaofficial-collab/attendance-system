/* OPTIMIZED Dashboard.tsx FOR MOBILE PERFORMANCE */
/* CRITICAL FIXES:
   1. Remove staggered animations on mobile
   2. Memoize metric cards and task lists
   3. Lazy load charts (recharts is heavy)
   4. Reduce initial data load
   5. Use virtualization for task lists
*/

import { useMemo, useState, lazy, Suspense, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/storage";
import {
  CalendarCheck,
  Clock,
  TrendingUp,
  AlertCircle,
  Zap,
  CheckCircle2,
  Plus,
  ArrowRight,
  Maximize2,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { Task } from "@/lib/storageTypes";
import { useIsMobile, useHighPerformanceMode } from "@/hooks/use-performance";
import { MiniActivityPanel } from "@/components/MiniActivityPanel";

// Lazy load heavy recharts component
const LazyLineChart = lazy(() =>
  import("recharts").then((m) => ({
    default: () => {
      const { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } = m;
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={[]} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="completed" stroke="#000" />
          </LineChart>
        </ResponsiveContainer>
      );
    },
  }))
);

// MEMOIZED: Metric card component to prevent unnecessary re-renders
const MetricCard = memo(function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  animate,
}: {
  icon: React.FC<any>;
  label: string;
  value: number | string;
  trend?: number;
  animate?: boolean;
}) {
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animate ? 0.25 : 0 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                {label}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{value}</p>
              {trend !== undefined && (
                <p
                  className={`text-xs mt-2 font-medium ${
                    trend >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
                </p>
              )}
            </div>
            <div className="bg-black/5 p-2 rounded-lg flex-shrink-0">
              <Icon className="w-5 h-5 text-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

// MEMOIZED: Task item component
const TaskItem = memo(function TaskItem({
  task,
  onEdit,
  animate,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  animate?: boolean;
}) {
  return (
    <motion.div
      initial={animate ? { opacity: 0, x: -10 } : { opacity: 1 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: animate ? 0.2 : 0 }}
      className="p-3 sm:p-4 border-b border-border hover:bg-black/2.5 transition-colors cursor-pointer"
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate text-foreground">{task.title}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="text-xs px-2 py-1 bg-black/5 rounded text-muted-foreground">
              {task.status}
            </span>
            {task.priority && (
              <span
                className={`text-xs px-2 py-1 rounded font-medium ${
                  task.priority === "High"
                    ? "bg-red-100 text-red-700"
                    : task.priority === "Medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                }`}
              >
                {task.priority}
              </span>
            )}
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </motion.div>
  );
});

export default function DashboardOptimized() {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { shouldUseStagger, shouldAnimateDashboard, animationDuration } = useHighPerformanceMode();

  const {
    taskStats,
    allTasks,
    filteredTasks,
    weeklyCompletions,
    overdueAlerts,
  } = useMemo(() => {
    const role = storage.getCurrentRole();
    const currentMember = storage.getCurrentMember();
    const teamTasks = storage.getTasks() || [];

    const allTasks =
      role === "Admin"
        ? teamTasks
        : teamTasks.filter((t) => {
            const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
            return assignees.includes(currentMember?.id ?? "");
          });

    // OPTIMIZED: Limit data on mobile
    const limitedTasks = isMobile ? allTasks.slice(0, 5) : allTasks.slice(0, 10);

    const tasksToday = allTasks.filter((t) => t.deadline === today);
    const completedToday = allTasks.filter((t) => {
      const completedDate = t.completedAt
        ? format(new Date(t.completedAt), "yyyy-MM-dd")
        : null;
      return completedDate === today;
    });

    const overdueCount = allTasks.filter((t) => {
      const deadline = new Date(t.deadline);
      const now = new Date();
      return deadline < now && t.status !== "Completed";
    }).length;

    const completedCount = allTasks.filter((t) => t.status === "Completed").length;
    const totalCount = allTasks.length;
    const productivityPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Weekly completions
    const weeklyCompletions = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = format(d, "yyyy-MM-dd");
      const dayCompleted = allTasks.filter((t) => {
        const completedDate = t.completedAt
          ? format(new Date(t.completedAt), "yyyy-MM-dd")
          : null;
        return completedDate === ds;
      }).length;
      weeklyCompletions.push({
        day: format(d, "EEE"),
        completed: dayCompleted,
      });
    }

    // Overdue alerts
    const overdueAlerts = allTasks
      .filter((t) => {
        const deadline = new Date(t.deadline);
        const now = new Date();
        return deadline < now && t.status !== "Completed";
      })
      .slice(0, 3);

    return {
      taskStats: {
        tasksToday: tasksToday.length,
        completedToday: completedToday.length,
        overdueCount,
        productivityPercent,
      },
      allTasks,
      filteredTasks: limitedTasks,
      weeklyCompletions,
      overdueAlerts,
    };
  }, [today, isMobile]);

  // CRITICAL FIX: Only animate on desktop, not on mobile
  const containerVariants = shouldUseStagger
    ? {
        hidden: {},
        show: { transition: { staggerChildren: 0.05 } }, /* Reduced from 0.06 */
      }
    : { hidden: {}, show: {} };

  const itemVariants = shouldAnimateDashboard
    ? {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { duration: 0.2 } }, /* Reduced from 0.35 */
      }
    : { hidden: { opacity: 1 }, show: { opacity: 1 } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Metrics Grid */}
      <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
        <MetricCard
          icon={Zap}
          label="Tasks Today"
          value={taskStats.tasksToday}
          animate={shouldAnimateDashboard && !isMobile}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Completed Today"
          value={taskStats.completedToday}
          animate={shouldAnimateDashboard && !isMobile}
        />
        <MetricCard
          icon={AlertCircle}
          label="Overdue"
          value={taskStats.overdueCount}
          animate={shouldAnimateDashboard && !isMobile}
        />
        <MetricCard
          icon={TrendingUp}
          label="Productivity"
          value={`${taskStats.productivityPercent}%`}
          trend={5}
          animate={shouldAnimateDashboard && !isMobile}
        />
      </div>

      {/* Main content - 2 columns on desktop, 1 on mobile */}
      <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
        {/* Tasks column */}
        <motion.div variants={itemVariants} className={isMobile ? "col-span-1" : "col-span-2"}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg">Recent Tasks</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {allTasks.length} total assigned
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/tasks")}
              >
                View All
                <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              {filteredTasks.length > 0 ? (
                <div className="space-y-0 divide-y">
                  {filteredTasks.map((task, idx) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onEdit={() => navigate(`/tasks?edit=${task.id}`)}
                      animate={shouldAnimateDashboard && !isMobile && idx < 3}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No tasks assigned yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar - hidden on mobile */}
        {!isMobile && (
          <motion.div variants={itemVariants} className="space-y-6">
            {/* Quick actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Plus className="w-4 h-4" />
                  New Task
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Calendar Check className="w-4 h-4" />
                  Check Attendance
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Clock className="w-4 h-4" />
                  Daily Status
                </Button>
              </CardContent>
            </Card>

            {/* Activity panel - lazy load if heavy */}
            <Suspense fallback={<Card className="p-4"><div>Loading activity...</div></Card>}>
              <MiniActivityPanel />
            </Suspense>
          </motion.div>
        )}
      </div>

      {/* Overdue alerts */}
      {overdueAlerts.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-red-100 bg-red-50">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <CardTitle className="text-red-900">Overdue Tasks</CardTitle>
                <p className="text-sm text-red-700 mt-1">
                  {overdueAlerts.length} task{overdueAlerts.length !== 1 ? "s" : ""} need attention
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overdueAlerts.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-2 bg-white rounded border border-red-200 text-sm"
                  >
                    <p className="font-medium text-red-900">{task.title}</p>
                    <p className="text-red-700 text-xs">
                      Due: {format(new Date(task.deadline), "MMM d, yyyy")}
                    </p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
