import { useState, useMemo, useCallback } from "react";
import { storage } from "../lib/storage";
import { Task, TaskPriority, TaskStatus, Member } from "../lib/storageTypes";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { TaskDetailsDialog } from "../components/TaskDetailsDialog";
import { Checkbox } from "../components/ui/checkbox";
import { Edit2, Star, AlertCircle } from "lucide-react";

interface EditingState {
  taskId?: string;
  field?: string;
}

const priorityConfig: Record<TaskPriority, string> = {
  Low: "text-gray-400",
  Medium: "text-gray-600",
  High: "text-gray-800",
};

const statusConfig: Record<TaskStatus, string> = {
  Assigned: "bg-gray-100 text-gray-700",
  "In Progress": "bg-gray-200 text-gray-800",
  Completed: "bg-gray-50 text-gray-500",
};

export function ListView() {
  const role = storage.getCurrentRole();
  const currentMember = storage.getCurrentMember();
  const tasks = storage.getTasks();
  const members = storage.getMembers();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "All">("All");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("All");
  const [projectFilter, setProjectFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"deadline" | "priority" | "created" | "updated">("deadline");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<EditingState>({});
  const [detailsTaskId, setDetailsTaskId] = useState<string | null>(null);

  const visibleTasks = useMemo(() => {
    if (role === "Admin") return tasks;
    if (!currentMember?.id) return [];
    return tasks.filter((t) => {
      const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
      return assignees.includes(currentMember.id);
    });
  }, [tasks, role, currentMember?.id]);

  const filteredTasks = useMemo(() => {
    let filtered = visibleTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== "All") filtered = filtered.filter((t) => t.status === statusFilter);
    if (priorityFilter !== "All") filtered = filtered.filter((t) => t.priority === priorityFilter);
    if (assigneeFilter !== "All")
      filtered = filtered.filter((t) => {
        const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
        return assignees.includes(assigneeFilter);
      });
    if (projectFilter !== "All") filtered = filtered.filter((t) => t.project === projectFilter);

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "deadline":
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case "priority":
          const priorityOrder = { High: 0, Medium: 1, Low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case "created":
          return a.createdAt - b.createdAt;
        case "updated":
          return b.updatedAt - a.updatedAt;
        default:
          return 0;
      }
    });

    return filtered;
  }, [visibleTasks, searchTerm, statusFilter, priorityFilter, assigneeFilter, projectFilter, sortBy]);

  const projects = useMemo(() => {
    const unique = new Set(tasks.filter((t) => t.project).map((t) => t.project));
    return Array.from(unique) as string[];
  }, [tasks]);

  const memberMap = useMemo(() => {
    const map = new Map<string, Member>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const handleTaskUpdate = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      storage.updateTask(taskId, updates);
      setEditing({});
    },
    [storage]
  );

  const handleToggleSelect = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map((t) => t.id)));
    }
  };

  const handleBulkStatusUpdate = (newStatus: TaskStatus) => {
    selectedTasks.forEach((taskId) => {
      storage.updateTask(taskId, { status: newStatus });
    });
    setSelectedTasks(new Set());
  };

  const getAssigneeName = (assignedTo: string | string[]): string => {
    const ids = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
    return ids.map((id) => memberMap.get(id)?.name || "Unknown").join(", ");
  };

  const isOverdue = (task: Task): boolean => {
    return task.status !== "Completed" && new Date(task.deadline) < new Date();
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">List View</h1>
        <p className="text-gray-600 mb-6">{filteredTasks.length} tasks</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-6"
      >
        <Input
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-sm"
        />

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | "All")}>
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Assigned">Assigned</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | "All")}>
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Priority</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Assignees</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">Sort: Deadline</SelectItem>
            <SelectItem value="priority">Sort: Priority</SelectItem>
            <SelectItem value="created">Sort: Created</SelectItem>
            <SelectItem value="updated">Sort: Updated</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Bulk Actions Bar */}
      {selectedTasks.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-100 p-4 rounded-lg mb-6 flex items-center justify-between"
        >
          <span className="text-sm font-medium text-gray-700">{selectedTasks.size} selected</span>
          <div className="flex gap-2">
            <Select onValueChange={(v) => handleBulkStatusUpdate(v as TaskStatus)}>
              <SelectTrigger className="w-40 text-sm h-9">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Assigned">Assigned</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <Checkbox
                    checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Assignee</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Deadline</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, idx) => {
                const overdue = isOverdue(task);
                return (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedTasks.has(task.id)}
                        onCheckedChange={() => handleToggleSelect(task.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDetailsTaskId(task.id)}
                        className="text-left font-medium text-gray-900 hover:text-gray-600 truncate max-w-xs"
                      >
                        {task.isFavorite && <Star className="inline-block w-4 h-4 text-yellow-500 mr-2 fill-yellow-500" />}
                        {task.title}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={task.status}
                        onValueChange={(v) =>
                          handleTaskUpdate(task.id, {
                            status: v as TaskStatus,
                            completedAt: v === "Completed" ? Date.now() : undefined,
                          })
                        }
                      >
                        <SelectTrigger className={cn("w-32 h-8 text-xs", statusConfig[task.status])}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Assigned">Assigned</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-xs", priorityConfig[task.priority])}>
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{getAssigneeName(task.assignedTo)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        {overdue && <AlertCircle className="w-4 h-4 text-red-500" />}
                        {format(new Date(task.deadline), "MMM dd")}
                      </div>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => setDetailsTaskId(task.id)}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                        title="View details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTasks.length === 0 && (
          <div className="px-4 py-12 text-center text-gray-500">
            <p className="text-sm">No tasks found matching your filters</p>
          </div>
        )}
      </motion.div>

      {/* Task Details Dialog */}
      {detailsTaskId && visibleTasks.find((t) => t.id === detailsTaskId) && (
        <TaskDetailsDialog
          task={visibleTasks.find((t) => t.id === detailsTaskId) || null}
          open={!!detailsTaskId}
          onOpenChange={(open) => !open && setDetailsTaskId(null)}
        />
      )}
    </div>
  );
}
