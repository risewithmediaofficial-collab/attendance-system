import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/storageTypes";

interface ProgressBarProps {
  completed: number;
  total: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function ProgressBar({
  completed,
  total,
  showLabel = true,
  size = "md",
  animated = true,
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const labelSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const getColor = (percent: number) => {
    if (percent === 0) return "from-gray-600";
    if (percent < 25) return "from-gray-500 to-gray-600";
    if (percent < 50) return "from-gray-400 to-gray-500";
    if (percent < 75) return "from-gray-300 to-gray-400";
    if (percent < 100) return "from-gray-200 to-gray-300";
    return "from-gray-200 to-gray-300";
  };

  return (
    <div className="space-y-1">
      <div className={cn("w-full bg-white/10 rounded-full overflow-hidden", sizeClasses[size])}>
        <motion.div
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "h-full bg-gradient-to-r rounded-full",
            getColor(percentage)
          )}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className={cn("text-muted-foreground font-medium", labelSize[size])}>
            Progress
          </span>
          <span className={cn("text-muted-foreground font-bold", labelSize[size])}>
            {percentage}%
          </span>
        </div>
      )}
    </div>
  );
}

interface TaskProgressProps {
  task: Task;
  showDetails?: boolean;
}

export function TaskProgress({ task, showDetails = false }: TaskProgressProps) {
  const subtaskCount = task.subtasks?.length ?? 0;
  const subtaskCompleted = task.subtasks?.filter((s) => s.completed).length ?? 0;

  const checklistCount = task.checklist?.length ?? 0;
  const checklistCompleted = task.checklist?.filter((c) => c.completed).length ?? 0;

  const totalItems = subtaskCount + checklistCount;
  const completedItems = subtaskCompleted + checklistCompleted;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  if (totalItems === 0) return null;

  return (
    <div className="space-y-2">
      <ProgressBar completed={completedItems} total={totalItems} showLabel size="sm" />

      {showDetails && (
        <div className="flex gap-2 text-xs text-muted-foreground/70">
          {subtaskCount > 0 && (
            <span>Subtasks: {subtaskCompleted}/{subtaskCount}</span>
          )}
          {checklistCount > 0 && (
            <span>Checklist: {checklistCompleted}/{checklistCount}</span>
          )}
        </div>
      )}
    </div>
  );
}

interface ProjectProgressProps {
  tasks: Task[];
  showBreakdown?: boolean;
}

export function ProjectProgress({ tasks, showBreakdown = false }: ProjectProgressProps) {
  if (tasks.length === 0) return null;

  const completed = tasks.filter((t) => t.status === "Completed").length;
  const progress = Math.round((completed / tasks.length) * 100);

  return (
    <div className="space-y-2">
      <ProgressBar completed={completed} total={tasks.length} showLabel size="md" />

      {showBreakdown && (
        <div className="text-xs text-muted-foreground/70 space-y-1">
          <div>Completed: {completed}/{tasks.length}</div>
          <div>In Progress: {tasks.filter((t) => t.status === "In Progress").length}</div>
          <div>Assigned: {tasks.filter((t) => t.status === "Assigned").length}</div>
        </div>
      )}
    </div>
  );
}
