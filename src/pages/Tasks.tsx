import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CalendarDays,
  Flag,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCog,
} from "lucide-react";

import { storage, type Member, type Task, type TaskPriority, type TaskStatus, calculateHours, generateId, getDayName } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";

type Column = { key: TaskStatus; title: string; subtitle: string };

const columns: Column[] = [
  { key: "Assigned", title: "Assigned", subtitle: "Waiting to start" },
  { key: "In Progress", title: "In Progress", subtitle: "Actively working" },
  { key: "Completed", title: "Completed", subtitle: "Delivered / done" },
];

function isPastDate(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00");
  return d.getTime() < today.getTime();
}

function priorityBadge(priority: TaskPriority) {
  switch (priority) {
    case "High":
      return "bg-black/14 text-black/85 border border-black/24";
    case "Medium":
      return "bg-black/10 text-black/78 border border-black/20";
    case "Low":
      return "bg-black/7 text-black/68 border border-black/16";
  }
}

export default function Tasks() {
  const role = storage.getCurrentRole();
  const me = storage.getCurrentMember();
  const members = storage.getMembers();
  const [tasks, setTasks] = useState<Task[]>(storage.getTasks());

  // UI state
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAssignedTo, setFormAssignedTo] = useState<string>("");
  const [formDeadline, setFormDeadline] = useState<string>("");
  const [formPriority, setFormPriority] = useState<TaskPriority>("Medium");

  // persist tasks
  useEffect(() => {
    storage.setTasks(tasks);
  }, [tasks]);

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? "Unknown";

  const visibleTasks = useMemo(() => {
    const base = role === "Admin" ? tasks : tasks.filter((t) => t.assignedTo === me?.id);
    const q = search.trim().toLowerCase();
    const filtered = base.filter((t) => {
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        memberName(t.assignedTo).toLowerCase().includes(q)
      );
    });
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [tasks, role, search, priorityFilter, me?.id, members]);

  const stats = useMemo(() => {
    const total = visibleTasks.length;
    const completed = visibleTasks.filter((t) => t.status === "Completed").length;
    const inProgress = visibleTasks.filter((t) => t.status === "In Progress").length;
    const assigned = total - completed - inProgress;
    return { total, completed, inProgress, assigned };
  }, [visibleTasks]);

  function canEditTask(task: Task) {
    if (role === "Admin") return true;
    if (!me) return false;
    if (task.assignedTo !== me.id) return false;
    return role === "Employee" || role === "Intern";
  }

  function canChangeStatus(task: Task) {
    if (role === "Admin") return true;
    if (!me) return false;
    if (task.assignedTo !== me.id) return false;
    // Removed strict locking of completed or past-deadline tasks to allow corrections.
    return true;
  }

  const openCreate = () => {
    if (role !== "Admin") return;
    setFormTitle("");
    setFormDescription("");
    setFormAssignedTo(members.find((m) => m.role !== "Admin")?.id ?? members[0]?.id ?? "");
    setFormDeadline(format(new Date(), "yyyy-MM-dd"));
    setFormPriority("Medium");
    setCreateOpen(true);
  };

  const openEdit = (task: Task) => {
    if (!canEditTask(task) || role !== "Admin") return;
    setEditId(task.id);
    setFormTitle(task.title);
    setFormDescription(task.description);
    setFormAssignedTo(task.assignedTo);
    setFormDeadline(task.deadline);
    setFormPriority(task.priority);
    setEditOpen(true);
  };

  const saveNewTask = () => {
    if (role !== "Admin") return;
    if (!formTitle.trim() || !formAssignedTo || !formDeadline) return;
    const next: Task = {
      id: generateId(),
      title: formTitle.trim(),
      description: formDescription.trim(),
      assignedTo: formAssignedTo,
      deadline: formDeadline,
      priority: formPriority,
      status: "Assigned",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setTasks((prev) => [next, ...prev]);
    setCreateOpen(false);
    toast.success("Task assigned");
  };

  const saveEditTask = () => {
    if (role !== "Admin" || !editId) return;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== editId) return t;
        return {
          ...t,
          title: formTitle.trim(),
          description: formDescription.trim(),
          assignedTo: formAssignedTo,
          deadline: formDeadline,
          priority: formPriority,
          updatedAt: Date.now(),
        };
      }),
    );
    setEditOpen(false);
    toast.success("Task updated");
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setTasks((prev) => prev.filter((t) => t.id !== deleteId));
    setDeleteId(null);
    toast.success("Task deleted");
  };

  const updateStatus = (taskId: string, nextStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        if (!canChangeStatus(t)) return t;
        if (t.status === nextStatus) return t;
        const completedAt = nextStatus === "Completed" ? Date.now() : undefined;
        return {
          ...t,
          status: nextStatus,
          completedAt,
          updatedAt: Date.now(),
        };
      }),
    );
  };

  function onDropColumn(e: React.DragEvent, nextStatus: TaskStatus) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/taskId");
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateStatus(taskId, nextStatus);
    if (task.status !== nextStatus) toast.success(`Moved to ${nextStatus}`);
  }

  function canDropTask(task: Task) {
    return canChangeStatus(task);
  }

  const draggingTask = useMemo(() => null as Task | null, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="page-title mono-title">Task Management</h2>
          <p className="page-subtitle mt-1">
            Kanban board • {role} view
          </p>
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative w-72 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9 rounded-full input-glass border-0"
            />
          </div>

          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | "all")}>
            <SelectTrigger className="w-44 rounded-full input-glass border-0">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>

          <AnimatePresence>
            {role === "Admin" && (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={openCreate}
                  className="rounded-full shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Task
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assigned</p>
            <p className="text-2xl font-bold mt-1">{stats.assigned}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold mt-1">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold mt-1">{stats.completed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Board */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px] grid grid-cols-3 gap-4">
          {columns.map((col) => {
            const list = visibleTasks.filter((t) => t.status === col.key);
            return (
              <Card
                key={col.key}
                className="glass-card border-white/20 shadow-2xl rounded-2xl overflow-hidden"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDropColumn(e, col.key)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{col.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{col.subtitle}</p>
                    </div>
                    <Badge className="bg-white/10 border-white/20 text-foreground px-2 py-1 rounded-full">
                      {list.length}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-3 min-h-[520px]">
                  {list.length === 0 && (
                    <div className="text-sm text-muted-foreground/70 py-10 text-center">
                      No tasks here yet.
                    </div>
                  )}

                  <AnimatePresence>
                    {list.map((t) => {
                      const duePast = isPastDate(t.deadline);
                      const readOnly = !canDropTask(t);
                      return (
                        <motion.div
                          key={t.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={cn(
                            "rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-lg p-4 transition-all duration-200",
                            readOnly ? "opacity-70" : "hover:shadow-xl hover:bg-white/15",
                          )}
                          draggable={canChangeStatus(t)}
                          onDragStart={(e) => {
                            if (!canChangeStatus(t)) return;
                            e.dataTransfer.setData("text/taskId", t.id);
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{t.title}</p>
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                Assigned to {memberName(t.assignedTo)}
                              </p>
                            </div>
                            {role === "Admin" && (
                              <div className="flex gap-2">
                                <button
                                  className="rounded-lg p-1 hover:bg-white/10 transition-colors"
                                  title="Edit"
                                  onClick={() => openEdit(t)}
                                >
                                  <Pencil className="h-4 w-4 text-muted-foreground" />
                                </button>
                                <button
                                  className="rounded-lg p-1 hover:bg-black/10 transition-colors"
                                  title="Delete"
                                  onClick={() => setDeleteId(t.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-black/55" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex gap-2 items-center flex-wrap">
                            <Badge className={cn("px-2 py-1 rounded-full text-xs font-semibold", priorityBadge(t.priority))}>
                              <Flag className="h-3 w-3 inline-block mr-1" />
                              {t.priority}
                            </Badge>
                            <Badge className="bg-white/10 border border-white/20 px-2 py-1 rounded-full text-xs font-semibold text-muted-foreground">
                              <CalendarDays className="h-3 w-3 inline-block mr-1" />
                              Due {format(new Date(t.deadline + "T00:00:00"), "MMM d")}
                            </Badge>
                          </div>

                          {role === "Intern" && duePast && (
                            <div className="mt-3 text-xs text-muted-foreground">
                              Past deadline: view-only
                            </div>
                          )}

                          <div className="mt-3">
                            <Select
                              value={t.status}
                              onValueChange={(v) => updateStatus(t.id, v as TaskStatus)}
                              disabled={!canChangeStatus(t)}
                            >
                              <SelectTrigger className="w-full rounded-xl bg-white/10 border-white/20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Assigned">Assigned</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {role !== "Admin" && (
                            <div className="mt-2 text-xs text-muted-foreground/80 line-clamp-2">
                              {t.description ? t.description : "No description"}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Create dialog (Admin only) */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Title</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Prepare onboarding deck" className="rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Add context and expected output..." rows={3} className="rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assigned to</Label>
                <Select value={formAssignedTo} onValueChange={setFormAssignedTo}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Deadline</Label>
                <Input type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} className="rounded-xl" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Priority</Label>
              <Select value={formPriority} onValueChange={(v) => setFormPriority(v as TaskPriority)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={saveNewTask} className="rounded-xl">
              Assign Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog (Admin only) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Title</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="rounded-xl" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assigned to</Label>
                <Select value={formAssignedTo} onValueChange={setFormAssignedTo}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Deadline</Label>
                <Input type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} className="rounded-xl" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Priority</Label>
              <Select value={formPriority} onValueChange={(v) => setFormPriority(v as TaskPriority)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={saveEditTask} className="rounded-xl">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Task"
        description="This task will be permanently removed."
      />
    </div>
  );
}

