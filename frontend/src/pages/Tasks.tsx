import { useEffect, useMemo, useState, type HTMLAttributes, type ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { format } from "date-fns";
import { BellRing, CalendarDays, GripVertical, MessageCircle, MoreHorizontal, Pencil, Plus, Search, Send, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  addComment,
  generateId,
  storage,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type UserNotification,
} from "@/lib/storage";

const columns: TaskStatus[] = ["Assigned", "In Progress", "Completed"];

type TaskView = "board" | "list" | "notifications";

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

function priorityDot(priority: TaskPriority) {
  switch (priority) {
    case "High":
      return "bg-rose-500";
    case "Medium":
      return "bg-amber-400";
    case "Low":
      return "bg-neutral-300";
  }
}

function statusPill(status: TaskStatus) {
  switch (status) {
    case "Assigned":
      return "border-neutral-200 bg-neutral-50 text-neutral-600";
    case "In Progress":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

function TaskStatusControl({
  task,
  interactive,
  onStatusChange,
}: {
  task: Task;
  interactive: boolean;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}) {
  const tone = cn(
    "inline-flex h-8 items-center rounded-full border px-2.5 text-[11px] font-medium leading-none transition",
    statusPill(task.status),
  );

  if (!interactive) {
    return <span className={tone}>{task.status}</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={cn(tone, "hover:bg-neutral-100/80")}>
          {task.status}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {columns.map((status) => (
          <DropdownMenuItem
            key={status}
            onSelect={() => onStatusChange(task.id, status)}
            className={cn("justify-between", task.status === status && "bg-neutral-50 font-medium")}
          >
            <span>{status}</span>
            {task.status === status ? <span className="text-[11px] text-muted-foreground">Current</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TaskCardBody({
  task,
  memberLine,
  dragHandleProps,
  statusSelect,
}: {
  task: Task;
  memberLine: ReactNode;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  statusSelect?: ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {dragHandleProps && (
            <button
              type="button"
              className="mt-0.5 shrink-0 cursor-grab rounded-md p-0.5 text-muted-foreground touch-none hover:bg-neutral-100 hover:text-foreground active:cursor-grabbing"
              aria-label="Drag to move task"
              {...dragHandleProps}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <p className="font-semibold text-sm uppercase tracking-wide line-clamp-2">{task.title}</p>
        </div>
        <Badge className={cn("text-xs shrink-0", priorityBadge(task.priority))}>{task.priority}</Badge>
      </div>
      <div className="max-h-[5.5rem] overflow-x-hidden overflow-y-auto border-l-2 border-neutral-200 pl-2 pr-1 text-xs text-muted-foreground [scrollbar-width:thin]">
        {task.description?.trim() ? task.description : "No description"}
      </div>
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
        <span>Due {task.deadline}</span>
      </div>
      {memberLine}
      {statusSelect}
    </div>
  );
}

function DraggableTaskCard({
  task,
  memberLine,
  showStatusSelect,
  onStatusChange,
}: {
  task: Task;
  memberLine: ReactNode;
  showStatusSelect: boolean;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  const statusSelect =
    showStatusSelect ? (
      <div
        className="pt-1"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</Label>
        <Select value={task.status} onValueChange={(v) => onStatusChange(task.id, v as TaskStatus)}>
            <SelectTrigger className="mt-1 h-9 rounded-lg border-neutral-200 bg-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[200]">
            <SelectItem value="Assigned">Assigned</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ) : null;

  return (
    <div ref={setNodeRef} className={cn("relative z-10 touch-none", isDragging && "opacity-40")}>
      <TaskCardBody
        task={task}
        memberLine={memberLine}
        dragHandleProps={{ ...listeners, ...attributes }}
        statusSelect={statusSelect}
      />
    </div>
  );
}

function KanbanColumn({
  status,
  tasks,
  memberNames,
  showAssignee,
  showStatusSelect,
  onStatusChange,
}: {
  status: TaskStatus;
  tasks: Task[];
  memberNames: (assignedTo: Task["assignedTo"]) => string;
  showAssignee: boolean;
  showStatusSelect: (task: Task) => boolean;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <Card className="glass-card flex min-h-[320px] max-h-[min(72vh,620px)] flex-col rounded-2xl border-neutral-200 shadow-none">
      <CardHeader className="p-4 pb-3 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{status}</CardTitle>
          <Badge className="rounded-full border border-neutral-200 bg-neutral-100 px-2 py-1 text-foreground">
            {tasks.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 min-h-0 flex flex-col">
        <div
          ref={setNodeRef}
          className={cn(
              "-m-1 flex-1 min-h-0 space-y-3 overflow-y-auto rounded-xl border-2 border-dashed border-transparent p-1 transition-colors",
              isOver && "border-primary/40 bg-primary/5",
          )}
        >
          {tasks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 px-2">Drop tasks here</p>
          )}
          {tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              showStatusSelect={showStatusSelect(task)}
              onStatusChange={onStatusChange}
              memberLine={
                showAssignee ? (
                  <div className="text-xs text-muted-foreground">To: {memberNames(task.assignedTo)}</div>
                ) : null
              }
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getViewFromSearchParams(searchParams: URLSearchParams): TaskView {
  const requestedView = searchParams.get("view");
  return requestedView === "board" || requestedView === "notifications" ? requestedView : "list";
}

export default function Tasks() {
  const role = storage.getCurrentRole();
  const me = storage.getCurrentMember();
  const allMembers = storage.getMembers();
  const members = allMembers.filter((member) => member.role !== "Admin");

  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = getViewFromSearchParams(searchParams);

  const [tasks, setTasks] = useState<Task[]>(storage.getTasks());
  const [notifications, setNotifications] = useState<UserNotification[]>(storage.getUserNotifications());
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [commentsTaskId, setCommentsTaskId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAssignedTo, setFormAssignedTo] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formPriority, setFormPriority] = useState<TaskPriority>("Medium");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentSavingId, setCommentSavingId] = useState<string | null>(null);

  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifRoleTarget, setNotifRoleTarget] = useState<"Employee" | "Intern">("Employee");
  const notifRoleMembers = members.filter((member) => (member.role ?? "Intern") === notifRoleTarget);
  const [notifMemberId, setNotifMemberId] = useState<"all" | string>("all");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const assigneeIds = (assignedTo: Task["assignedTo"]) =>
    Array.isArray(assignedTo) ? assignedTo : [assignedTo];

  const memberName = (id: string) => allMembers.find((member) => member.id === id)?.name ?? "Unknown";
  const memberNames = (assignedTo: Task["assignedTo"]) => assigneeIds(assignedTo).map(memberName).join(", ");

  const isAssignedToMember = (task: Task, memberId?: string) =>
    Boolean(memberId) && assigneeIds(task.assignedTo).includes(memberId as string);

  useEffect(() => {
    setTasks(storage.getTasks());
  }, []);

  useEffect(() => {
    storage.setTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    if (role === "Admin") {
      storage.setUserNotifications(notifications);
    }
  }, [notifications, role]);

  const visibleTasks = useMemo(() => {
    const baseTasks = role === "Admin" ? tasks : tasks.filter((task) => isAssignedToMember(task, me?.id));
    const query = search.trim().toLowerCase();

    return baseTasks
      .filter((task) => {
        if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
        if (!query) return true;

        return (
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          memberNames(task.assignedTo).toLowerCase().includes(query)
        );
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [tasks, role, me?.id, search, priorityFilter]);

  const stats = useMemo(() => {
    const total = visibleTasks.length;
    const completed = visibleTasks.filter((task) => task.status === "Completed").length;
    const inProgress = visibleTasks.filter((task) => task.status === "In Progress").length;
    const assigned = total - completed - inProgress;

    return { total, completed, inProgress, assigned };
  }, [visibleTasks]);

  const visibleNotifications = useMemo(() => {
    if (role === "Admin") return notifications;
    if (!me) return [];
    return notifications.filter((notification) => notification.targetMemberIds.includes(me.id));
  }, [notifications, role, me]);

  const commentsTask = useMemo(
    () => tasks.find((task) => task.id === commentsTaskId) ?? null,
    [tasks, commentsTaskId],
  );

  function setTaskView(nextView: TaskView) {
    const params = new URLSearchParams(searchParams);
    params.set("view", nextView);
    setSearchParams(params, { replace: true });
  }

  function resetTaskForm() {
    setFormTitle("");
    setFormDescription("");
    setFormAssignedTo(members[0]?.id ?? "");
    setFormDeadline(format(new Date(), "yyyy-MM-dd"));
    setFormPriority("Medium");
    setEditId(null);
  }

  function openCreate() {
    if (role !== "Admin") return;
    resetTaskForm();
    setCreateOpen(true);
  }

  function openEdit(task: Task) {
    if (role !== "Admin") return;
    setEditId(task.id);
    setFormTitle(task.title);
    setFormDescription(task.description);
    setFormAssignedTo(assigneeIds(task.assignedTo)[0] ?? "");
    setFormDeadline(task.deadline);
    setFormPriority(task.priority);
    setEditOpen(true);
  }

  useEffect(() => {
    if (role !== "Admin") return;

    const editTaskId = searchParams.get("edit");
    if (!editTaskId || editOpen || createOpen) return;

    const taskToEdit = tasks.find((task) => task.id === editTaskId);
    if (!taskToEdit) return;

    openEdit(taskToEdit);
    const params = new URLSearchParams(searchParams);
    params.delete("edit");
    setSearchParams(params, { replace: true });
  }, [searchParams, tasks, role, editOpen, createOpen, setSearchParams]);

  function canEditTask(task: Task) {
    return role === "Admin" || isAssignedToMember(task, me?.id);
  }

  function canChangeStatus(task: Task) {
    return role === "Admin" || isAssignedToMember(task, me?.id);
  }

  function saveNewTask() {
    if (role !== "Admin") return;
    if (!formTitle.trim() || !formAssignedTo || !formDeadline) {
      toast.error("Fill task title, assignee and deadline.");
      return;
    }

    const nextTask: Task = {
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

    setTasks((prev) => [nextTask, ...prev]);
    setCreateOpen(false);
    toast.success("Task assigned.");
  }

  function saveEditTask() {
    if (role !== "Admin" || !editId) return;

    setTasks((prev) =>
      prev.map((task) =>
        task.id !== editId
          ? task
          : {
              ...task,
              title: formTitle.trim(),
              description: formDescription.trim(),
              assignedTo: formAssignedTo,
              deadline: formDeadline,
              priority: formPriority,
              updatedAt: Date.now(),
            },
      ),
    );

    setEditOpen(false);
    toast.success("Task updated.");
  }

  function confirmDelete() {
    if (!deleteId) return;
    setTasks((prev) => prev.filter((task) => task.id !== deleteId));
    setDeleteId(null);
    toast.success("Task deleted.");
  }

  function updateTaskStatus(taskId: string, status: TaskStatus) {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        if (!canChangeStatus(task) || task.status === status) return task;

        return {
          ...task,
          status,
          updatedAt: Date.now(),
          completedAt: status === "Completed" ? Date.now() : undefined,
        };
      }),
    );
  }

  async function submitTaskComment(task: Task) {
    if (role !== "Admin") return;

    const draft = commentDrafts[task.id]?.trim();
    if (!draft) {
      toast.error("Enter a comment before sending.");
      return;
    }

    try {
      setCommentSavingId(task.id);
      await addComment(task.id, draft);
      setTasks(storage.getTasks());
      setNotifications(storage.getUserNotifications());
      setCommentDrafts((prev) => ({ ...prev, [task.id]: "" }));
      toast.success(`Comment added for ${memberNames(task.assignedTo)}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add comment.";
      toast.error(message);
    } finally {
      setCommentSavingId(null);
    }
  }

  function handleBoardDragStart({ active }: DragStartEvent) {
    const taskId = String(active.id);
    setActiveDragTask(visibleTasks.find((task) => task.id === taskId) ?? null);
  }

  function handleBoardDragEnd({ active, over }: DragEndEvent) {
    setActiveDragTask(null);
    if (!over) return;

    const nextStatus = over.id as TaskStatus;
    if (!columns.includes(nextStatus)) return;

    const taskId = String(active.id);
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === nextStatus) return;
    if (!canChangeStatus(task)) return;

    updateTaskStatus(taskId, nextStatus);
    toast.success(`Moved to ${nextStatus}`);
  }

  function handleBoardDragCancel() {
    setActiveDragTask(null);
  }

  function sendNotification() {
    if (role !== "Admin") return;
    if (!notifTitle.trim() || !notifMessage.trim()) {
      toast.error("Notification title and message are required.");
      return;
    }

    const targetMemberIds =
      notifMemberId === "all" ? notifRoleMembers.map((member) => member.id) : [notifMemberId];

    if (targetMemberIds.length === 0) {
      toast.error("No target users found for selected role.");
      return;
    }

    const nextNotification: UserNotification = {
      id: generateId(),
      title: notifTitle.trim(),
      message: notifMessage.trim(),
      targetMemberIds,
      targetRole: notifRoleTarget,
      createdAt: Date.now(),
      createdBy: me?.id ?? "admin",
    };

    setNotifications((prev) => [nextNotification, ...prev]);
    setNotifTitle("");
    setNotifMessage("");
    setNotifMemberId("all");
    toast.success("Notification sent.");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="page-title mono-title">Tasks</h2>
          <p className="page-subtitle mt-1">
            Board and list now live in one workspace, so task management stays in one place.
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

          <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TaskPriority | "all")}>
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

          {role === "Admin" && (
            <Button onClick={openCreate} className="rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm leading-6 text-muted-foreground">
        <span className="font-medium text-foreground">{stats.total} Tasks</span>
        <span aria-hidden="true">&middot;</span>
        <span>{stats.assigned} Assigned</span>
        <span aria-hidden="true">&middot;</span>
        <span>{stats.inProgress} In Progress</span>
        <span aria-hidden="true">&middot;</span>
        <span>{stats.completed} Done</span>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setTaskView(value as TaskView)} className="space-y-5">
        <TabsList className="w-full justify-start gap-6 overflow-x-auto">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
            {visibleTasks.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                No tasks match the current filters.
              </div>
            ) : (
              <div className="divide-y divide-neutral-200/80">
                {visibleTasks.map((task) => {
                  const commentCount = task.comments?.length ?? 0;
                  const trimmedDescription = task.description?.trim();

                  return (
                    <div
                      key={task.id}
                      className="group flex items-start justify-between gap-4 px-4 py-4 transition-colors hover:bg-neutral-50/70 md:px-5 md:py-[18px]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", priorityDot(task.priority))} aria-hidden="true" />
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-medium leading-6 text-foreground">{task.title}</p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-muted-foreground">
                              {trimmedDescription ? (
                                <>
                                  <span className="max-w-[36ch] truncate">{trimmedDescription}</span>
                                  <span aria-hidden="true">&middot;</span>
                                </>
                              ) : null}
                              <span>{memberNames(task.assignedTo)}</span>
                              <span aria-hidden="true">&middot;</span>
                              <span>{format(new Date(`${task.deadline}T00:00:00`), "MMM d")}</span>
                              <span aria-hidden="true">&middot;</span>
                              <button
                                type="button"
                                onClick={() => setCommentsTaskId(task.id)}
                                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 transition hover:bg-neutral-100 hover:text-foreground"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span>{commentCount}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5 self-start md:self-center">
                        <TaskStatusControl task={task} interactive={canChangeStatus(task)} onStatusChange={updateTaskStatus} />

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="h-8 w-8 rounded-full text-muted-foreground transition hover:bg-neutral-100 hover:text-foreground md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                              aria-label={`More actions for ${task.title}`}
                            >
                              <MoreHorizontal className="mx-auto h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onSelect={() => setCommentsTaskId(task.id)}>
                              View comments
                            </DropdownMenuItem>
                            {role === "Admin" ? (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => openEdit(task)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit task
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => setDeleteId(task.id)}
                                  className="text-red-600 focus:text-red-700"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete task
                                </DropdownMenuItem>
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="board" className="space-y-6">
          <div className="overflow-x-auto pb-2 -mx-3 px-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleBoardDragStart}
              onDragEnd={handleBoardDragEnd}
              onDragCancel={handleBoardDragCancel}
            >
              <div
                className="grid gap-4 min-w-max md:min-w-fit items-stretch"
                style={{ gridTemplateColumns: "repeat(3, minmax(320px, 1fr))" }}
              >
                {columns.map((column) => (
                  <KanbanColumn
                    key={column}
                    status={column}
                    tasks={visibleTasks.filter((task) => task.status === column)}
                    memberNames={memberNames}
                    showAssignee={role === "Admin"}
                    showStatusSelect={canEditTask}
                    onStatusChange={updateTaskStatus}
                  />
                ))}
              </div>

              <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
                {activeDragTask ? (
                  <div className="w-[min(100vw-2rem,320px)] opacity-95 shadow-2xl ring-2 ring-primary/30 rounded-xl">
                    <TaskCardBody
                      task={activeDragTask}
                      memberLine={
                        role === "Admin" ? (
                          <div className="text-xs text-muted-foreground">
                            To: {memberNames(activeDragTask.assignedTo)}
                          </div>
                        ) : null
                      }
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          {role === "Admin" && (
            <Card className="glass-card rounded-2xl border-neutral-200 shadow-none">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-lg">Send Notification</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder="e.g. Team update"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Send to role</Label>
                    <Select value={notifRoleTarget} onValueChange={(value) => setNotifRoleTarget(value as "Employee" | "Intern")}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="Intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Recipient</Label>
                  <Select value={notifMemberId} onValueChange={setNotifMemberId}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="All users in role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {notifRoleTarget}s</SelectItem>
                      {notifRoleMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Message</Label>
                  <Textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} rows={3} className="rounded-xl" />
                </div>

                <Button onClick={sendNotification} className="rounded-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="glass-card rounded-2xl border-neutral-200 shadow-none">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-lg">{role === "Admin" ? "Sent Notifications" : "Your Notifications"}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              {visibleNotifications.length === 0 && (
                <p className="text-sm text-muted-foreground">No notifications.</p>
              )}
              {visibleNotifications.map((notification) => (
                <div key={notification.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                    </div>
                    <BellRing className="h-4 w-4 text-primary mt-0.5" />
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-2">
                    {role === "Admin"
                      ? `Target: ${notification.targetRole ?? "custom"} • ${notification.targetMemberIds.length} recipient(s)`
                      : `Sent ${format(new Date(notification.createdAt), "PPp")}`}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(commentsTask)} onOpenChange={(open) => !open && setCommentsTaskId(null)}>
        <DialogContent className="max-w-lg rounded-2xl border-neutral-200 p-0">
          <DialogHeader className="border-b border-neutral-200/80 px-6 py-4 text-left">
            <DialogTitle className="text-base font-semibold">{commentsTask?.title}</DialogTitle>
            {commentsTask ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span>{memberNames(commentsTask.assignedTo)}</span>
                <span aria-hidden="true">&middot;</span>
                <span>Due {format(new Date(`${commentsTask.deadline}T00:00:00`), "MMM d, yyyy")}</span>
              </div>
            ) : null}
          </DialogHeader>

          {commentsTask ? (
            <div className="px-6 py-5">
              <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
                {(commentsTask.comments?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                ) : (
                  commentsTask.comments?.map((comment) => (
                    <div key={comment.id} className="space-y-1 rounded-2xl bg-neutral-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">{memberName(comment.memberId)}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(comment.createdAt), "MMM d, p")}
                        </p>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>

              {role === "Admin" ? (
                <div className="mt-5 space-y-2 border-t border-neutral-200/80 pt-4">
                  <Input
                    value={commentDrafts[commentsTask.id] ?? ""}
                    onChange={(e) =>
                      setCommentDrafts((prev) => ({
                        ...prev,
                        [commentsTask.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void submitTaskComment(commentsTask);
                      }
                    }}
                    placeholder={`Comment for ${memberNames(commentsTask.assignedTo)}`}
                    className="h-10 rounded-xl bg-white"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void submitTaskComment(commentsTask)}
                      disabled={commentSavingId === commentsTask.id}
                      className="rounded-full"
                    >
                      {commentSavingId === commentsTask.id ? "Sending..." : "Add Comment"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Title</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Prepare onboarding deck"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Add context and expected output..."
                rows={3}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assigned to</Label>
                <Select value={formAssignedTo} onValueChange={setFormAssignedTo}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select a teammate" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
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
              <Select value={formPriority} onValueChange={(value) => setFormPriority(value as TaskPriority)}>
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
                    <SelectValue placeholder="Select a teammate" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
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
              <Select value={formPriority} onValueChange={(value) => setFormPriority(value as TaskPriority)}>
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
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Task"
        description="This task will be permanently removed."
      />
    </div>
  );
}
