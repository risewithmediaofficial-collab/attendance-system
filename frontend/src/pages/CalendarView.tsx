import { useState, useMemo } from "react";
import { storage } from "../lib/storage";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { TaskDetailsDialog } from "../components/TaskDetailsDialog";

export function CalendarView() {
  const tasks = storage.getTasks();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, typeof tasks>();
    tasks.forEach((task) => {
      if (task.status !== "Completed") {
        const dateKey = task.deadline;
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(task);
      }
    });
    return grouped;
  }, [tasks]);

  const getTasksForDate = (date: Date): typeof tasks => {
    const dateString = format(date, "yyyy-MM-dd");
    return tasksByDate.get(dateString) || [];
  };

  const previousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-gray-800 text-white";
      case "Medium":
        return "bg-gray-600 text-white";
      case "Low":
        return "bg-gray-400 text-white";
      default:
        return "bg-gray-300 text-gray-700";
    }
  };

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) || null : null;

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Calendar View</h1>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={previousMonth}
              className="h-10 w-10 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-2xl font-bold text-gray-900 min-w-64 text-center">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className="h-10 w-10 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentMonth(new Date())}
            className="rounded-lg"
          >
            Today
          </Button>
        </div>
      </motion.div>

      {/* Day Headers */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-7 gap-2 mb-2"
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-semibold text-gray-700 py-2">
            {day}
          </div>
        ))}
      </motion.div>

      {/* Calendar Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-7 gap-2"
      >
        {days.map((date, idx) => {
          const dayTasks = getTasksForDate(date);
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isTodayDate = isToday(date);

          return (
            <motion.div
              key={date.toISOString()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.01 }}
              className={`
                min-h-32 p-3 rounded-lg border-2 transition-all
                ${
                  isCurrentMonth
                    ? "bg-white border-gray-200 hover:border-gray-400"
                    : "bg-gray-50 border-gray-100"
                }
                ${isTodayDate ? "ring-2 ring-gray-400 border-gray-400" : ""}
              `}
            >
              {/* Date */}
              <div
                className={`
                text-sm font-bold mb-2
                ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}
                ${isTodayDate ? "bg-gray-800 text-white px-2 py-1 rounded inline-block" : ""}
              `}
              >
                {format(date, "d")}
              </div>

              {/* Tasks */}
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {dayTasks.map((task, taskIdx) => (
                  <motion.button
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: taskIdx * 0.05 }}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="block w-full text-left"
                  >
                    <div className={`text-xs px-2 py-1 rounded truncate hover:opacity-90 transition-opacity ${getPriorityColor(
                      task.priority
                    )}`}>
                      {task.title}
                    </div>
                  </motion.button>
                ))}
              </div>

              {dayTasks.length > 3 && (
                <div className="text-xs text-gray-500 mt-1">
                  +{dayTasks.length - 3} more
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 flex gap-4 flex-wrap"
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-800" />
          <span className="text-sm text-gray-600">High Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-600" />
          <span className="text-sm text-gray-600">Medium Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-400" />
          <span className="text-sm text-gray-600">Low Priority</span>
        </div>
      </motion.div>

      {/* Task Details */}
      {selectedTask && (
        <TaskDetailsDialog
          task={selectedTask}
          open={!!selectedTaskId}
          onOpenChange={(open) => !open && setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}
