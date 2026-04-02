import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/storage";
import { CalendarCheck, Clock, TrendingUp, AlertCircle, Zap, CheckCircle2, Plus, ArrowRight, Maximize2, Lightbulb, Activity, Filter } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { MiniActivityPanel } from "@/components/MiniActivityPanel";
import type { Task } from "@/lib/storageTypes";
import { useNavigate } from "react-router-dom";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

type FilterType = "all" | "my-tasks" | "high-priority" | "overdue";

export default function Dashboard() {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const { taskStats, userInfo, allTasks, filteredTasks, tasksByProject, weeklyCompletions, overdueAlerts, insights } = useMemo(() => {
    const currentMember = storage.getCurrentMember();
    const allTasks = storage.getTasks() || [];

    // Task Statistics
    const tasksToday = allTasks.filter(t => t.deadline === today);
    const completedToday = allTasks.filter(t => {
      const completedDate = t.completedAt ? format(new Date(t.completedAt), "yyyy-MM-dd") : null;
      return completedDate === today;
    });
    
    const overdueCount = allTasks.filter(t => {
      const deadline = new Date(t.deadline);
      const now = new Date();
      return deadline < now && t.status !== "Completed";
    }).length;

    const completedCount = allTasks.filter(t => t.status === "Completed").length;
    const totalCount = allTasks.length;
    const productivityPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Apply filters based on activeFilter
    let filtered = allTasks;
    if (activeFilter === "my-tasks") {
      filtered = allTasks.filter(t => t.assignedTo === currentMember?.id);
    } else if (activeFilter === "high-priority") {
      filtered = allTasks.filter(t => t.priority === "High" && t.status !== "Completed");
    } else if (activeFilter === "overdue") {
      filtered = allTasks.filter(t => {
        const deadline = new Date(t.deadline);
        const now = new Date();
        return deadline < now && t.status !== "Completed";
      });
    }

    // Group by project
    const tasksByProject: Record<string, Task[]> = {};
    allTasks.forEach(task => {
      const proj = task.project || "Unassigned";
      if (!tasksByProject[proj]) tasksByProject[proj] = [];
      tasksByProject[proj].push(task);
    });

    // Weekly completions (last 7 days)
    const weeklyCompletions = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = format(d, "yyyy-MM-dd");
      const dayCompleted = allTasks.filter(t => {
        const completedDate = t.completedAt ? format(new Date(t.completedAt), "yyyy-MM-dd") : null;
        return completedDate === ds;
      }).length;
      weeklyCompletions.push({
        day: format(d, "EEE"),
        completed: dayCompleted,
      });
    }

    // Overdue alerts
    const overdueAlerts = allTasks
      .filter(t => {
        const deadline = new Date(t.deadline);
        const now = new Date();
        return deadline < now && t.status !== "Completed";
      })
      .slice(0, 3);

    // Smart Insights
    const insights = [
      completedToday.length > 0 && `🎉 You completed ${completedToday.length} task${completedToday.length !== 1 ? "s" : ""} today`,
      overdueCount > 0 && `⚠️ You have ${overdueCount} overdue task${overdueCount !== 1 ? "s" : ""}`,
      productivityPercent >= 80 && `🔥 Excellent productivity at ${productivityPercent}%`,
      productivityPercent < 50 && totalCount > 0 && `💪 Keep pushing! You're at ${productivityPercent}% completion`,
    ].filter(Boolean);

    return {
      taskStats: {
        tasksToday: tasksToday.length,
        completedToday: completedToday.length,
        overdue: overdueCount,
        productivity: productivityPercent,
      },
      userInfo: {
        name: currentMember?.name || "User",
        memberId: currentMember?.id,
      },
      allTasks,
      filteredTasks: filtered,
      tasksByProject,
      weeklyCompletions,
      overdueAlerts,
      insights: insights as string[],
    };
  }, [today, activeFilter]);

  const analyticsCards = [
    {
      title: "Tasks Today",
      value: taskStats.tasksToday,
      icon: CalendarCheck,
      gradient: "from-gray-500/10 to-gray-500/5",
      iconColor: "text-gray-400",
    },
    {
      title: "Completed Today",
      value: taskStats.completedToday,
      icon: CheckCircle2,
      gradient: "from-gray-500/10 to-gray-500/5",
      iconColor: "text-gray-400",
    },
    {
      title: "Overdue Tasks",
      value: taskStats.overdue,
      icon: AlertCircle,
      gradient: "from-gray-500/10 to-gray-500/5",
      iconColor: "text-gray-400",
    },
    {
      title: "Productivity",
      value: `${taskStats.productivity}%`,
      icon: TrendingUp,
      gradient: "from-gray-500/10 to-gray-500/5",
      iconColor: "text-gray-400",
    },
  ];

  // Get task sections for My Tasks Snapshot - use filtered tasks if filtering
  const displayTasks = activeFilter === "all" ? allTasks : filteredTasks;
  const assignedTasks = displayTasks.filter(t => t.status === "Assigned").slice(0, 3);
  const inProgressTasks = displayTasks.filter(t => t.status === "In Progress").slice(0, 3);
  const completedTasks = displayTasks.filter(t => t.status === "Completed").slice(0, 3);

  // Get tasks due today for focus strip
  const tasksCalcDueToday = displayTasks.filter(t => t.deadline === today && t.status !== "Completed");

  return (
    <div className="space-y-6">
      {/* 1. HERO GREETING & ANALYTICS SECTION */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {userInfo.name}! 👋</h1>
          <p className="text-muted-foreground mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>

        {/* Smart Insights */}
        {insights.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 flex-wrap"
          >
            {insights.map((insight, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm text-white flex items-center gap-2"
              >
                <Lightbulb className="w-4 h-4 flex-shrink-0" />
                {insight}
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {analyticsCards.map(c => (
            <motion.div key={c.title} variants={item}>
              <Card className="glass-card rounded-xl hover:shadow-md transition-all duration-300 group overflow-hidden cursor-pointer hover:border-white/30">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{c.title}</p>
                      <p className="text-3xl font-bold mt-2">{c.value}</p>
                    </div>
                    <div className={`h-11 w-11 rounded-lg bg-gradient-to-br ${c.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <c.icon className={`h-5 w-5 ${c.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* 2. OVERDUE ALERT CARD */}
      {overdueAlerts.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white">⚠️ You have {overdueAlerts.length} overdue {overdueAlerts.length === 1 ? "task" : "tasks"}</p>
            <p className="text-sm text-gray-400 mt-1">{overdueAlerts.map(t => t.title).join(", ")}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate("/my-work")} className="text-white hover:text-gray-300 flex-shrink-0">
            Fix Now →
          </Button>
        </motion.div>
      )}

      {/* QUICK FILTERS */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Filter:</span>
        </div>
        {[
          { id: "all", label: "All Tasks" },
          { id: "my-tasks", label: "My Tasks" },
          { id: "high-priority", label: "High Priority" },
          { id: "overdue", label: "Overdue" },
        ].map(filter => (
          <motion.button
            key={filter.id}
            whileHover={{ scale: 1.05 }}
            onClick={() => setActiveFilter(filter.id as FilterType)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeFilter === filter.id
                ? "bg-white/20 border border-white/30 text-white"
                : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10"
            }`}
          >
            {filter.label}
          </motion.button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: TASKS SNAPSHOT & TODAY FOCUS */}
        <div className="lg:col-span-2 space-y-6">
          {/* MY TASKS SNAPSHOT */}
          <Card className="glass-card rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                My Tasks Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Three columns for Assigned, In Progress, Completed */}
              <div className="grid grid-cols-3 gap-3">
                {/* ASSIGNED */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Assigned</h4>
                  <div className="space-y-2">
                    {assignedTasks.length > 0 ? (
                      assignedTasks.map(task => (
                        <motion.div
                          key={task.id}
                          whileHover={{ x: 4 }}
                          className="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/focus/${task.id}`)}
                        >
                          <p className="text-xs font-medium line-clamp-2 group-hover:text-blue-300">{task.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{format(new Date(task.deadline), "MMM d")}</p>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground/60">No assigned tasks</p>
                    )}
                  </div>
                </motion.div>

                {/* IN PROGRESS */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-2">
                  <h4 className="text-xs font-semibold text-white uppercase">In Progress</h4>
                  <div className="space-y-2">
                    {inProgressTasks.length > 0 ? (
                      inProgressTasks.map(task => (
                        <motion.div
                          key={task.id}
                          whileHover={{ x: 4 }}
                          className="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/focus/${task.id}`)}
                        >
                          <p className="text-xs font-medium line-clamp-2 group-hover:text-white">{task.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{format(new Date(task.deadline), "MMM d")}</p>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground/60">No tasks in progress</p>
                    )}
                  </div>
                </motion.div>

                {/* COMPLETED */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-2">
                  <h4 className="text-xs font-semibold text-white uppercase">Completed</h4>
                  <div className="space-y-2">
                    {completedTasks.length > 0 ? (
                      completedTasks.map(task => (
                        <div key={task.id} className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                          <p className="text-xs font-medium line-clamp-2 text-gray-300 line-through">{task.title}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">✓ Done</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground/60">No completed tasks</p>
                    )}
                  </div>
                </motion.div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate("/my-work")}
                >
                  View All Tasks <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* TODAY FOCUS STRIP */}
          {tasksCalcDueToday.length > 0 && (
            <Card className="glass-card rounded-xl border-white/10 bg-gradient-to-r from-white/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Due Today ({tasksCalcDueToday.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-3 min-w-min">
                    {tasksCalcDueToday.map(task => (
                      <motion.div
                        key={task.id}
                        whileHover={{ y: -4 }}
                        className="min-w-[200px] p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors cursor-pointer"
                        onClick={() => navigate(`/focus/${task.id}`)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium line-clamp-2 flex-1">{task.title}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/focus/${task.id}`);
                            }}
                            className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
                          >
                            <Maximize2 className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        <p className="text-xs font-medium text-gray-300">
                          {task.priority} Priority
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* WEEKLY COMPLETION CHART */}
          <Card className="glass-card rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">Tasks Completed — Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyCompletions}>
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: PROJECTS, ACTIVITY & QUICK ACTIONS */}
        <div className="space-y-6">
          {/* PROJECTS SECTION */}
          <Card className="glass-card rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">Projects Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(tasksByProject).length > 0 ? (
                Object.entries(tasksByProject).map(([projectName, tasks]) => {
                  const completed = tasks.filter(t => t.status === "Completed").length;
                  const percentage = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
                  return (
                    <motion.div key={projectName} className="space-y-2">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => setExpandedProject(expandedProject === projectName ? null : projectName)}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="text-sm font-semibold truncate">{projectName}</h4>
                          <span className="text-xs bg-white/10 px-2 py-1 rounded">{completed}/{tasks.length}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.6 }}
                            className="bg-white/40 h-full rounded-full"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{percentage}% complete</p>
                      </motion.div>
                      {expandedProject === projectName && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="ml-2 space-y-1 text-xs max-h-32 overflow-y-auto"
                        >
                          {tasks.slice(0, 3).map(t => (
                            <div key={t.id} className="flex items-center gap-2 text-muted-foreground">
                              <span>{t.status === "Completed" ? "✓" : "•"}</span>
                              <span className={t.status === "Completed" ? "line-through" : ""}>{t.title}</span>
                            </div>
                          ))}
                          {tasks.length > 3 && <p className="text-muted-foreground/60">+{tasks.length - 3} more</p>}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground/60">No projects yet</p>
              )}
            </CardContent>
          </Card>

          {/* ACTIVITY PANEL */}
          <Card className="glass-card rounded-xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MiniActivityPanel limit={5} compact={true} />
            </CardContent>
          </Card>

          {/* QUICK ACTIONS */}
          <Card className="glass-card rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <motion.div whileHover={{ scale: 1.02 }}>
                <Button
                  onClick={() => navigate("/tasks")}
                  className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Task
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }}>
                <Button
                  onClick={() => navigate("/my-work")}
                  className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Go to My Work
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }}>
                <Button
                  onClick={() => navigate("/board")}
                  className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Board
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
