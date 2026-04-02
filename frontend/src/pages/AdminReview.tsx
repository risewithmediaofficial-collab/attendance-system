import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { storage } from "../lib/storage";
import { reviewTaskCompletion } from "../lib/storage";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface ReviewingTask {
  id: string;
  isApproving: boolean;
}

export function AdminReviewDashboard() {
  const currentMember = storage.getCurrentMember();
  const tasks = storage.getTasks();
  const members = storage.getMembers();

  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<ReviewingTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get pending reviews (tasks with status Completed but no review)
  const pendingReviews = useMemo(() => {
    return tasks.filter((t) => {
      const hasNoReview = !t.review || t.review.status === "pending";
      return t.status === "Completed" && hasNoReview;
    });
  }, [tasks]);

  const getMemberName = (id: string) => {
    return members.find((m) => m.id === id)?.name || "Unknown";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-300";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const handleApprove = async (taskId: string) => {
    setIsLoading(true);
    try {
      await reviewTaskCompletion(taskId, "approved");
      toast.success("Task approved successfully!");
      setSelectedTask(null);
      setReviewing(null);
    } catch (e) {
      toast.error("Failed to approve task");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (taskId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsLoading(true);
    try {
      await reviewTaskCompletion(taskId, "rejected", rejectionReason);
      toast.success("Task rejected and moved back to In Progress");
      setRejectionReason("");
      setSelectedTask(null);
      setReviewing(null);
    } catch (e) {
      toast.error("Failed to reject task");
    } finally {
      setIsLoading(false);
    }
  };

  if (currentMember?.role !== "Admin") {
    return (
      <div className="min-h-screen bg-white p-4 md:p-6">
        <div className="max-w-md mx-auto mt-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            This dashboard is only available to administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Review Dashboard</h1>
        <p className="text-gray-600">Review and approve task completions</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
      >
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Reviews</p>
              <p className="text-3xl font-bold text-orange-900">{pendingReviews.length}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Approved Today</p>
              <p className="text-3xl font-bold text-green-900">
                {tasks.filter((t) => t.review?.status === "approved").length}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-900">
                {tasks.filter((t) => t.review?.status === "rejected").length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-600 opacity-50" />
          </div>
        </Card>
      </motion.div>

      {/* Pending Reviews List */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        {pendingReviews.length === 0 ? (
          <Card className="p-12 text-center bg-green-50 border-2 border-dashed border-green-300">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-1">All Caught Up!</h3>
            <p className="text-green-700">No pending task reviews at the moment.</p>
          </Card>
        ) : (
          pendingReviews.map((task, index) => {
            const isSelected = selectedTask === task.id;
            const assignees = Array.isArray(task.assignedTo)
              ? task.assignedTo
              : [task.assignedTo];

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedTask(isSelected ? null : task.id)}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{task.title}</h3>
                        <p className="text-sm text-gray-600">{task.description}</p>
                      </div>
                      <Badge className={`ml-2 ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">Completed by:</span>
                        <span className="font-medium text-gray-900">
                          {assignees.map((id) => getMemberName(id)).join(", ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">On:</span>
                        <span className="font-medium text-gray-900">
                          {format(new Date(task.completedAt || task.updatedAt), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons - Only show when selected */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-3 border-t border-gray-200 space-y-3"
                        >
                          {/* Approval Section */}
                          {reviewing?.id === task.id && reviewing.isApproving ? (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-900">
                                Approve this task completion?
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleApprove(task.id)}
                                  disabled={isLoading}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                  {isLoading ? "Approving..." : "Confirm Approve"}
                                </Button>
                                <Button
                                  onClick={() => setReviewing(null)}
                                  disabled={isLoading}
                                  variant="outline"
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : reviewing?.id === task.id && !reviewing.isApproving ? (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-900">
                                Why are you rejecting this task?
                              </p>
                              <Textarea
                                placeholder="Provide constructive feedback (e.g., needs more testing, doesn't meet requirements, needs revision)"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="min-h-20"
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleReject(task.id)}
                                  disabled={isLoading || !rejectionReason.trim()}
                                  className="flex-1 bg-red-600 hover:bg-red-700"
                                >
                                  {isLoading ? "Rejecting..." : "Confirm Rejection"}
                                </Button>
                                <Button
                                  onClick={() => {
                                    setReviewing(null);
                                    setRejectionReason("");
                                  }}
                                  disabled={isLoading}
                                  variant="outline"
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                onClick={() =>
                                  setReviewing({ id: task.id, isApproving: true })
                                }
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() =>
                                  setReviewing({ id: task.id, isApproving: false })
                                }
                                variant="destructive"
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}
