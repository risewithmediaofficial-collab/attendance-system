import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Check, AlertCircle, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterChip {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  count?: number;
}

interface QuickFilterChipsProps {
  filters: FilterChip[];
  selected: string[];
  onFilterChange: (selected: string[]) => void;
  align?: "left" | "center";
}

export function QuickFilterChips({
  filters,
  selected,
  onFilterChange,
  align = "left",
}: QuickFilterChipsProps) {
  const toggleFilter = (filterId: string) => {
    if (selected.includes(filterId)) {
      onFilterChange(selected.filter((f) => f !== filterId));
    } else {
      onFilterChange([...selected, filterId]);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", align === "center" && "justify-center")}>
      {filters.map((filter) => {
        const isSelected = selected.includes(filter.id);
        return (
          <motion.div
            key={filter.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={() => toggleFilter(filter.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                "border border-neutral-200",
                isSelected
                  ? "bg-white/20 border-white/30 text-white shadow-lg"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              )}
              title={filter.description}
            >
              {filter.icon && <span className="text-base">{filter.icon}</span>}
              <span>{filter.label}</span>
              {filter.count !== undefined && (
                <span className="text-xs opacity-70 ml-1">({filter.count})</span>
              )}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

interface DefaultTaskFiltersProps {
  onFiltersChange: (filters: {
    myTasks: boolean;
    highPriority: boolean;
    overdue: boolean;
    completed: boolean;
  }) => void;
  counts?: {
    myTasks?: number;
    highPriority?: number;
    overdue?: number;
    completed?: number;
  };
}

export function DefaultTaskFilters({
  onFiltersChange,
  counts = {},
}: DefaultTaskFiltersProps) {
  const [selected, setSelected] = React.useState<string[]>([]);

  const filters: FilterChip[] = [
    {
      id: "myTasks",
      label: "My Tasks",
      icon: <Check className="w-4 h-4" />,
      description: "Tasks assigned to me",
      count: counts.myTasks,
    },
    {
      id: "highPriority",
      label: "High Priority",
      icon: <Zap className="w-4 h-4" />,
      description: "High priority tasks only",
      count: counts.highPriority,
    },
    {
      id: "overdue",
      label: "Overdue",
      icon: <AlertCircle className="w-4 h-4" />,
      description: "Overdue tasks",
      count: counts.overdue,
    },
    {
      id: "completed",
      label: "Completed",
      icon: <CheckCircle2 className="w-4 h-4" />,
      description: "Completed tasks",
      count: counts.completed,
    },
  ];

  const handleFilterChange = (newSelected: string[]) => {
    setSelected(newSelected);
    onFiltersChange({
      myTasks: newSelected.includes("myTasks"),
      highPriority: newSelected.includes("highPriority"),
      overdue: newSelected.includes("overdue"),
      completed: newSelected.includes("completed"),
    });
  };

  return (
    <QuickFilterChips
      filters={filters}
      selected={selected}
      onFilterChange={handleFilterChange}
      align="left"
    />
  );
}
