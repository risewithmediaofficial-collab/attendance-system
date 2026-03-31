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
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import { BellRing, CalendarDays, GripVertical, Plus, Send } from "lucide-react";
import { storage, type Task, type TaskPriority, type TaskStatus, type UserNotification, generateId } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const columns: TaskStatus[] = ["Assigned", "In Progress", "Completed"];

function priorityClass(priority: TaskPriority) {
  if (priority === "High") return "bg-black/14 text-black/85 border border-black/24";
  if (priority === "Medium") return "bg-black/10 text-black/78 border border-black/20";
  return "bg-black/7 text-black/68 border border-black/16";
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
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2 shadow-sm">
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {dragHandleProps && (
            <button
              type="button"
              className="mt-0.5 shrink-0 p-0.5 rounded-md text-muted-foreground hover:bg-white/10 hover:text-foreground touch-none cursor-grab active:cursor-grabbing"
              aria-label="Drag to move task"
              {...dragHandleProps}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <p className="font-semibold text-sm uppercase tracking-wide line-clamp-2">{task.title}</p>
        </div>
        <Badge className={cn("text-xs shrink-0", priorityClass(task.priority))}>{task.priority}</Badge>
      </div>
      <div className="max-h-[5.5rem] overflow-y-auto overflow-x-hidden text-xs text-muted-foreground pr-1 border-l-2 border-white/5 pl-2 [scrollbar-width:thin]">
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
          <SelectTrigger className="h-9 mt-1 rounded-lg bg-white/10 border-white/20 text-xs">
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
  memberName,
  showAssignee,
  showStatusSelect,
  onStatusChange,
}: {
  status: TaskStatus;
  tasks: Task[];
  memberName: (id: string) => string;
  showAssignee: boolean;
  showStatusSelect: (task: Task) => boolean;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <Card className="glass-card rounded-2xl border-white/20 shadow-2xl flex flex-col min-h-[320px] max-h-[min(72vh,620px)]">
      <CardHeader className="p-4 pb-3 shrink-0">
        <CardTitle className="text-base">{status}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 min-h-0 flex flex-col">
        <div
          ref={setNodeRef}
          className={cn(
            "flex-1 min-h-0 overflow-y-auto rounded-xl border-2 border-dashed border-transparent transition-colors space-y-3 p-1 -m-1",
            isOver && "border-primary/50 bg-primary/5",
          )}
        >
          {tasks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 px-2">Drop tasks here</p>
          )}
          {tasks.map((t) => (
            <DraggableTaskCard
              key={t.id}
              task={t}
              showStatusSelect={showStatusSelect(t)}
              onStatusChange={onStatusChange}
              memberLine={
                showAssignee ? (
                  <div className="text-xs text-muted-foreground">To: {memberName(t.assignedTo)}</div>
                ) : null
              }
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Board() {
  const role = storage.getCurrentRole();
  const me = storage.getCurrentMember();
  const members = storage.getMembers().filter((m) => m.role !== "Admin");

  const [tasks, setTasks] = useState<Task[]>(storage.getTasks());
  const [notifications, setNotifications] = useState<UserNotification[]>(storage.getUserNotifications());
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    storage.setTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    storage.setUserNotifications(notifications);
  }, [notifications]);

  // Admin task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskRoleTarget, setTaskRoleTarget] = useState<"Employee" | "Intern">("Employee");
  const roleMembers = members.filter((m) => (m.role ?? "Intern") === taskRoleTarget);
  const [taskMemberId, setTaskMemberId] = useState("");
  const [taskDeadline, setTaskDeadline] = useState(format(new Date(), "yyyy-MM-dd"));
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("Medium");

  useEffect(() => {
    if (!taskMemberId || !roleMembers.some((m) => m.id === taskMemberId)) {
      setTaskMemberId(roleMembers[0]?.id ?? "");
    }
  }, [taskRoleTarget, roleMembers, taskMemberId]);

  // Admin notification form
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifRoleTarget, setNotifRoleTarget] = useState<"Employee" | "Intern">("Employee");
  const notifRoleMembers = members.filter((m) => (m.role ?? "Intern") === notifRoleTarget);
  const [notifMemberId, setNotifMemberId] = useState<"all" | string>("all");

  const visibleTasks = useMemo(() => {
    if (role === "Admin") return tasks;
    return tasks.filter((t) => t.assignedTo === me?.id);
  }, [tasks, role, me?.id]);

  const visibleNotifications = useMemo(() => {
    if (role === "Admin") return notifications;
    if (!me) return [];
    return notifications.filter((n) => n.targetMemberIds.includes(me.id));
  }, [notifications, role, me]);

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? "Unknown";

  const assignTask = () => {
    if (role !== "Admin") return;
    if (!taskTitle.trim() || !taskMemberId || !taskDeadline) {
      toast.error("Fill task title, assignee and deadline.");
      return;
    }
    const next: Task = {
      id: generateId(),
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      assignedTo: taskMemberId,
      deadline: taskDeadline,
      priority: taskPriority,
      status: "Assigned",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setTasks((prev) => [next, ...prev]);
    setTaskTitle("");
    setTaskDescription("");
    setTaskDeadline(format(new Date(), "yyyy-MM-dd"));
    setTaskPriority("Medium");
    toast.success("Task assigned.");
  };

  const sendNotification = () => {
    if (role !== "Admin") return;
    if (!notifTitle.trim() || !notifMessage.trim()) {
      toast.error("Notification title and message are required.");
      return;
    }

    const targetMemberIds =
      notifMemberId === "all"
        ? notifRoleMembers.map((m) => m.id)
        : [notifMemberId];

    if (targetMemberIds.length === 0) {
      toast.error("No target users found for selected role.");
      return;
    }

    const next: UserNotification = {
      id: generateId(),
      title: notifTitle.trim(),
      message: notifMessage.trim(),
      targetMemberIds,
      targetRole: notifRoleTarget,
      createdAt: Date.now(),
      createdBy: me?.id ?? "admin",
    };
    setNotifications((prev) => [next, ...prev]);
    setNotifTitle("");
    setNotifMessage("");
    setNotifMemberId("all");
    toast.success("Notification sent.");
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              updatedAt: Date.now(),
              completedAt: status === "Completed" ? Date.now() : undefined,
            }
          : t,
      ),
    );
  };

  const canEditTask = (t: Task) => role === "Admin" || t.assignedTo === me?.id;

  const handleBoardDragStart = ({ active }: DragStartEvent) => {
    const id = String(active.id);
    const list = role === "Admin" ? tasks : tasks.filter((t) => t.assignedTo === me?.id);
    setActiveDragTask(list.find((t) => t.id === id) ?? null);
  };

  const handleBoardDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDragTask(null);
    if (!over) return;
    const next = over.id as TaskStatus;
    if (!columns.includes(next)) return;
    const taskId = String(active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === next) return;
    if (role !== "Admin" && task.assignedTo !== me?.id) return;
    updateTaskStatus(taskId, next);
  };

  const handleBoardDragCancel = () => {
    setActiveDragTask(null);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Board</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {role === "Admin"
              ? "Assign tasks and drag by the grip between columns, or change Status on any card (including moving completed tasks back)."
              : "Drag tasks by the grip, or use Status on the card to move or reopen completed work. Columns scroll when there are many tasks."}
          </p>
        </div>
      </motion.div>

      <Tabs defaultValue="tasks">
        <TabsList className="bg-white/5 border border-white/10 rounded-full p-1">
          <TabsTrigger value="tasks" className="rounded-full">Task Board</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-full">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          {role === "Admin" && (
            <Card className="glass-card rounded-2xl border-white/20 shadow-2xl">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-lg">Assign New Task</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title" className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Target role</Label>
                    <Select value={taskRoleTarget} onValueChange={(v) => setTaskRoleTarget(v as "Employee" | "Intern")}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="Intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} rows={3} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Assign to</Label>
                    <Select value={taskMemberId} onValueChange={setTaskMemberId}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select user" /></SelectTrigger>
                      <SelectContent>
                        {roleMembers.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Deadline</Label>
                    <Input type="date" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select value={taskPriority} onValueChange={(v) => setTaskPriority(v as TaskPriority)}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={assignTask} className="rounded-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Task
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="overflow-x-auto pb-1">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleBoardDragStart}
              onDragEnd={handleBoardDragEnd}
              onDragCancel={handleBoardDragCancel}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[min(100%,900px)] md:min-w-[900px] items-stretch">
                {columns.map((col) => (
                  <KanbanColumn
                    key={col}
                    status={col}
                    tasks={visibleTasks.filter((t) => t.status === col)}
                    memberName={memberName}
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
                          <div className="text-xs text-muted-foreground">To: {memberName(activeDragTask.assignedTo)}</div>
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
            <Card className="glass-card rounded-2xl border-white/20 shadow-2xl">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-lg">Send Notification</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="e.g. Team update" className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Send to role</Label>
                    <Select value={notifRoleTarget} onValueChange={(v) => setNotifRoleTarget(v as "Employee" | "Intern")}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="Intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Recipient</Label>
                  <Select value={notifMemberId} onValueChange={(v) => setNotifMemberId(v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="All users in role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {notifRoleTarget}s</SelectItem>
                      {notifRoleMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
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

          <Card className="glass-card rounded-2xl border-white/20 shadow-2xl">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-lg">{role === "Admin" ? "Sent Notifications" : "Your Notifications"}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              {visibleNotifications.length === 0 && (
                <p className="text-sm text-muted-foreground">No notifications.</p>
              )}
              {visibleNotifications.map((n) => (
                <div key={n.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                    </div>
                    <BellRing className="h-4 w-4 text-primary mt-0.5" />
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-2">
                    {role === "Admin"
                      ? `Target: ${n.targetRole ?? "custom"} • ${n.targetMemberIds.length} recipient(s)`
                      : `Sent ${format(new Date(n.createdAt), "PPp")}`}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
