import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Check,
  Trash2,
  Star,
  Tag,
  CheckSquare,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Task, Subtask, ChecklistItem, Comment } from "@/lib/storageTypes";
import {
  addSubtask,
  updateSubtask,
  deleteSubtask,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  updateTask,
  addComment,
  deleteComment,
  storage,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface TaskDetailsDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  isAdmin?: boolean;
}

export function TaskDetailsDialog({
  task,
  open,
  onOpenChange,
  onClose,
  isAdmin = false,
}: TaskDetailsDialogProps) {
  const [subtaskInput, setSubtaskInput] = useState("");
  const [checklistInput, setChecklistInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const [tags, setTags] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const syncTaskState = useCallback((taskId: string) => {
    const latestTask = storage.getTasks().find((entry) => entry.id === taskId) ?? null;
    setCurrentTask(latestTask);
    setTags(latestTask?.tags ?? []);
    setComments(latestTask?.comments ?? []);
    return latestTask;
  }, []);

  useEffect(() => {
    if (!task) {
      setCurrentTask(null);
      setTags([]);
      setComments([]);
      return;
    }
    setCurrentTask(task);
    setTags(task.tags ?? []);
    setComments(task.comments ?? []);
  }, [task, open]);

  if (!currentTask) return null;

  const handleAddSubtask = async () => {
    if (!subtaskInput.trim()) return;
    setIsLoading(true);
    try {
      await addSubtask(currentTask.id, subtaskInput.trim());
      syncTaskState(currentTask.id);
      setSubtaskInput("");
      toast.success("Subtask added");
    } catch (e) {
      toast.error("Failed to add subtask");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      await updateSubtask(currentTask.id, subtaskId, { completed });
      syncTaskState(currentTask.id);
    } catch (e) {
      toast.error("Failed to update subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await deleteSubtask(currentTask.id, subtaskId);
      syncTaskState(currentTask.id);
      toast.success("Subtask deleted");
    } catch (e) {
      toast.error("Failed to delete subtask");
    }
  };

  const handleAddChecklistItem = async () => {
    if (!checklistInput.trim()) return;
    setIsLoading(true);
    try {
      await addChecklistItem(currentTask.id, checklistInput.trim());
      syncTaskState(currentTask.id);
      setChecklistInput("");
      toast.success("Checklist item added");
    } catch (e) {
      toast.error("Failed to add checklist item");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateChecklistItem = async (itemId: string, completed: boolean) => {
    try {
      await updateChecklistItem(currentTask.id, itemId, { completed });
      syncTaskState(currentTask.id);
    } catch (e) {
      toast.error("Failed to update checklist item");
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    try {
      await deleteChecklistItem(currentTask.id, itemId);
      syncTaskState(currentTask.id);
      toast.success("Checklist item deleted");
    } catch (e) {
      toast.error("Failed to delete checklist item");
    }
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    const newTag = tagInput.trim().toLowerCase();
    if (!tags.includes(newTag)) {
      setIsLoading(true);
      try {
        const updatedTags = [...tags, newTag];
        await updateTask(currentTask.id, { tags: updatedTags });
        syncTaskState(currentTask.id);
      } catch (e) {
        toast.error("Failed to add tag");
      } finally {
        setIsLoading(false);
      }
    }
    setTagInput("");
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    setIsLoading(true);
    try {
      await updateTask(currentTask.id, { tags: updatedTags });
      syncTaskState(currentTask.id);
    } catch (e) {
      toast.error("Failed to remove tag");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await updateTask(currentTask.id, { isFavorite: !currentTask.isFavorite });
      syncTaskState(currentTask.id);
    } catch (e) {
      toast.error("Failed to update favorite");
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    setIsLoading(true);
    try {
      await addComment(currentTask.id, commentInput.trim());
      syncTaskState(currentTask.id);
      setCommentInput("");
      toast.success("Comment added");
    } catch (e) {
      toast.error("Failed to add comment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(currentTask.id, commentId);
      syncTaskState(currentTask.id);
      toast.success("Comment deleted");
    } catch (e) {
      toast.error("Failed to delete comment");
    }
  };

  const subtaskProgress = currentTask.subtasks
    ? Math.round((currentTask.subtasks.filter((s) => s.completed).length / currentTask.subtasks.length) * 100) || 0
    : 0;

  const checklistProgress = currentTask.checklist
    ? Math.round((currentTask.checklist.filter((c) => c.completed).length / currentTask.checklist.length) * 100) || 0
    : 0;

  const isPastDue = new Date(currentTask.deadline) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl p-6 sm:p-7">
        <DialogHeader className="pr-12 pb-1">
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="pr-4 text-2xl leading-tight break-words">{currentTask.title}</DialogTitle>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleToggleFavorite()}
              className={cn(
                "shrink-0 rounded-lg p-2 transition-colors",
                currentTask.isFavorite
                  ? "bg-amber-50 text-amber-600"
                  : "text-muted-foreground hover:bg-neutral-100"
              )}
            >
              <Star className="h-5 w-5" fill={currentTask.isFavorite ? "currentColor" : "none"} />
            </motion.button>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Description */}
          {currentTask.description && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm text-neutral-600">{currentTask.description}</p>
            </div>
          )}

          {/* Due Date Warning */}
          {isPastDue && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <span className="text-sm font-medium text-red-700">This task is overdue</span>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Tag className="h-4 w-4" /> Tags
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              <AnimatePresence>
                {tags.map((tag) => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Badge className="flex cursor-pointer items-center gap-1 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:opacity-70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag..."
                className="rounded-lg text-sm"
              />
              <Button
                size="sm"
                onClick={handleAddTag}
                className="px-3 rounded-lg"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Subtasks */}
          {(currentTask.subtasks || isAdmin) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" /> Subtasks
                </Label>
                {currentTask.subtasks && currentTask.subtasks.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {subtaskProgress}%
                  </span>
                )}
              </div>

              {currentTask.subtasks && currentTask.subtasks.length > 0 && (
                <div className="space-y-2 mb-3">
                  <AnimatePresence>
                    {currentTask.subtasks.map((subtask: Subtask) => (
                      <motion.div
                        key={subtask.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="group flex items-center gap-3 rounded-lg p-2 hover:bg-neutral-50"
                      >
                        <Checkbox
                          checked={subtask.completed}
                          onCheckedChange={(checked) =>
                            handleUpdateSubtask(subtask.id, Boolean(checked))
                          }
                        />
                        <span
                          className={cn(
                            "text-sm flex-1",
                            subtask.completed ? "line-through text-muted-foreground/50" : ""
                          )}
                        >
                          {subtask.title}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteSubtask(subtask.id)}
                            className="rounded p-1 opacity-0 transition-all hover:bg-neutral-100 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3 text-neutral-500" />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {isAdmin && (
                <div className="flex gap-2">
                  <Input
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Add subtask..."
                    className="rounded-lg text-sm"
                    disabled={isLoading}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddSubtask}
                    className="px-3 rounded-lg"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Checklist */}
          {(currentTask.checklist || isAdmin) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Check className="h-4 w-4" /> Checklist
                </Label>
                {currentTask.checklist && currentTask.checklist.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {checklistProgress}%
                  </span>
                )}
              </div>

              {currentTask.checklist && currentTask.checklist.length > 0 && (
                <div className="space-y-2 mb-3">
                  <AnimatePresence>
                    {currentTask.checklist.map((item: ChecklistItem) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="group flex items-center gap-3 rounded-lg p-2 hover:bg-neutral-50"
                      >
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={(checked) =>
                            handleUpdateChecklistItem(item.id, Boolean(checked))
                          }
                        />
                        <span
                          className={cn(
                            "text-sm flex-1",
                            item.completed ? "line-through text-muted-foreground/50" : ""
                          )}
                        >
                          {item.text}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteChecklistItem(item.id)}
                            className="rounded p-1 opacity-0 transition-all hover:bg-neutral-100 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3 text-neutral-500" />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {isAdmin && (
                <div className="flex gap-2">
                  <Input
                    value={checklistInput}
                    onChange={(e) => setChecklistInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                    placeholder="Add checklist item..."
                    className="rounded-lg text-sm"
                    disabled={isLoading}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddChecklistItem}
                    className="px-3 rounded-lg"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="space-y-3">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> Comments ({comments.length})
            </Label>

            {/* Comments List */}
            {comments.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
                <AnimatePresence>
                  {comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="group rounded-lg border border-neutral-200 bg-neutral-50 p-3 transition-colors hover:bg-neutral-100"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {comment.memberId}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="rounded p-1 opacity-0 transition-all hover:bg-white group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3 text-neutral-500" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-neutral-700 break-words">{comment.text}</p>
                      <span className="mt-1 text-xs text-muted-foreground/80">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Add Comment */}
            <div className="flex gap-2">
              <Input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="Add a comment..."
                className="rounded-lg text-sm"
                disabled={isLoading}
              />
              <Button
                size="sm"
                onClick={handleAddComment}
                className="px-3 rounded-lg"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
