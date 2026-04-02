import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X, Clock, AlertCircle, CheckCircle2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { remoteStorageImpl } from "@/lib/storageRemote";
import type { Task } from "@/lib/storageTypes";
import { cn } from "@/lib/utils";

export default function FocusMode() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [focusTime, setFocusTime] = useState(0);

  useEffect(() => {
    const loadTask = async () => {
      if (!taskId) return;
      try {
        const data = await remoteStorageImpl.getTask(taskId);
        setTask(data);
      } catch (error) {
        console.error("Failed to load task:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [taskId]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setFocusTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle ESC key to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white/90 font-semibold mb-2">Task Not Found</h2>
          <Button
            onClick={() => navigate(-1)}
            className="bg-white/10 hover:bg-white/20"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const subtaskCompleted =
    task.subtasks?.filter((s) => s.completed).length ?? 0;
  const subtaskTotal = task.subtasks?.length ?? 0;

  const checklistCompleted =
    task.checklist?.filter((c) => c.completed).length ?? 0;
  const checklistTotal = task.checklist?.length ?? 0;

  const allItemsCompleted = subtaskCompleted + checklistCompleted;
  const allItemsTotal = subtaskTotal + checklistTotal;
  const progressPercent =
    allItemsTotal > 0 ? Math.round((allItemsCompleted / allItemsTotal) * 100) : 0;

  const getDueDateColor = () => {
    if (!task.dueDate) return "text-gray-400";
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    if (dueDate < now && task.status !== "Completed") return "text-red-400";
    return "text-green-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-black via-slate-950 to-black z-50 p-4 md:p-8 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <motion.div
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="text-4xl font-bold text-white line-clamp-1">
            {task.title}
          </div>
        </motion.div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <div className="text-sm text-muted-foreground">Focus Time</div>
            <div className="text-2xl font-mono text-blue-400 font-bold">
              {formatTime(focusTime)}
            </div>
          </div>
          <Button
            onClick={() => navigate(-1)}
            size="lg"
            className="bg-white/10 hover:bg-white/20 rounded-full p-0 w-12 h-12 flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Description & Details */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Description */}
          {task.description && (
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-sm font-semibold text-white/70 mb-2">
                Description
              </h3>
              <p className="text-white/80 leading-relaxed">{task.description}</p>
            </Card>
          )}

          {/* Subtasks */}
          {subtaskTotal > 0 && (
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white/70">
                  Subtasks
                </h3>
                <span className="text-xs text-muted-foreground">
                  {subtaskCompleted}/{subtaskTotal}
                </span>
              </div>
              <div className="space-y-3">
                {task.subtasks?.map((subtask) => (
                  <div
                    key={subtask.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      "border border-white/5 hover:bg-white/5 transition-colors",
                      subtask.completed && "opacity-60"
                    )}
                  >
                    <Checkbox checked={subtask.completed} disabled />
                    <span
                      className={cn(
                        "flex-1",
                        subtask.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {subtask.name}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Checklist */}
          {checklistTotal > 0 && (
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white/70">
                  Checklist
                </h3>
                <span className="text-xs text-muted-foreground">
                  {checklistCompleted}/{checklistTotal}
                </span>
              </div>
              <div className="space-y-3">
                {task.checklist?.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      "border border-white/5 hover:bg-white/5 transition-colors",
                      item.completed && "opacity-60"
                    )}
                  >
                    <Checkbox checked={item.completed} disabled />
                    <span
                      className={cn(
                        "flex-1",
                        item.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ x: 20 }}
          animate={{ x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Progress */}
          {allItemsTotal > 0 && (
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-sm font-semibold text-white/70 mb-3">
                Progress
              </h3>
              <div className="space-y-3">
                <div className="relative pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white/60">
                      {allItemsCompleted}/{allItemsTotal}
                    </span>
                    <span className="text-xs font-bold text-blue-400">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5 }}
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Status & Priority */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="text-sm font-semibold text-white/70 mb-3">Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Status</span>
                <div className="text-white/90 font-medium">{task.status}</div>
              </div>
              {task.priority && (
                <div>
                  <span className="text-muted-foreground">Priority</span>
                  <div
                    className={cn(
                      "text-white/90 font-medium",
                      task.priority === "High" && "text-red-400",
                      task.priority === "Medium" && "text-yellow-400",
                      task.priority === "Low" && "text-green-400"
                    )}
                  >
                    {task.priority}
                  </div>
                </div>
              )}
              {task.dueDate && (
                <div>
                  <span className="text-muted-foreground">Due Date</span>
                  <div className={cn("font-medium", getDueDateColor())}>
                    {new Date(task.dueDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Hint */}
          <Card className="p-4 bg-white/10 border border-white/20 text-xs text-gray-300">
            <p>💡 Press <kbd>ESC</kbd> to exit focus mode</p>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
