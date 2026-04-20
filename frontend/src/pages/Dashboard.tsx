import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/storage";
import { CalendarCheck, Clock, TrendingUp, AlertCircle, CheckCircle2, Plus, ArrowRight, Maximize2 } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { MiniActivityPanel } from "@/components/MiniActivityPanel";
import type { Task } from "@/lib/storageTypes";
import { useNavigate } from "react-router-dom";

type FilterType = "all" | "my-tasks" | "high-priority" | "overdue";

export default function Dashboard() {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const { taskStats, userInfo, allTasks, filteredTasks, tasksByProject, weeklyCompletions, overdueAlerts } = useMemo(() => {
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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return deadline < today && t.status !== "Completed";
    }).length;

    const inProgressCount = allTasks.filter(t => t.status === "In Progress").length;
    const completedCount = allTasks.filter(t => t.status === "Completed").length;
    const productivity = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

    let tasksByFilter: Task[] = [];
    if (activeFilter === "all") {
      tasksByFilter = allTasks;
    } else if (activeFilter === "my-tasks") {
      tasksByFilter = allTasks.filter(t => {
        const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
        return assignees.includes(currentMember?.id ?? "");
      });
    } else if (activeFilter === "high-priority") {
      tasksByFilter = allTasks.filter(t => t.priority === "High");
    } else if (activeFilter === "overdue") {
      tasksByFilter = allTasks.filter(t => {
        const deadline = new Date(t.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return deadline < today && t.status !== "Completed";
      });
    }

    const overdueAlerts = allTasks
      .filter(t => {
        const deadline = new Date(t.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return deadline < today && t.status !== "Completed";
      })
      .slice(0, 3);

    const weeklyData = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      const dateStr = format(date, "yyyy-MM-dd");
      const count = allTasks.filter(t => {
        const completedDate = t.completedAt ? format(new Date(t.completedAt), "yyyy-MM-dd") : null;
        return completedDate === dateStr;
      }).length;
      return { day: format(date, "MMM d"), completed: count };
    });

    const tasksByProject: Record<string, Task[]> = {};
    allTasks.forEach(task => {
      const project = task.project || "Unassigned";
      if (!tasksByProject[project]) {
        tasksByProject[project] = [];
      }
      tasksByProject[project].push(task);
    });

    const userInfo = currentMember || { name: "User", id: "", role };

    return {
      taskStats: {
        today: tasksToday.length,
        completed: completedToday.length,
        inProgress: inProgressCount,
        overdue: overdueCount,
        productivity,
      },
      userInfo,
      allTasks,
      filteredTasks: tasksByFilter,
      tasksByProject,
      weeklyCompletions: weeklyData,
      overdueAlerts,
    };
  }, [today, activeFilter]);

  const analyticsCards = [
    { title: "Today", value: taskStats.today, icon: CalendarCheck },
    { title: "In Progress", value: taskStats.inProgress, icon: Clock },
    { title: "Completed", value: taskStats.completed, icon: CheckCircle2 },
    { title: "Productivity", value: `${taskStats.productivity}%`, icon: TrendingUp },
  ];

  const displayTasks = activeFilter === "all" ? allTasks : filteredTasks;
  const assignedTasks = displayTasks.filter(t => t.status === "Assigned").slice(0, 3);
  const inProgressTasks = displayTasks.filter(t => t.status === "In Progress").slice(0, 3);
  const completedTasks = displayTasks.filter(t => t.status === "Completed").slice(0, 3);
  const tasksCalcDueToday = displayTasks.filter(t => t.deadline === today && t.status !== "Completed");

  return (
    <div className="space-y-8 pb-8">
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Welcome back, {userInfo.name}!</h1>
        <p className="text-sm font-medium text-gray-500 mt-2 flex items-center gap-2">
          📅 {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsCards.map(c => (
          <Card key={c.title} className="bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all duration-300 cursor-pointer shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{c.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-3">{c.value}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                  <c.icon className="h-5 w-5" style={{ color: "#0066ff" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {overdueAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">?? {overdueAlerts.length} Overdue {overdueAlerts.length === 1 ? "Task" : "Tasks"}</p>
              <p className="text-sm text-red-700 mt-1">{overdueAlerts.map(t => t.title).join(", ")}</p>
            </div>
            <Button size="sm" onClick={() => navigate("/my-work")} className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white">
              View ?
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center border-b border-gray-200 pb-4">
        {[
          { id: "all", label: "Show all" },
          { id: "my-tasks", label: "My Tasks" },
          { id: "high-priority", label: "High Priority" },
          { id: "overdue", label: "Overdue" },
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as FilterType)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeFilter === filter.id
                ? "text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={activeFilter === filter.id ? { backgroundColor: "#0066ff" } : {}}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border border-gray-200 rounded-lg">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" style={{ color: "#0066ff" }} />
                My Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase">Assigned</h4>
                  <div className="space-y-2">
                    {assignedTasks.length > 0 ? (
                      assignedTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => navigate(`/focus/${task.id}`)}
                          className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200 hover:border-gray-300"
                        >
                          <p className="text-xs font-medium text-gray-900 line-clamp-2 hover:text-blue-600">{task.title}</p>
                          <p className="text-xs text-gray-400 mt-2">{format(new Date(task.deadline), "MMM d")}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No assigned tasks</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase">In Progress</h4>
                  <div className="space-y-2">
                    {inProgressTasks.length > 0 ? (
                      inProgressTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => navigate(`/focus/${task.id}`)}
                          className="p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200 hover:border-blue-300"
                        >
                          <p className="text-xs font-medium text-gray-900 line-clamp-2 hover:text-blue-700">{task.title}</p>
                          <p className="text-xs text-gray-400 mt-2">{format(new Date(task.deadline), "MMM d")}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No in-progress tasks</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase">Completed</h4>
                  <div className="space-y-2">
                    {completedTasks.length > 0 ? (
                      completedTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => navigate(`/focus/${task.id}`)}
                          className="p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors cursor-pointer border border-green-200 hover:border-green-300"
                        >
                          <p className="text-xs font-medium text-gray-900 line-clamp-2 hover:text-blue-700 line-through text-gray-500">{task.title}</p>
                          <p className="text-xs text-gray-400 mt-2">{format(new Date(task.completedAt || task.deadline), "MMM d")}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No completed tasks</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {tasksCalcDueToday.length > 0 && (
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: "#dc2626" }} />
                  Due Today
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-2">
                  {tasksCalcDueToday.map(task => (
                    <div
                      key={task.id}
                      onClick={() => navigate(`/focus/${task.id}`)}
                      className="flex items-center justify-between p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors cursor-pointer border border-red-200 group"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-red-700">{task.title}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">{task.status}</p>
                      </div>
                      <div><p className="text-xs font-bold text-white px-3 py-1 rounded-full" style={{ backgroundColor: "#dc2626" }}>{task.priority || "Normal"}</p></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: "#0066ff" }} />
                Weekly Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-56 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyCompletions}>
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#999" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#999" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", background: "#ffffff", fontSize: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
                    <Line type="monotone" dataKey="completed" stroke="#0066ff" strokeWidth={2} dot={{ fill: "#0066ff", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white border border-gray-200 rounded-lg">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-lg text-gray-900">Projects</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {Object.entries(tasksByProject).length > 0 ? (
                Object.entries(tasksByProject).slice(0, 5).map(([projectName, tasks]) => {
                  const completedCount = tasks.filter(t => t.status === "Completed").length;
                  const percentage = Math.round((completedCount / tasks.length) * 100);
                  return (
                    <div key={projectName} onClick={() => setExpandedProject(expandedProject === projectName ? null : projectName)} className="cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">{projectName}</p>
                        <span className="text-xs font-semibold text-gray-500">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div style={{ backgroundColor: "#0066ff", height: "0.5rem", borderRadius: "9999px", transition: "all 300ms", width: `${percentage}%` }} />
                      </div>
                      {expandedProject === projectName && (
                        <div className="mt-2 space-y-1 text-xs py-2 border-t border-gray-100 pt-2">
                          {tasks.slice(0, 3).map(t => (
                            <div key={t.id} className="flex items-center gap-2 text-gray-600">
                              <span>{t.status === "Completed" ? "?" : "�"}</span>
                              <span className={t.status === "Completed" ? "line-through text-gray-400" : ""}>{t.title}</span>
                            </div>
                          ))}
                          {tasks.length > 3 && <p className="text-gray-400 font-medium">+{tasks.length - 3} more</p>}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-400">No projects yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: "#10b981" }} />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {completedTasks.length > 0 ? (
                completedTasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    className="group p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 border border-green-200 hover:border-green-300 cursor-pointer"
                    onClick={() => navigate(`/focus/${task.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-green-700 transition-colors line-clamp-1">
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {task.completedAt ? format(new Date(task.completedAt), "MMM d") : format(new Date(task.deadline), "MMM d")}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-white text-green-700 border border-green-200">
                          ✓ Done
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No completed tasks yet</p>
                  <p className="text-xs text-gray-400 mt-1">Complete a task to see it here</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <MiniActivityPanel limit={4} compact={true} />
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-2">
              <Button onClick={() => navigate("/tasks")} className="w-full justify-start text-white rounded-lg font-medium" style={{ backgroundColor: "#0066ff" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#0052cc"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#0066ff"}>
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
              <Button onClick={() => navigate("/my-work")} variant="outline" className="w-full justify-start border-gray-300 text-gray-900 hover:bg-gray-50 rounded-lg font-medium">
                <ArrowRight className="w-4 h-4 mr-2" />
                My Work
              </Button>
              <Button onClick={() => navigate("/board")} variant="outline" className="w-full justify-start border-gray-300 text-gray-900 hover:bg-gray-50 rounded-lg font-medium">
                <Maximize2 className="w-4 h-4 mr-2" />
                Board
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
