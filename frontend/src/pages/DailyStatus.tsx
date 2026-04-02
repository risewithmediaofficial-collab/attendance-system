import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { storage } from "../lib/storage";
import { submitDailyStatus } from "../lib/storage";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export function DailyStatusUpdate() {
  const currentMember = storage.getCurrentMember();
  const tasks = storage.getTasks();
  const [date] = useState(format(new Date(), "yyyy-MM-dd"));
  const [completed, setCompleted] = useState("");
  const [selectedPending, setSelectedPending] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Check if user is admin - admins don't submit daily status
  if (currentMember?.role === "Admin") {
    return (
      <div className="min-h-screen bg-white p-4 md:p-6">
        <div className="max-w-md mx-auto mt-20 text-center">
          <AlertCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Panel</h2>
          <p className="text-gray-600 mb-6">
            Admins don't submit daily status. Please use the <strong>Review Tasks</strong> section to manage team progress.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = "/admin-review"}>
            Go to Review Tasks
          </Button>
        </div>
      </div>
    );
  }

  // Get user's tasks
  const userTasks = useMemo(() => {
    return tasks.filter((t) => {
      const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
      return assignees.includes(currentMember?.id || "");
    });
  }, [tasks, currentMember?.id]);

  const incompleteTasks = useMemo(() => {
    return userTasks.filter((t) => t.status !== "Completed");
  }, [userTasks]);

  const handleSelectPendingTask = (taskId: string) => {
    const newSelected = new Set(selectedPending);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedPending(newSelected);
  };

  const handleSubmit = async () => {
    if (!completed.trim()) {
      toast.error("Please describe what you completed today");
      return;
    }

    setIsLoading(true);
    try {
      await submitDailyStatus({
        memberId: currentMember?.id || "",
        date,
        completedToday: completed,
        pendingTasks: Array.from(selectedPending),
        notes,
      });
      setSubmitted(true);
      toast.success("Daily status submitted successfully!");
      setTimeout(() => {
        setCompleted("");
        setSelectedPending(new Set());
        setNotes("");
        setSubmitted(false);
      }, 2000);
    } catch (e) {
      toast.error("Failed to submit daily status");
    } finally {
      setIsLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return format(today, "MMMM dd, yyyy");
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Status Update</h1>
        <p className="text-gray-600 mb-6">{getTodayDate()}</p>
      </motion.div>

      {/* Success Message */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-700" />
            <span className="text-green-800 font-medium">Status updated successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Completed Today */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">What Did You Complete Today?</h2>
            </div>
            <Textarea
              placeholder="Describe the work you completed today... (e.g., Fixed login bug, Reviewed 3 PRs, Updated documentation)"
              value={completed}
              onChange={(e) => setCompleted(e.target.value)}
              className="min-h-24 text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              Be specific and include key accomplishments for the day
            </p>
          </Card>

          {/* Pending Tasks */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Pending Tasks</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Select tasks you still need to complete:
            </p>

            {incompleteTasks.length === 0 ? (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                <p className="text-sm text-green-700 font-medium">🎉 No pending tasks! Great work</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {incompleteTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedPending.has(task.id)}
                      onCheckedChange={() => handleSelectPendingTask(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className="text-xs">{task.status}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {task.priority}
                        </Badge>
                        <span className="text-xs text-gray-600">
                          Due: {format(new Date(task.deadline), "MMM dd")}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Additional Notes */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Additional Notes</h2>
            </div>
            <Textarea
              placeholder="Any blockers, concerns, or additional info for your manager? (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20 text-sm"
            />
          </Card>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !completed.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
          >
            {isLoading ? "Submitting..." : "Submit Daily Status"}
          </Button>
        </motion.div>

        {/* Sidebar Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
            <p className="text-sm text-gray-600 mb-1">Today's Tasks</p>
            <p className="text-3xl font-bold text-blue-900">{userTasks.length}</p>
            <p className="text-xs text-blue-700 mt-2">Total assigned to you</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-900">
              {userTasks.filter((t) => t.status === "Completed").length}
            </p>
            <p className="text-xs text-green-700 mt-2">Tasks finished</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
            <p className="text-sm text-gray-600 mb-1">In Progress</p>
            <p className="text-3xl font-bold text-orange-900">{incompleteTasks.length}</p>
            <p className="text-xs text-orange-700 mt-2">Pending completion</p>
          </Card>

          <Card className="p-4 bg-gray-50 border-2 border-dashed border-gray-300">
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Tips</p>
            <ul className="space-y-2 text-xs text-gray-600">
              <li>✓ Be specific in your accomplishments</li>
              <li>✓ Update daily for tracking</li>
              <li>✓ Report blockers early</li>
              <li>✓ Keep notes concise</li>
            </ul>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
