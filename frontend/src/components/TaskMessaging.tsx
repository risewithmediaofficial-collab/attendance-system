import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { storage } from "../lib/storage";
import { Task, TaskMessage } from "../lib/storageTypes";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { Send, MessageSquare, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { sendTaskMessage, reviewTaskCompletion } from "../lib/storage";
import { format } from "date-fns";
import { cn } from "../lib/utils";

interface TaskMessagingProps {
  task: Task;
  onTaskUpdate?: (updates: Partial<Task>) => void;
}

export function TaskMessaging({ task, onTaskUpdate }: TaskMessagingProps) {
  const currentMember = storage.getCurrentMember();
  const members = storage.getMembers();
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const memberMap = useMemo(() => {
    const map = new Map();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    setIsLoading(true);
    try {
      await sendTaskMessage(task.id, messageText.trim(), currentMember?.role === "Admin");
      setMessageText("");
      toast.success("Message sent");
    } catch (e) {
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveCompletion = async () => {
    setIsLoading(true);
    try {
      await reviewTaskCompletion(task.id, "approved");
      toast.success("Task approved!");
      onTaskUpdate?.(task);
    } catch (e) {
      toast.error("Failed to approve task");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectCompletion = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setIsLoading(true);
    try {
      await reviewTaskCompletion(task.id, "rejected", rejectReason);
      toast.success("Task moved back to In Progress");
      setRejectReason("");
      setShowRejectForm(false);
      onTaskUpdate?.(task);
    } catch (e) {
      toast.error("Failed to process rejection");
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = currentMember?.role === "Admin";
  const isTaskComplete = task.status === "Completed";
  const isReviewPending = isTaskComplete && !task.review;
  const isApproved = task.review?.status === "approved";
  const isRejected = task.review?.status === "rejected";

  return (
    <div className="space-y-4">
      {/* Task Status Badge */}
      {isTaskComplete && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">Task Marked as Complete</p>
            </div>
            {isApproved && (
              <div className="flex items-center gap-2 p-2 bg-green-100 rounded">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">Approved by {memberMap.get(task.review?.reviewedBy)?.name}</span>
              </div>
            )}
            {isRejected && (
              <div className="space-y-1 p-2 bg-orange-100 rounded">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-700">Sent back to In Progress</span>
                </div>
                {task.review?.rejectionReason && (
                  <p className="text-xs text-orange-600 ml-6 italic">Reason: {task.review.rejectionReason}</p>
                )}
              </div>
            )}

            {/* Admin Review Actions (only show if pending and user is admin) */}
            {isReviewPending && isAdmin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 p-2 bg-white rounded space-y-2 border border-blue-200"
              >
                <p className="text-xs font-medium text-gray-600 mb-2">Admin Review Required</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleApproveCompletion}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowRejectForm(!showRejectForm)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="w-3 h-3 mr-1" /> Reject
                  </Button>
                </div>

                {showRejectForm && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-2 bg-red-50 rounded space-y-2"
                  >
                    <Input
                      placeholder="Why is this task not complete? (Be specific)"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleRejectCompletion} disabled={isLoading} className="bg-red-600">
                        Send Feedback & Reopen
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectReason("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Messages Thread */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Messages</span>
          {task.messages && task.messages.length > 0 && (
            <Badge className="bg-gray-200 text-gray-700">{task.messages.length}</Badge>
          )}
        </div>

        {/* Messages List */}
        {task.messages && task.messages.length > 0 ? (
          <div className="max-h-64 overflow-y-auto space-y-2 p-3 bg-gray-50 rounded-lg">
            <AnimatePresence>
              {task.messages.map((msg, idx) => {
                const sender = memberMap.get(msg.senderId);
                const isCurrentUser = msg.senderId === currentMember?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "p-2 rounded-lg",
                      isCurrentUser ? "bg-blue-100 ml-12" : "bg-white mr-12 border border-gray-200",
                      msg.isAdmin ? "border-l-2 border-orange-400" : ""
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">
                          {sender?.name || "Unknown"}
                        </span>
                        {msg.isAdmin && (
                          <Badge className="bg-orange-100 text-orange-700 text-xs">Admin</Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(msg.createdAt), "HH:mm")}
                      </span>
                    </div>

                    <p className="text-sm text-gray-800 mb-2">{msg.text}</p>

                    {/* Task snapshot */}
                    {msg.taskSnapshot && (
                      <div className="text-xs bg-white/50 p-1.5 rounded border border-gray-200">
                        <p className="font-medium text-gray-700">{msg.taskSnapshot.title}</p>
                        <p className="text-gray-600">
                          Status: {msg.taskSnapshot.status} • Priority: {msg.taskSnapshot.priority}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded">No messages yet</p>
        )}
      </div>

      {/* Message Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Reply or send message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          className="text-sm"
          disabled={isLoading}
        />
        <Button
          size="sm"
          onClick={handleSendMessage}
          disabled={isLoading || !messageText.trim()}
          className="px-3"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
