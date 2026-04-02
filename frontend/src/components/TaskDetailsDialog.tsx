import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Check,
  Trash2,
  Star,
  Clock,
  Tag,
  CheckSquare,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Task, Subtask, ChecklistItem, TaskReminder, Comment } from "@/lib/storageTypes";
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
  const [tags, setTags] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTags(task.tags ?? []);
      setComments(task.comments ?? []);
      setTimeSpent(task.timeSpent ?? 0);
    }
  }, [task]);

  if (!task) return null;

  const handleAddSubtask = async () => {
    if (!subtaskInput.trim()) return;
    setIsLoading(true);
    try {
      await addSubtask(task.id, subtaskInput.trim());
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
      await updateSubtask(task.id, subtaskId, { completed });
    } catch (e) {
      toast.error("Failed to update subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await deleteSubtask(task.id, subtaskId);
      toast.success("Subtask deleted");
    } catch (e) {
      toast.error("Failed to delete subtask");
    }
  };

  const handleAddChecklistItem = async () => {
    if (!checklistInput.trim()) return;
    setIsLoading(true);
    try {
      await addChecklistItem(task.id, checklistInput.trim());
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
      await updateChecklistItem(task.id, itemId, { completed });
    } catch (e) {
      toast.error("Failed to update checklist item");
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    try {
      await deleteChecklistItem(task.id, itemId);
      toast.success("Checklist item deleted");
    } catch (e) {
      toast.error("Failed to delete checklist item");
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const newTag = tagInput.trim().toLowerCase();
    if (!tags.includes(newTag)) {
      const updatedTags = [...tags, newTag];
      setTags(updatedTags);
      updateTask(task.id, { tags: updatedTags });
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    setTags(updatedTags);
    updateTask(task.id, { tags: updatedTags });
  };

  const handleToggleFavorite = async () => {
    try {
      await updateTask(task.id, { isFavorite: !task.isFavorite });
    } catch (e) {
      toast.error("Failed to update favorite");
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    setIsLoading(true);
    try {
      await addComment(task.id, commentInput.trim());
      // Update local state optimistically
      const newComment: Comment = {
        id: Math.random().toString(36),
        taskId: task.id,
        memberId: "current_user", // This would be the actual current user
        text: commentInput.trim(),
        createdAt: Date.now(),
      };
      setComments([...comments, newComment]);
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
      await deleteComment(task.id, commentId);
      setComments(comments.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch (e) {
      toast.error("Failed to delete comment");
    }
  };

  const subtaskProgress = task.subtasks
    ? Math.round((task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100) || 0
    : 0;

  const checklistProgress = task.checklist
    ? Math.round((task.checklist.filter((c) => c.completed).length / task.checklist.length) * 100) || 0
    : 0;

  const isPastDue = new Date(task.deadline) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-8">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl">{task.title}</DialogTitle>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleToggleFavorite()}
              className={cn(
                "p-2 rounded-lg transition-colors",
                task.isFavorite
                  ? "text-white bg-white/20"
                  : "text-muted-foreground hover:bg-white/10"
              )}
            >
              <Star className="h-5 w-5" fill={task.isFavorite ? "currentColor" : "none"} />
            </motion.button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Description */}
          {task.description && (
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-sm text-muted-foreground">{task.description}</p>
            </div>
          )}

          {/* Due Date Warning */}
          {isPastDue && (
            <div className="flex gap-3 items-start p-3 bg-white/10 border border-white/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-300">This task is overdue</span>
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
                    <Badge className="bg-primary/20 text-primary border border-primary/30 cursor-pointer hover:bg-primary/30 flex gap-1 items-center">
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
          {(task.subtasks || isAdmin) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" /> Subtasks
                </Label>
                {task.subtasks && task.subtasks.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {subtaskProgress}%
                  </span>
                )}
              </div>

              {task.subtasks && task.subtasks.length > 0 && (
                <div className="space-y-2 mb-3">
                  <AnimatePresence>
                    {task.subtasks.map((subtask: Subtask) => (
                      <motion.div
                        key={subtask.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 group"
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
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                          >
                            <Trash2 className="h-3 w-3 text-gray-400" />
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
          {(task.checklist || isAdmin) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Check className="h-4 w-4" /> Checklist
                </Label>
                {task.checklist && task.checklist.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {checklistProgress}%
                  </span>
                )}
              </div>

              {task.checklist && task.checklist.length > 0 && (
                <div className="space-y-2 mb-3">
                  <AnimatePresence>
                    {task.checklist.map((item: ChecklistItem) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 group"
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
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                          >
                            <Trash2 className="h-3 w-3 text-gray-400" />
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

          {/* Time Tracking */}
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Time Spent
            </Label>
            <div className="flex gap-2 items-center">
              <span className="text-2xl font-bold">{timeSpent}</span>
              <span className="text-sm text-muted-foreground">mins</span>
            </div>
          </div>

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
                      className="p-3 bg-white/5 rounded-lg group hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {comment.memberId}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-all"
                          >
                            <Trash2 className="h-3 w-3 text-gray-400" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground break-words">{comment.text}</p>
                      <span className="text-xs text-muted-foreground/60 mt-1">
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

        <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
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
