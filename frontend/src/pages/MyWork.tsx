import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

import {
  storage,
  type Task,
  type TaskStatus,
  type TaskPriority,
  generateId,
  updateTask,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TaskDetailsDialog } from "@/components/TaskDetailsDialog";
import { cn } from "@/lib/utils";

type StatusSection = "Assigned" | "In Progress" | "Completed";

interface TaskGroup {
  status: StatusSection;
  tasks: Task[];
  color: string;
  icon: React.ReactNode;
}

function isPastDate(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00");
  return d.getTime() < today.getTime();
}

function priorityColor(priority: TaskPriority): string {
  switch (priority) {
    case "High":
      return "border border-red-200 bg-red-50 text-red-700";
    case "Medium":
      return "border border-amber-200 bg-amber-50 text-amber-700";
    case "Low":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

export default function MyWork() {
  const me = storage.getCurrentMember();
  const members = storage.getMembers();
  const allTasks = storage.getTasks();

  const [tasks, setTasks] = useState<Task[]>(allTasks);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // Form state for quick task creation
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");

  useEffect(() => {
    storage.setTasks(tasks);
  }, [tasks]);

  // Get tasks assigned to current user only
  const myTasks = useMemo(
    () => tasks.filter((t) => {
      const assignedTo = t.assignedTo;
      if (Array.isArray(assignedTo)) {
        return assignedTo.includes(me?.id ?? "");
      }
      return assignedTo === me?.id;
    }),
    [tasks, me?.id]
  );

  // Filter and organize tasks
  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return myTasks.filter((t) => {
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (!query) return true;
      return t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query);
    });
  }, [myTasks, search, priorityFilter]);

  const groupedTasks: TaskGroup[] = [
    {
      status: "Assigned",
      tasks: filteredTasks.filter((t) => t.status === "Assigned"),
      color: "from-gray-500",
      icon: <Circle className="h-5 w-5" />,
    },
    {
      status: "In Progress",
      tasks: filteredTasks.filter((t) => t.status === "In Progress"),
      color: "from-gray-600",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      status: "Completed",
      tasks: filteredTasks.filter((t) => t.status === "Completed"),
      color: "from-gray-400",
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
  ];

  const stats = useMemo(
    () => ({
      total: myTasks.length,
      assigned: myTasks.filter((t) => t.status === "Assigned").length,
      inProgress: myTasks.filter((t) => t.status === "In Progress").length,
      completed: myTasks.filter((t) => t.status === "Completed").length,
      overdue: myTasks.filter((t) => isPastDate(t.deadline) && t.status !== "Completed").length,
    }),
    [myTasks]
  );

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailsOpen(true);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updates: Partial<Task> = {
          status: newStatus,
          updatedAt: Date.now(),
        };
        if (newStatus === "Completed") {
          updates.completedAt = Date.now();
        }
        return { ...t, ...updates };
      })
    );
    toast.success(`Moved to ${newStatus}`);
  };

  const handleCreateTask = () => {
    if (!formTitle.trim() || !me) return;

    const newTask: Task = {
      id: generateId(),
      title: formTitle.trim(),
      description: formDescription.trim(),
      assignedTo: [me.id], // Self-assigned
      deadline: format(new Date(), "yyyy-MM-dd"),
      priority: "Medium",
      status: "Assigned",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setFormTitle("");
    setFormDescription("");
    setCreateOpen(false);
    toast.success("Task created");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="page-title mono-title">My Work</h2>
            <p className="page-subtitle mt-1">Tasks assigned to you</p>
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your tasks..."
                className="pl-9 w-64 rounded-full input-glass border-0"
              />
            </div>

            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | "all")}>
              <SelectTrigger className="w-40 rounded-full input-glass border-0">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => setCreateOpen(true)}
              className="rounded-full bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg"
            >
              + Create Task
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total },
          { label: "Assigned", value: stats.assigned },
          { label: "In Progress", value: stats.inProgress },
          { label: "Completed", value: stats.completed },
          { label: "Overdue", value: stats.overdue, highlight: stats.overdue > 0 },
        ].map((stat) => (
          <Card
            key={stat.label}
            className={cn(
              "glass-card transition-all",
              stat.highlight && "border-red-500/30 bg-red-500/5"
            )}
          >
            <CardContent className="p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className={cn("text-2xl font-bold mt-1", stat.highlight && "text-red-400")}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task Groups */}
      <div className="space-y-6">
        <AnimatePresence>
          {groupedTasks.map((group) => (
            <motion.div
              key={group.status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-card border-neutral-200">
                <CardHeader className="border-b border-neutral-200">
                  <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                      {group.icon}
                      <div>
                        <CardTitle className="text-lg">{group.status}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {group.tasks.length} {group.tasks.length === 1 ? "task" : "tasks"}
                        </p>
                      </div>
                    </div>
                    <Badge className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-neutral-700">
                      {group.tasks.length}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4">
                  {group.tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground/70">No tasks in this section</p>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence>
                        {group.tasks.map((task) => {
                          const isPastDue = isPastDate(task.deadline) && task.status !== "Completed";
                          return (
                            <motion.div
                              key={task.id}
                              layout
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              onClick={() => handleTaskClick(task)}
                              className={cn(
                                "cursor-pointer rounded-lg border border-neutral-200 bg-white p-3",
                                "transition-all hover:border-neutral-300 hover:bg-neutral-50",
                                isPastDue && "border-red-500/30 bg-red-500/5"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-sm break-words">{task.title}</h3>
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex gap-2 items-center mt-2 flex-wrap">
                                    <Badge className={cn("text-xs px-2 py-0.5", priorityColor(task.priority))}>
                                      <Flag className="h-3 w-3 mr-1" />
                                      {task.priority}
                                    </Badge>
                                    <Badge className="border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">
                                      {format(new Date(task.deadline + "T00:00:00"), "MMM d")}
                                    </Badge>
                                    {isPastDue && (
                                      <Badge className="flex items-center gap-1 border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-700">
                                        <AlertCircle className="h-3 w-3" />
                                        Overdue
                                      </Badge>
                                    )}
                                    {task.isFavorite && (
                                      <Badge className="border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                                        Favorite
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <Select
                                  value={task.status}
                                  onValueChange={(v) => handleStatusChange(task.id, v as TaskStatus)}
                                >
                                  <SelectTrigger className="w-32 rounded-lg bg-white border-neutral-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Assigned">Assigned</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        task={selectedTask}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        isAdmin={storage.isAdmin()}
      />

      {/* Create Task Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Title
              </Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && formTitle.trim()) {
                    handleCreateTask();
                  }
                }}
                placeholder="Task title..."
                className="rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Description
              </Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Add details..."
                rows={3}
                className="rounded-lg"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button onClick={handleCreateTask} className="rounded-lg">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

