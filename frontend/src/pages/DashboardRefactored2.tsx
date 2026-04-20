import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/storage";
import { CalendarCheck, Clock, TrendingUp, AlertCircle, Zap, CheckCircle2, Plus, ArrowRight, Maximize2, Lightbulb, Activity, Filter, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { MiniActivityPanel } from "@/components/MiniActivityPanel";
import type { Task } from "@/lib/storageTypes";
import { useNavigate } from "react-router-dom";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

type FilterType = "all" | "my-tasks" | "high-priority" | "overdue";

export default function Dashboard() {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const { taskStats, userInfo, allTasks, filteredTasks, tasksByProject, weeklyCompletions, overdueAlerts, insights } = useMemo(() => {
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

    let filtered = allTasks;
    if (activeFilter === "my-tasks") {
      filtered = allTasks.filter((t) => {
        const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
        return assignees.includes(currentMember?.id ?? "");
      });
    } else if (activeFilter === "high-priority") {
      filtered = allTasks.filter(t => t.priority === "High" && t.status !== "Completed");
    } else if (activeFilter === "overdue") {
      filtered = allTasks.filter(t => {
        const deadline = new Date(t.deadline);
        const now = new Date();
        return deadline < now && t.status !== "Completed";
      });
    }

    const tasksByProject: Record<string, Task[]> = {};
    allTasks.forEach(task => {
      const proj = task.project || "Unassigned";
      if (!tasksByProject[proj]) tasksByProject[proj] = [];
      tasksByProject[proj].push(task);
    });

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

    const overdueAlerts = allTasks
      .filter(t => {
        const deadline = new Date(t.deadline);
        const now = new Date();
        return deadline < now && t.status !== "Completed";
      })
      .slice(0, 3);

    const insights = [
      completedToday.length > 0 && `🎉 Great! You completed ${completedToday.length} task${completedToday.length !== 1 ? "s" : ""} today`,
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
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Completed Today",
      value: taskStats.completedToday,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Overdue Tasks",
      value: taskStats.overdue,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Productivity",
      value: `${taskStats.productivity}%`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ];

  const displayTasks = activeFilter === "all" ? allTasks : filteredTasks;
  const assignedTasks = displayTasks.filter(t => t.status === "Assigned").slice(0, 3);
  const inProgressTasks = displayTasks.filter(t => t.status === "In Progress").slice(0, 3);
  const completedTasks = displayTasks.filter(t => t.status === "Completed").slice(0, 3);
  const tasksCalcDueToday = displayTasks.filter(t => t.deadline === today && t.status !== "Completed");

  return (
    <div className="space-y-8">
      {/* HERO GREETING SECTION */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <h1 className="page-title">Welcome back, {userInfo.name}!</h1>
          </div>
          <p className="page-subtitle">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>

        {/* Smart Insights */}
        {insights.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 flex-wrap"
          >
            {insights.map((insight, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900 flex items-center gap-2 font-medium"
              >
                <Lightbulb className="w-4 h-4 flex-shrink-0" />
                {insight}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ANALYTICS CARDS GRID */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {analyticsCards.map(c => (
            <motion.div key={c.title} variants={item}>
              <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{c.title}</p>
                      <p className="text-3xl font-bold text-neutral-900">{c.value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-xl ${c.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <c.icon className={`h-6 w-6 ${c.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* OVERDUE ALERT CARD */}
      {overdueAlerts.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border border-red-200 rounded-lg p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-900">You have {overdueAlerts.length} overdue {overdueAlerts.length === 1 ? "task" : "tasks"}</p>
            <p className="text-sm text-red-700 mt-1">{overdueAlerts.map(t => t.title).join(", ")}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate("/my-work")} className="text-red-600 hover:text-red-700 hover:bg-red-100 flex-shrink-0 font-medium">
            Fix Now →
          </Button>
        </motion.div>
      )}

      {/* QUICK FILTERS */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 flex-wrap items-center pb-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          <span className="text-sm text-neutral-500 font-medium">Filter:</span>
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
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeFilter === filter.id
                ? "bg-[#5B7DC8] text-white shadow-md shadow-[#5B7DC8]/30 border border-[#4A6DC0]"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200"
            }`}
          >
            {filter.label}
          </motion.button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: TASKS SNAPSHOT & TODAY FOCUS */}
        <div className="lg:col-span-2 space-y-8">
          {/* MY TASKS SNAPSHOT */}
          <Card className="hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-6 border-b border-neutral-200">
              <CardTitle className="text-lg flex items-center gap-2 text-neutral-900">
                <Zap className="w-5 h-5 text-amber-500" />
                Tasks Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                {/* ASSIGNED */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Assigned</h4>
                  <div className="space-y-2">
                    {assignedTasks.length > 0 ? (
                      assignedTasks.map(task => (
                        <motion.div
                          key={task.id}
                          whileHover={{ x: 4 }}
                          className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 transition-all cursor-pointer group"
                          onClick={() => navigate(`/focus/${task.id}`)}
                        >
                          <p className="text-sm font-medium text-neutral-900 line-clamp-2 group-hover:text-blue-700">{task.title}</p>
                          <p className="text-xs text-neutral-500 mt-1">{format(new Date(task.deadline), "MMM d")}</p>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-400">No assigned tasks</p>
                    )}
                  </div>
                </motion.div>

                {/* IN PROGRESS */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="space-y-3">
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">In Progress</h4>
                  <div className="space-y-2">
                    {inProgressTasks.length > 0 ? (
                      inProgressTasks.map(task => (
                        <motion.div
                          key={task.id}
                          whileHover={{ x: 4 }}
                          className="p-3 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer group"
                          onClick={() => navigate(`/focus/${task.id}`)}
                        >
                          <p className="text-sm font-medium text-neutral-900 line-clamp-2 group-hover:text-blue-700">{task.title}</p>
                          <p className="text-xs text-neutral-500 mt-1">{format(new Date(task.deadline), "MMM d")}</p>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-400">No tasks in progress</p>
                    )}
                  </div>
                </motion.div>

                {/* COMPLETED */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-3">
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Completed</h4>
                  <div className="space-y-2">
                    {completedTasks.length > 0 ? (
                      completedTasks.map(task => (
                        <div key={task.id} className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                          <p className="text-sm font-medium text-neutral-600 line-clamp-2 line-through">{task.title}</p>
                          <p className="text-xs text-emerald-600 mt-1 font-medium">✓ Done</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-400">No completed tasks</p>
                    )}
                  </div>
                </motion.div>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-200">
                <Button
                  variant="outline"
                  className="w-full border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                  onClick={() => navigate("/my-work")}
                >
                  View All Tasks <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* TODAY FOCUS STRIP */}
          {tasksCalcDueToday.length > 0 && (
            <Card className="hover:shadow-md transition-all duration-300 border-blue-200 bg-gradient-to-br from-blue-50/50 to-transparent">
              <CardHeader className="pb-4 border-b border-blue-200">
                <CardTitle className="text-base flex items-center gap-2 text-neutral-900">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Due Today <span className="ml-auto bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold">{tasksCalcDueToday.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto pb-2 -mx-6 px-6">
                  <div className="flex gap-4 min-w-min">
                    {tasksCalcDueToday.map(task => (
                      <motion.div
                        key={task.id}
                        whileHover={{ y: -4 }}
                        className="min-w-[220px] p-4 rounded-xl bg-white border border-blue-200 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => navigate(`/focus/${task.id}`)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <p className="text-sm font-semibold text-neutral-900 line-clamp-2 flex-1">{task.title}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/focus/${task.id}`);
                            }}
                            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <Maximize2 className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                        <div className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg">
                          {task.priority} Priority
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* WEEKLY COMPLETION CHART */}
          <Card className="hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-6 border-b border-neutral-200">
              <CardTitle className="text-base text-neutral-900">Tasks Completed — Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-56 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyCompletions}>
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#999" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#999" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        background: "#ffffff",
                        fontSize: 12,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#1fa3b1"
                      strokeWidth={3}
                      dot={{ fill: "#1fa3b1", r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: PROJECTS, ACTIVITY & QUICK ACTIONS */}
        <div className="space-y-8">
          {/* PROJECTS SECTION */}
          <Card className="hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-6 border-b border-neutral-200">
              <CardTitle className="text-base text-neutral-900">Projects Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {Object.entries(tasksByProject).length > 0 ? (
                Object.entries(tasksByProject).map(([projectName, tasks]) => {
                  const completed = tasks.filter(t => t.status === "Completed").length;
                  const percentage = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
                  return (
                    <motion.div key={projectName} className="space-y-2">
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 transition-all cursor-pointer"
                        onClick={() => setExpandedProject(expandedProject === projectName ? null : projectName)}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="text-sm font-semibold text-neutral-900 truncate">{projectName}</h4>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap">{completed}/{tasks.length}</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.6 }}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
                          />
                        </div>
                        <p className="text-xs text-neutral-500 mt-2 font-medium">{percentage}% complete</p>
                      </motion.div>
                      {expandedProject === projectName && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="ml-2 space-y-1 text-xs max-h-40 overflow-y-auto py-2"
                        >
                          {tasks.slice(0, 3).map(t => (
                            <div key={t.id} className="flex items-center gap-2 text-neutral-600">
                              <span className="flex-shrink-0">{t.status === "Completed" ? "✓" : "•"}</span>
                              <span className={t.status === "Completed" ? "line-through text-neutral-500" : ""}>{t.title}</span>
                            </div>
                          ))}
                          {tasks.length > 3 && <p className="text-neutral-400 font-medium">+{tasks.length - 3} more</p>}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })
              ) : (
                <p className="text-sm text-neutral-400 text-center py-4">No projects yet</p>
              )}
            </CardContent>
          </Card>

          {/* ACTIVITY PANEL */}
          <Card className="hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-6 border-b border-neutral-200">
              <CardTitle className="text-base flex items-center gap-2 text-neutral-900">
                <Activity className="w-4 h-4 text-blue-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <MiniActivityPanel limit={5} compact={true} />
            </CardContent>
          </Card>

          {/* QUICK ACTIONS */}
          <Card className="hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-6 border-b border-neutral-200">
              <CardTitle className="text-base text-neutral-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => navigate("/tasks")}
                  className="w-full justify-start bg-[#5B7DC8] hover:bg-[#4A6DC0] text-white shadow-md shadow-[#5B7DC8]/30 rounded-xl font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Task
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => navigate("/my-work")}
                  variant="outline"
                  className="w-full justify-start border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-xl font-medium"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Go to My Work
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => navigate("/board")}
                  variant="outline"
                  className="w-full justify-start border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-xl font-medium"
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
