# 🎯 Quick Integration Guide - Premium UX Features

This guide shows you how to quickly add the 8 premium features to your existing pages.

## 1️⃣ Command Palette ✅ (Already integrated)

Already added to App.tsx! Just press **Ctrl+K** anywhere in the app.

---

## 2️⃣ Focus Mode - Add to Task Cards

Add a button to navigate to focus mode:

```tsx
import { useNavigate } from "react-router-dom";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function TaskCard({ task }) {
  const navigate = useNavigate();
  
  return (
    <div className="task-card">
      {/* ... task content ... */}
      <Button 
        onClick={() => navigate(`/focus/${task.id}`)}
        size="sm"
        variant="ghost"
      >
        <Maximize2 className="w-4 h-4 mr-1" />
        Focus
      </Button>
    </div>
  );
}
```

---

## 3️⃣ Progress Bars - Add to Task Lists

### Option A: Simple Task Progress
```tsx
import { TaskProgress } from "@/components/ProgressBar";

function TaskListItem({ task }) {
  return (
    <div>
      <h3>{task.title}</h3>
      <TaskProgress task={task} showDetails={true} />
    </div>
  );
}
```

### Option B: Project Progress
```tsx
import { ProjectProgress } from "@/components/ProgressBar";

function ProjectWidget({ tasks }) {
  return (
    <div>
      <h2>Project Progress</h2>
      <ProjectProgress tasks={tasks} showBreakdown={true} />
    </div>
  );
}
```

---

## 4️⃣ Undo System ✅ (Already integrated)

Already added to App.tsx with `<UndoProvider>`!

Use it when handling delete/update:

```tsx
import { useUndo, createUndoAction } from "@/lib/undo";
import { toast } from "@/components/ui/use-toast";

function useTaskDelete() {
  const { setLastAction } = useUndo();
  
  const handleDelete = async (taskId: string) => {
    // Get task data before delete
    const task = await storage.getTask(taskId);
    
    // Create undo action
    const action = createUndoAction(
      'delete',
      `Deleted task: ${task.title}`,
      task,
      async () => await storage.createTask(task)
    );
    
    // Show undo opportunity
    setLastAction(action);
    
    // Perform delete
    await storage.deleteTask(taskId);
    
    // Show toast with undo button
    toast({
      description: `Task deleted`,
      action: {
        label: "Undo",
        onClick: async () => {
          await action.undo();
          // Refresh task list
        }
      }
    });
  };
  
  return { handleDelete };
}
```

---

## 5️⃣ Quick Filter Chips - Add to Task Pages

### In MyWork page:
```tsx
import { useState } from "react";
import { DefaultTaskFilters } from "@/components/QuickFilterChips";

function MyWorkPage() {
  const [filters, setFilters] = useState({
    myTasks: false,
    highPriority: false,
    overdue: false,
    completed: false
  });
  
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    // Re-filter your task list
  };
  
  return (
    <div className="space-y-4">
      <DefaultTaskFilters 
        onFiltersChange={handleFiltersChange}
        counts={{
          myTasks: 5,
          highPriority: 2,
          overdue: 1,
          completed: 12
        }}
      />
      {/* Your task list filtered based on `filters` */}
    </div>
  );
}
```

---

## 6️⃣ Activity Panel - Add to Dashboard

Add to dashboard sidebar:

```tsx
import { MiniActivityPanel } from "@/components/MiniActivityPanel";

function Dashboard() {
  return (
    <div className="flex gap-4">
      <div className="flex-1">
        {/* Main content */}
      </div>
      <div className="w-80">
        <MiniActivityPanel 
          limit={15}
          showScroll={true}
          onActivityClick={(activity) => {
            // Handle activity click (e.g., navigate to task)
          }}
        />
      </div>
    </div>
  );
}
```

---

## 7️⃣ Smart Insights - Add to Dashboard

Add to dashboard top section:

```tsx
import { SmartInsight, SmartInsights } from "@/components/SmartInsights";

function Dashboard() {
  const currentUserId = getCurrentUserId();
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1>Welcome back!</h1>
        
        {/* Smart Insights */}
        <div className="mt-6">
          <SmartInsights 
            userMemberId={currentUserId}
            maxItems={4}
            compact={false}
          />
        </div>
      </div>
      
      {/* Rest of dashboard */}
    </div>
  );
}
```

