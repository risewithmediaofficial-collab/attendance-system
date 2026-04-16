/**
 * REFACTORED TASKS PAGE
 * Clean, modular with improved data isolation
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { storage, generateId, type Task, type TaskStatus, type TaskPriority } from '@/lib/storage';
import { useForm, useTable, useFilteredTasks } from '@/hooks/use-composite';
import { PageContainer, PageHeader, Section } from '@/components/LayoutComponents';
import { DataTable, ColumnDef, EmptyState } from '@/components/TableComponents';
import { FormWrapper, FormField } from '@/components/FormComponents';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { cn } from '@/lib/utils';

// Status badge colors
const statusColors = {
  'Assigned': 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  'Completed': 'bg-green-100 text-green-800',
};

const priorityColors = {
  'High': 'bg-red-100 text-red-800',
  'Medium': 'bg-yellow-100 text-yellow-800',
  'Low': 'bg-gray-100 text-gray-800',
};

// Task form component
function TaskForm({
  task,
  onSubmit,
  onCancel,
  isSubmitting,
  members,
  role,
}: {
  task?: Task;
  onSubmit: (data: Partial<Task>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  members: any[];
  role: string;
}) {
  const form = useForm<Partial<Task>>(
    {
      title: task?.title || '',
      description: task?.description || '',
      assignedTo: task?.assignedTo || '',
      deadline: task?.deadline || format(new Date(), 'yyyy-MM-dd'),
      priority: task?.priority || 'Medium',
    },
    (values) => onSubmit(values)
  );

  const errors = form.errors as Record<string, string>;

  // Only admins can create/edit
  if (role !== 'Admin') {
    return (
      <div className="text-center py-4 text-gray-600">
        <p>Only administrators can create or edit tasks.</p>
      </div>
    );
  }

  return (
    <FormWrapper
      onSubmit={form.handleSubmit}
      submitLabel={task ? 'Update Task' : 'Create Task'}
      isSubmitting={isSubmitting}
      onCancel={onCancel}
      layout="inline"
      spacing="normal"
    >
      <FormField label="Task Title" error={errors.title} required>
        <Input
          placeholder="Enter task title"
          value={String(form.formData.title || '')}
          onChange={(e) => form.handleChange('title', e.target.value)}
        />
      </FormField>

      <FormField label="Description" error={errors.description}>
        <Textarea
          placeholder="Enter task description"
          value={String(form.formData.description || '')}
          onChange={(e) => form.handleChange('description', e.target.value)}
          rows={3}
        />
      </FormField>

      <FormField label="Assign To" error={errors.assignedTo} required>
        <Select
          value={String(form.formData.assignedTo || '')}
          onValueChange={(value) => form.handleChange('assignedTo', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select team member" />
          </SelectTrigger>
          <SelectContent>
            {members
              .filter(m => m.role !== 'Admin') // Can't assign to admins
              .map(member => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Deadline" error={errors.deadline} required>
        <Input
          type="date"
          value={String(form.formData.deadline || '')}
          onChange={(e) => form.handleChange('deadline', e.target.value)}
        />
      </FormField>

      <FormField label="Priority" error={errors.priority} required>
        <Select
          value={String(form.formData.priority || 'Medium')}
          onValueChange={(value) => form.handleChange('priority', value as TaskPriority)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
    </FormWrapper>
  );
}

// Main tasks page
export default function TasksRefactored() {
  const navigate = useNavigate();
  const role = storage.getCurrentRole();
  const members = storage.getMembers();
  const user = storage.getCurrentMember();
  
  // Use filtered tasks for data isolation
  const filteredTasks = useFilteredTasks();
  const [tasks, setTasks] = useState(filteredTasks);

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table state
  const table = useTable(tasks, { initialSort: { key: 'deadline', direction: 'asc' } });

  // Table columns
  const columns: ColumnDef<Task>[] = [
    {
      key: 'title' as keyof Task,
      label: 'Title',
      sortable: true,
      render: (val, row) => (
        <button
          onClick={() => navigate(`/focus/${row.id}`)}
          className="text-blue-600 hover:text-blue-800 font-medium truncate"
        >
          {String(val)}
        </button>
      ),
    },
    {
      key: 'assignedTo' as keyof Task,
      label: 'Assigned To',
      sortable: false,
      render: (val) => {
        const member = members.find(m => m.id === val);
        return <span>{member?.name || 'Unknown'}</span>;
      },
    },
    {
      key: 'deadline' as keyof Task,
      label: 'Deadline',
      sortable: true,
      render: (val) => format(new Date(String(val)), 'MMM d, yyyy'),
    },
    {
      key: 'priority' as keyof Task,
      label: 'Priority',
      sortable: true,
      render: (val) => (
        <Badge className={priorityColors[String(val) as TaskPriority]}>
          {String(val)}
        </Badge>
      ),
    },
    {
      key: 'status' as keyof Task,
      label: 'Status',
      sortable: true,
      render: (val) => (
        <Badge className={statusColors[String(val) as TaskStatus]}>
          {String(val)}
        </Badge>
      ),
    },
    {
      key: 'id' as keyof Task,
      label: 'Actions',
      sortable: false,
      render: (val, row) => (
        <div className="flex gap-2">
          {role === 'Admin' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingTask(row)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletingTaskId(String(val))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/focus/${val}`)}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  const handleCreateTask = async (data: Partial<Task>) => {
    setIsSubmitting(true);
    try {
      const newTask: Task = {
        id: generateId(),
        title: String(data.title),
        description: String(data.description || ''),
        assignedTo: String(data.assignedTo),
        deadline: String(data.deadline),
        priority: data.priority || 'Medium',
        status: 'Assigned',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setTasks(prev => [newTask, ...prev]);
      storage.setTasks(tasks);
      setShowCreateDialog(false);
      toast.success('Task created successfully');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (data: Partial<Task>) => {
    if (!editingTask) return;

    setIsSubmitting(true);
    try {
      const updated: Task = {
        ...editingTask,
        ...data,
        updatedAt: Date.now(),
      };

      setTasks(prev => prev.map(t => t.id === editingTask.id ? updated : t));
      storage.setTasks(tasks);
      setEditingTask(null);
      toast.success('Task updated successfully');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    storage.setTasks(tasks);
    setDeletingTaskId(null);
    toast.success('Task deleted');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Tasks"
        description="Manage and track your team's tasks"
        action={
          role === 'Admin'
            ? {
                label: 'New Task',
                onClick: () => {
                  setEditingTask(null);
                  setShowCreateDialog(true);
                },
                icon: <Plus className="h-4 w-4" />,
              }
            : undefined
        }
      />

      <Section title="All Tasks" card={false} className="space-y-4">
        {tasks.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-12 w-12" />}
            title="No tasks yet"
            description="All tasks have been completed or none have been assigned."
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={table.data}
              sortKey={table.sortKey}
              sortDirection={table.sortDirection}
              onSort={table.handleSort}
              searchQuery={table.searchQuery}
              onSearchChange={table.setSearchQuery}
            />
          </>
        )}
      </Section>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task and assign it to a team member
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowCreateDialog(false)}
            isSubmitting={isSubmitting}
            members={members}
            role={role}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update task details
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              task={editingTask}
              onSubmit={handleUpdateTask}
              onCancel={() => setEditingTask(null)}
              isSubmitting={isSubmitting}
              members={members}
              role={role}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingTaskId}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deletingTaskId && handleDeleteTask(deletingTaskId)}
        onCancel={() => setDeletingTaskId(null)}
      />
    </PageContainer>
  );
}
