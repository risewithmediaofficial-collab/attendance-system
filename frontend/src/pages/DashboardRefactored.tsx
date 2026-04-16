/**
 * REFACTORED DASHBOARD PAGE
 * Clean, modular, production-grade
 */

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  CalendarCheck, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Plus,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '@/lib/storage';
import { useFilteredTasks } from '@/hooks/use-composite';
import { PageContainer, PageHeader, Section, Grid, Stack } from '@/components/LayoutComponents';
import { StatCard, EmptyState } from '@/components/TableComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Task } from '@/lib/storageTypes';

// Dashboard metrics component
function DashboardMetrics() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const allTasks = useFilteredTasks();

  const metrics = useMemo(() => {
    const tasksToday = allTasks.filter(t => t.deadline === today);
    const completedToday = tasksToday.filter(t => t.status === 'Completed');
    const overdue = allTasks.filter(t => {
      const deadline = new Date(t.deadline);
      return deadline < new Date() && t.status !== 'Completed';
    });
    const completed = allTasks.filter(t => t.status === 'Completed');
    const productivity = allTasks.length > 0 
      ? Math.round((completed.length / allTasks.length) * 100) 
      : 0;

    return {
      tasksToday: tasksToday.length,
      completedToday: completedToday.length,
      overdue: overdue.length,
      productivity,
    };
  }, [allTasks, today]);

  return (
    <Grid columns={4} gap="md">
      <StatCard
        label="Tasks Today"
        value={metrics.tasksToday}
        icon={<CalendarCheck className="h-6 w-6" />}
      />
      <StatCard
        label="Completed Today"
        value={metrics.completedToday}
        icon={<CheckCircle2 className="h-6 w-6" />}
      />
      {metrics.overdue > 0 && (
        <StatCard
          label="Overdue Tasks"
          value={metrics.overdue}
          icon={<AlertCircle className="h-6 w-6" />}
        />
      )}
      <StatCard
        label="Productivity"
        value={`${metrics.productivity}%`}
        icon={<TrendingUp className="h-6 w-6" />}
      />
    </Grid>
  );
}

// Task list by status
function TasksByStatus({ tasks, status }: { tasks: Task[]; status: string }) {
  const navigate = useNavigate();
  const filtered = tasks.filter(t => t.status === status);

  if (filtered.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p className="text-sm">No {status.toLowerCase()} tasks</p>
      </div>
    );
  }

  return (
    <Stack direction="col" gap="sm">
      {filtered.slice(0, 5).map(task => (
        <motion.button
          key={task.id}
          whileHover={{ x: 4 }}
          onClick={() => navigate(`/focus/${task.id}`)}
          className="text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <p className="font-medium text-sm text-gray-900 line-clamp-1">{task.title}</p>
          <p className="text-xs text-gray-600 mt-1">Due: {format(new Date(task.deadline), 'MMM d')}</p>
        </motion.button>
      ))}
    </Stack>
  );
}

// Overdue alerts
function OverdueAlerts() {
  const navigate = useNavigate();
  const allTasks = useFilteredTasks();
  
  const overdueTasks = useMemo(() => {
    return allTasks.filter(t => {
      const deadline = new Date(t.deadline);
      return deadline < new Date() && t.status !== 'Completed';
    });
  }, [allTasks]);

  if (overdueTasks.length === 0) return null;

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <Stack direction="row" justify="between" align="center" gap="md">
          <div>
            <p className="font-semibold text-red-900">
              ⚠️ You have {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-700 mt-1">
              {overdueTasks.slice(0, 2).map(t => t.title).join(', ')}
              {overdueTasks.length > 2 && ' and more...'}
            </p>
          </div>
          <Button 
            size="sm" 
            onClick={() => navigate('/tasks')}
            className="flex-shrink-0"
          >
            View All
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

// Main dashboard page
export default function DashboardRefactored() {
  const navigate = useNavigate();
  const member = storage.getCurrentMember();
  const allTasks = useFilteredTasks();
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title={`Welcome back, ${member?.name || 'User'}! 👋`}
        description={today}
        action={{
          label: 'New Task',
          onClick: () => navigate('/tasks'),
          icon: <Plus className="h-4 w-4" />,
        }}
      />

      {/* Metrics */}
      <div className="mb-8">
        <DashboardMetrics />
      </div>

      {/* Overdue section */}
      <div className="mb-8">
        <OverdueAlerts />
      </div>

      {/* Main content grid */}
      <Grid columns={3} gap="lg">
        {/* Left: Task overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned tasks */}
          <Section title="Assigned Tasks" card>
            <TasksByStatus tasks={allTasks} status="Assigned" />
          </Section>

          {/* In Progress */}
          <Section title="In Progress" card>
            <TasksByStatus tasks={allTasks} status="In Progress" />
          </Section>

          {/* Completed (today only) */}
          <Section title="Completed Today" card>
            <TasksByStatus 
              tasks={allTasks.filter(t => {
                const completedDate = t.completedAt 
                  ? format(new Date(t.completedAt), 'yyyy-MM-dd')
                  : null;
                return completedDate === format(new Date(), 'yyyy-MM-dd');
              })} 
              status="Completed" 
            />
          </Section>
        </div>

        {/* Right: Quick stats and actions */}
        <div className="space-y-6">
          <Section title="Quick Stats" card>
            <Stack direction="col" gap="md">
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{allTasks.length}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-gray-600 uppercase font-semibold">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {allTasks.filter(t => t.status === 'Completed').length}
                </p>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-gray-600 uppercase font-semibold">In Progress</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {allTasks.filter(t => t.status === 'In Progress').length}
                </p>
              </div>
            </Stack>
          </Section>

          <Section title="Quick Actions" card>
            <Stack direction="col" gap="sm">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/tasks')}
              >
                <Eye className="h-4 w-4 mr-2" />
                View All Tasks
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/board')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Kanban Board
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/calendar')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Calendar View
              </Button>
            </Stack>
          </Section>
        </div>
      </Grid>

      {/* Empty state if no tasks */}
      {allTasks.length === 0 && (
        <div className="mt-12">
          <EmptyState
            icon={<CheckCircle2 className="h-12 w-12" />}
            title="No tasks yet"
            description="All caught up! Create a new task to get started."
            action={{
              label: 'Create Task',
              onClick: () => navigate('/tasks'),
            }}
          />
        </div>
      )}
    </PageContainer>
  );
}