---

## 8️⃣ Session Tracking (Optional Backend Feature)

See PREMIUM_UX_FEATURES.md for complete backend schema and API setup.

---

## 🎨 Real-World Example: MyWork Page

Here's how to integrate multiple features together:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DefaultTaskFilters } from "@/components/QuickFilterChips";
import { TaskProgress } from "@/components/ProgressBar";
import { SmartInsights } from "@/components/SmartInsights";
import { Button } from "@/components/ui/button";
import { Maximize2, Trash2 } from "lucide-react";

export default function MyWorkPageEnhanced() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({
    myTasks: false,
    highPriority: false,
    overdue: false,
    completed: false
  });

  // Filter tasks based on active filters
  const filteredTasks = tasks.filter(task => {
    if (filters.myTasks && !task.assignedTo?.includes(getCurrentUserId())) 
      return false;
    if (filters.highPriority && task.priority !== 'High') return false;
    if (filters.overdue && !(new Date(task.dueDate) < new Date() && task.status !== 'Completed'))
      return false;
    if (filters.completed && task.status !== 'Completed') 
      return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* 1. Smart Insights at top */}
      <SmartInsights userMemberId={getCurrentUserId()} />

      {/* 2. Quick filter chips */}
      <DefaultTaskFilters 
        onFiltersChange={setFilters}
        counts={{
          myTasks: tasks.length,
          highPriority: tasks.filter(t => t.priority === 'High').length,
          overdue: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'Completed').length,
          completed: tasks.filter(t => t.status === 'Completed').length,
        }}
      />

      {/* 3. Task list with progress bars and focus button */}
      <div className="grid gap-3">
        {filteredTasks.map(task => (
          <div key={task.id} className="p-4 rounded-lg border border-white/10 bg-white/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold">{task.title}</h3>
                <TaskProgress task={task} showDetails={true} />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate(`/focus/${task.id}`)}
                  size="sm"
                  variant="ghost"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎯 Integration Priority Order

1. **First** (Foundation):
   - ✅ Ctrl+K Command Palette
   - ✅ Undo System
   - Add Focus Mode route button

2. **Second** (Visibility):
   - Add Progress Bars to task cards
   - Add Smart Insights to Dashboard

3. **Third** (Filtering):
   - Add Quick Filter Chips
   - Add Activity Panel to sidebar

4. **Optional**:
   - Session Tracking (backend work)

---

## 📦 Common Imports

```tsx
// Progress Bars
import { ProgressBar, TaskProgress, ProjectProgress } from "@/components/ProgressBar";

// Filters
import { QuickFilterChips, DefaultTaskFilters } from "@/components/QuickFilterChips";

// Activity
import { MiniActivityPanel, ActivityPanelSidebar } from "@/components/MiniActivityPanel";

// Insights
import { SmartInsights, SmartInsightsWidget } from "@/components/SmartInsights";

// Undo
import { useUndo, createUndoAction, UndoProvider } from "@/lib/undo";

// Focus Mode (routing)
import FocusMode from "@/pages/FocusMode";

// Command Palette
import { CommandPalette } from "@/components/CommandPalette";
```

---

## 🧪 Testing Checklist

After integrating:

- [ ] Command Palette opens with Ctrl+K
- [ ] Focus Mode opens full-screen without sidebar
- [ ] Focus timer counts up correctly
- [ ] Progress bars animate smoothly
- [ ] Filter chips apply filters correctly
- [ ] Activity panel shows recent activities
- [ ] Smart insights numbers are accurate
- [ ] Undo button appears on delete (after toast integration)
- [ ] All features work on mobile
- [ ] No console errors

---

## 🚀 Performance Tips

1. **Memoize lists** when using filter chips
2. **Lazy load** activity panel (only if visible)
3. **Debounce** progress bar updates if frequency is high
4. **Cache** smart insights calculations
5. **Use** React.memo on task cards if using progress bars

---

## 📞 Found an Issue?

Check:
1. Is `<UndoProvider>` wrapping your app? (Should be in App.tsx)
2. Is `<CommandPalette>` in your App.tsx?
3. Are you using correct imports with `@/components` alias?
4. Check browser console for errors

---

**Happy integrating! 🎉**

For detailed docs, see: [PREMIUM_UX_FEATURES.md](./PREMIUM_UX_FEATURES.md)
