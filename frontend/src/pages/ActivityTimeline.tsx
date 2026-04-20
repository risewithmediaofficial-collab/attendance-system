import { useState, useEffect, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { storage } from "../lib/storage";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Activity, Calendar, User, FileText } from "lucide-react";
import { motion as m } from "framer-motion";

interface TimelineEntry {
  id: string;
  taskId?: string;
  taskTitle?: string;
  memberId: string;
  memberName: string;
  action: string;
  details?: string;
  timestamp: number;
}

const actionConfig: Record<string, { icon: ReactNode; color: string; label: string }> = {
  "Created comment": { icon: <FileText className="w-4 h-4" />, color: "bg-blue-100 text-blue-700", label: "Commented" },
  "Deleted comment": { icon: <FileText className="w-4 h-4" />, color: "bg-red-100 text-red-700", label: "Removed comment" },
  "Task created": { icon: <FileText className="w-4 h-4" />, color: "bg-green-100 text-green-700", label: "Created task" },
  "Task updated": { icon: <FileText className="w-4 h-4" />, color: "bg-yellow-100 text-yellow-700", label: "Updated task" },
  "Task completed": { icon: <FileText className="w-4 h-4" />, color: "bg-purple-100 text-purple-700", label: "Completed" },
  "Task deleted": { icon: <FileText className="w-4 h-4" />, color: "bg-red-100 text-red-700", label: "Deleted task" },
};

export function ActivityTimeline() {
  const role = storage.getCurrentRole();
  const currentMember = storage.getCurrentMember();
  const tasks = storage.getTasks();
  const members = storage.getMembers();
  const [activities, setActivities] = useState<TimelineEntry[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<TimelineEntry[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("All");
  const [selectedAction, setSelectedAction] = useState<string>("All");
  const [searchTask, setSearchTask] = useState("");

  const visibleTasks = useMemo(() => {
    if (role === "Admin") return tasks;
    if (!currentMember?.id) return [];
    return tasks.filter((task) => {
      const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
      return assignees.includes(currentMember.id);
    });
  }, [tasks, role, currentMember?.id]);

  useEffect(() => {
    // Build activities from tasks (changes/comments)
    const allActivities: TimelineEntry[] = [];

    visibleTasks.forEach((task) => {
      // Add comments as activities
      if (task.comments) {
        task.comments.forEach((comment) => {
          const member = members.find((m) => m.id === comment.memberId);
          allActivities.push({
            id: comment.id,
            taskId: task.id,
            taskTitle: task.title,
            memberId: comment.memberId,
            memberName: member?.name || "Unknown",
            action: "Added comment",
            details: comment.text,
            timestamp: comment.createdAt,
          });
        });
      }

      // Add task creation/update as activity
      allActivities.push({
        id: `${task.id}-created`,
        taskId: task.id,
        taskTitle: task.title,
        memberId: "system",
        memberName: "System",
        action: "Task created",
        timestamp: task.createdAt,
      });

      // Add completion as activity
      if (task.status === "Completed" && task.completedAt) {
        allActivities.push({
          id: `${task.id}-completed`,
          taskId: task.id,
          taskTitle: task.title,
          memberId: "system",
          memberName: "System",
          action: "Task completed",
          timestamp: task.completedAt,
        });
      }
    });

    // Sort by timestamp (newest first)
    allActivities.sort((a, b) => b.timestamp - a.timestamp);
    setActivities(allActivities);
  }, [visibleTasks, members]);

  // Filter activities
  useEffect(() => {
    let filtered = activities;

    if (selectedMember !== "All") {
      filtered = filtered.filter((a) => a.memberId === selectedMember);
    }

    if (selectedAction !== "All") {
      filtered = filtered.filter((a) => a.action === selectedAction);
    }

    if (searchTask) {
      filtered = filtered.filter((a) =>
        a.taskTitle?.toLowerCase().includes(searchTask.toLowerCase())
      );
    }

    setFilteredActivities(filtered);
  }, [activities, selectedMember, selectedAction, searchTask]);

  const uniqueActions = Array.from(new Set(activities.map((a) => a.action)));
  const uniqueMembers = Array.from(new Set(activities.map((a) => a.memberId)));

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Timeline</h1>
        <p className="text-gray-600 mb-6">Track all task activity and changes</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6"
      >
        <Input
          placeholder="Search tasks..."
          value={searchTask}
          onChange={(e) => setSearchTask(e.target.value)}
          className="text-sm"
        />

        <Select value={selectedMember} onValueChange={setSelectedMember}>
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Users</SelectItem>
            {uniqueMembers.map((memberId) => {
              const member = members.find((m) => m.id === memberId);
              return (
                <SelectItem key={memberId} value={memberId}>
                  {member?.name || memberId}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Select value={selectedAction} onValueChange={setSelectedAction}>
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Actions</SelectItem>
            {uniqueActions.map((action) => (
              <SelectItem key={action} value={action}>
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Timeline */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="space-y-4">
          <AnimatePresence>
            {filteredActivities.length === 0 ? (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-gray-500"
              >
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No activities found matching your filters</p>
              </m.div>
            ) : (
              filteredActivities.map((activity, idx) => {
                const config = actionConfig[activity.action] || {
                  icon: <Activity className="w-4 h-4" />,
                  color: "bg-gray-100 text-gray-700",
                  label: activity.action,
                };
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex gap-4"
                  >
                    {/* Timeline line and dot */}
                    <div className="flex flex-col items-center">
                      <div className={`rounded-full p-2.5 ${config.color}`}>
                        {config.icon}
                      </div>
                      {idx < filteredActivities.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                      )}
                    </div>

                    {/* Activity card */}
                    <Card className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{config.label}</p>
                          <p className="text-sm text-gray-600">{activity.memberName}</p>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                          {format(new Date(activity.timestamp), "MMM dd")}
                        </span>
                      </div>

                      {activity.taskTitle && (
                        <p className="text-sm text-gray-700 mb-2">
                          Task: <span className="font-medium">{activity.taskTitle}</span>
                        </p>
                      )}

                      {activity.details && (
                        <p className="text-sm text-gray-600 italic border-l-2 border-gray-300 pl-3">
                          "{activity.details}"
                        </p>
                      )}
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Stats Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-6"
      >
        <div>
          <p className="text-sm text-gray-600">Total Activities</p>
          <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Active Users</p>
          <p className="text-2xl font-bold text-gray-900">{uniqueMembers.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Action Types</p>
          <p className="text-2xl font-bold text-gray-900">{uniqueActions.length}</p>
        </div>
      </motion.div>
    </div>
  );
}
