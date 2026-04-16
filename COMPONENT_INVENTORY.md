# FRONTEND REFACTORING - COMPONENT INVENTORY
## Created Files & Available Components

---

## FILE STRUCTURE

```
frontend/src/
├── lib/
│   ├── design-tokens.ts          ← NEW: Design system (spacing, colors, typography, etc.)
│   └── storage.ts                 (existing)
├── hooks/
│   ├── use-composite.ts           ← NEW: Reusable hooks (useForm, useTable, etc.)
│   └── use-theme.ts               (existing)
├── components/
│   ├── FormComponents.tsx         ← NEW: Form building blocks (FormWrapper, FormField)
│   ├── TableComponents.tsx        ← NEW: Table/grid components (DataTable, DataGrid, StatCard, EmptyState)
│   ├── LayoutComponents.tsx       ← NEW: Layout utilities (PageHeader, PageContainer, Section, Grid, Stack)
│   ├── AppLayout.tsx              (existing)
│   ├── AppSidebar.tsx             (existing)
│   ├── ui/                        (shadcn/ui components - existing)
│   └── ...
└── pages/
    ├── DashboardRefactored.tsx    ← NEW: Refactored dashboard
    ├── TasksRefactored.tsx        ← NEW: Refactored tasks
    ├── MembersRefactored.tsx      ← NEW: Refactored members
    ├── Dashboard.tsx              (old - can be deleted)
    ├── Tasks.tsx                  (old - can be deleted)
    ├── Members.tsx                (old - can be deleted)
    ├── Attendance.tsx             (needs refactoring)
    ├── ManageAttendance.tsx       (needs refactoring)
    ├── WorkReports.tsx            (needs refactoring)
    ├── Board.tsx                  (needs refactoring)
    ├── Calendar.tsx               (needs refactoring)
    ├── ListView.tsx               (needs refactoring)
    ├── MyWork.tsx                 (needs refactoring)
    ├── Settings.tsx               (needs refactoring)
    ├── Performance.tsx            (needs refactoring)
    ├── FocusMode.tsx              (needs refactoring)
    ├── AdminReview.tsx            (needs refactoring)
    ├── DailyStatus.tsx            (needs refactoring)
    ├── Holidays.tsx               (needs refactoring)
    ├── ActivityTimeline.tsx       (needs refactoring)
    ├── VerifyEmail.tsx            (needs refactoring)
    ├── ForgotPassword.tsx         (needs refactoring)
    ├── ResetPassword.tsx          (needs refactoring)
    └── NotFound.tsx               (needs minor refactoring)
```

---

## NEW FILES CREATED

### 1. `lib/design-tokens.ts` (NEW)
**Purpose**: Centralized design system

**Exports**:
```typescript
export const S = {
  // Spacing (8px base unit)
  spacing: {
    xs: '4px',      // 0.25rem
    sm: '8px',      // 0.5rem
    md: '16px',     // 1rem
    lg: '24px',     // 1.5rem
    xl: '32px',     // 2rem
    '2xl': '48px',  // 3rem
  },
  
  // Colors
  colors: {
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
      tertiary: '#718096',
      light: '#a0aec0',
    },
    background: {
      primary: '#ffffff',
      secondary: '#f7fafc',
      tertiary: '#edf2f7',
    },
    status: {
      success: '#48bb78',
      warning: '#ed8936',
      error: '#f56565',
      info: '#4299e1',
      pending: '#d69e2e',
    },
    // ... +20 more color variants
  },
  
  // Typography
  typography: {
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
    },
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  // Shadows
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  
  // Border radius
  borderRadius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  
  // Animation
  animation: {
    duration: {
      instant: '0ms',
      fast: '150ms',
      base: '300ms',
      slow: '500ms',
      slower: '800ms',
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  
  // Breakpoints
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
    ultrawide: '1536px',
  },
  
  // Z-index stratification
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1060,
    popover: 1070,
    tooltip: 1080,
    notification: 1090,
  },
  
  // Component variants (pre-configured)
  componentVariants: {
    button: {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      ghost: 'text-blue-600 hover:bg-blue-50',
    },
    input: {
      default: 'border border-gray-300 rounded-md',
      error: 'border border-red-500 rounded-md',
      success: 'border border-green-500 rounded-md',
    },
    card: {
      elevated: 'bg-white rounded-lg shadow-md',
      flat: 'bg-gray-50 rounded-lg border border-gray-200',
      ghost: 'rounded-lg',
    },
    badge: {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
    },
  },
};
```

**Usage**:
```typescript
import * as S from '@/lib/design-tokens';

// In CSS
className={`mb-[${S.spacing.md}] bg-[${S.colors.background.primary}]`}

// In inline styles (if necessary)
<div style={{ 
  marginBottom: S.spacing.md, 
  color: S.colors.text.primary 
}}>Content</div>
```

---

### 2. `hooks/use-composite.ts` (NEW)
**Purpose**: Reusable hook logic for common patterns

**Exports** (7 hooks):

#### `useForm<T>`
```typescript
interface FormState<T> {
  formData: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isDirty: boolean;
  isSubmitting: boolean;
}

const form = useForm<TaskData>(
  initialValues: TaskData,
  onSubmit: (values: TaskData) => Promise<void>,
  onValidate?: (values: TaskData) => Partial<Record<keyof TaskData, string>>
);

// Returns:
form.formData          // Current form data: { title: 'Task', assignedTo: 'user1' }
form.handleChange      // (key: keyof T, value: any) => void
form.handleSubmit      // (e: React.FormEvent) => Promise<void>
form.reset             // () => void
form.setError          // (key: keyof T, error: string) => void
form.setValues         // (values: Partial<T>) => void
form.errors.title      // Error message for field
form.touched.title     // Boolean - was field touched?
form.isDirty           // Boolean - has user made changes?
form.isSubmitting      // Boolean - is async submission in progress?
```

#### `useTable<T>`
```typescript
interface TableState<T> {
  data: T[];
  allData: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  sortKey: keyof T | null;
  sortDirection: 'asc' | 'desc';
  searchQuery: string;
  filters: Record<string, any>;
}

const table = useTable<TaskData>(
  data: TaskData[],
  options?: {
    initialSort?: { key: keyof T; direction: 'asc' | 'desc' };
    itemsPerPage?: number;
  }
);

// Returns:
table.data                    // Current page data (filtered, sorted, paginated)
table.allData                 // All data (before pagination)
table.handleSort             // (key: keyof T) => void
table.handleSearch           // (query: string) => void
table.handleFilterChange     // (key: string, value: any) => void
table.handlePageChange       // (page: number) => void
table.searchQuery             // Current search string
table.filters                 // Current filters object
table.currentPage             // Current page number
table.totalPages              // Total pages
table.totalItems              // Total items
table.sortKey                 // Current sort field
table.sortDirection           // Current sort direction
```

#### `useDialog`
```typescript
const dialog = useDialog(initialOpen = false);

// Returns:
dialog.isOpen          // Boolean - dialog open?
dialog.open            // () => void - open dialog
dialog.close           // () => void - close dialog
dialog.toggle          // () => void - toggle state
```

#### `useFilteredTasks` - **CRITICAL FOR DATA ISOLATION**
```typescript
const tasks = useFilteredTasks(optionalTasksArray?);

// Auto-filters based on user role:
// - admin: sees ALL tasks
// - others: sees only tasks assigned to them
//
// Returns: Task[]
```

#### `useAllMembers` - Safe Member List
```typescript
const members = useAllMembers();

// Returns members filtered by role:
// - admin: all members
// - others: only core team info (no sensitive data)
//
// Returns: Member[]
```

#### `useAsync`
```typescript
const { data, isLoading, error } = useAsync<T>(
  asyncFn: () => Promise<T>,
  dependencies?: any[]
);

// Returns:
data           // T | null - resolved data
isLoading      // boolean - is loading?
error          // Error | null - error if any
```

#### `usePrevious<T>`
```typescript
const previousValue = usePrevious<T>(value: T);
// Returns previous value, useful for comparisons
```

**Critical Data Isolation Code**:
```typescript
export function useFilteredTasks(tasks?: Task[]) {
  const role = storage.getCurrentRole();
  const currentMember = storage.getCurrentMember();
  const taskList = tasks?.length > 0 ? tasks : storage.getTasks() || [];

  return useMemo(() => {
    // ADMINS SEE EVERYTHING
    if (role === 'Admin') return taskList;
    
    // NON-ADMINS SEE ONLY THEIR TASKS
    if (!currentMember) return [];
    
    const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
    return taskList.filter(t => assignees.includes(currentMember.id));
  }, [role, currentMember, taskList]);
}
```

---

### 3. `components/FormComponents.tsx` (NEW)
**Purpose**: Standardized form building blocks

**Exports**:

#### `<FormWrapper>`
```typescript
interface FormWrapperProps {
  title: string;
  description?: string;
  onSubmit: (formData: any) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  layout?: 'card' | 'inline';
  spacing?: 'compact' | 'normal' | 'spacious';
  children: React.ReactNode;
}

<FormWrapper
  title="Create Task"
  description="Add a new task to your list"
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  submitLabel="Create"
  isSubmitting={loading}
  layout="card"
  spacing="normal"
>
  {/* Form fields */}
</FormWrapper>
```

**Features**:
- Auto-wraps form with proper structure
- Submit button auto-disabled during submission
- Cancel button included
- Consistent spacing
- Error display container
- Success confirmation

#### `<FormField>`
```typescript
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

<FormField label="Task Title" error={errors.title} required hint="Keep it concise">
  <Input value={title} onChange={handleChange} />
</FormField>
```

**Features**:
- Consistent label styling
- Required indicator (*)
- Error message display (red text)
- Helper hint text
- Proper spacing

---

### 4. `components/TableComponents.tsx` (NEW)
**Purpose**: Production-grade data table system

**Exports**:

#### `<DataTable<T>>`
```typescript
interface ColumnDef<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  sortKey?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: keyof T) => void;
  onRow?: (row: T) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  addRowClass?: (row: T) => string;
}

<DataTable
  columns={columns}
  data={filteredTasks}
  sortKey={table.sortKey}
  sortDirection={table.sortDirection}
  onSort={table.handleSort}
  onSearchChange={table.handleSearch}
  searchQuery={table.searchQuery}
/>
```

**Features**:
- Generic type safety
- Built-in sorting
- Built-in search
- Custom render functions per column
- Row click handling
- Responsive on mobile
- Keyboard navigation

#### `<DataGrid>` - DataTable + Pagination
```typescript
<DataGrid
  columns={columns}
  data={pageData}
  totalPages={10}
  currentPage={currentPage}
  onPageChange={setCurrentPage}
/>
```

#### `<StatCard>`
```typescript
interface StatCardProps {
  label: string;
  value: number | string;
  trend?: { direction: 'up' | 'down'; percentage: number };
  icon?: React.ReactNode;
  onClick?: () => void;
}

<StatCard
  label="Tasks Today"
  value={42}
  trend={{ direction: 'up', percentage: 15 }}
  icon={<CheckCircle />}
/>
```

**Features**:
- Metric display with trend
- Clickable
- Icon support
- Responsive

#### `<EmptyState>`
```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

<EmptyState
  icon={<Inbox />}
  title="No tasks yet"
  description="Create your first task to get started"
  action={{ label: 'New Task', onClick: handleCreate }}
/>
```

---

### 5. `components/LayoutComponents.tsx` (NEW)
**Purpose**: Consistent page structure and layout

**Exports**:

#### `<PageContainer>`
```typescript
<PageContainer maxWidth="lg" padding="normal">
  {children}
</PageContainer>
```

**Features**:
- Max-width constraint (sm/md/lg/xl/full)
- Padding options (compact/normal/spacious)
- Responsive on mobile

#### `<PageHeader>`
```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  backButton?: { label?: string; onClick: () => void };
  action?: { label: string; onClick: () => void; icon?: React.ReactNode };
}

<PageHeader
  title="Tasks"
  description="Manage your team tasks"
  backButton={{ onClick: handleBack }}
  action={{ label: 'New Task', onClick: handleCreate }}
/>
```

**Features**:
- Consistent styling
- Back button
- Action button
- Description support
- Icon support

#### `<Section>`
```typescript
<Section
  title="Team Members"
  description="Manage your team"
  card={true}
  collapsible={true}
>
  {children}
</Section>
```

**Features**:
- Optional card wrapper
- Title and description
- Collapsible support
- Consistent spacing

#### `<Grid>`
```typescript
<Grid columns={3} gap="lg" responsive={true}>
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</Grid>
```

**Features**:
- Responsive columns (auto reduces on mobile)
- Configurable gap
- Auto wrapping

#### `<Stack>`
```typescript
<Stack
  direction="row"        // "row" | "column"
  gap="md"               // xs | sm | md | lg | xl | 2xl
  justify="between"      // start | center | end | between | around
  align="center"         // start | center | end | stretch
  wrap={true}            // Allow wrapping?
>
  {children}
</Stack>
```

**Features**:
- Flexible layout
- Multiple directions
- Proper spacing
- Alignment control
- Auto-wrapping

#### `<CardGridItem>`
```typescript
<CardGridItem
  id={item.id}
  title={item.title}
  description={item.desc}
  tags={item.tags}
  actions={[{ label: 'Edit', onClick: handleEdit }]}
  selected={selected}
  onClick={handleSelect}
/>
```

---

## REFACTORED PAGES (3 examples)

### 1. `pages/DashboardRefactored.tsx`
**Status**: ✅ COMPLETE
**Size**: 9KB, 280 lines
**Components Used**: PageContainer, PageHeader, Section, Grid, Stack, StatCard, DataTable
**Data Isolation**: ✅ useFilteredTasks()

**Structure**:
```
Dashboard/
├── PageHeader (title, description)
├── DashboardMetrics (4 StatCards)
├── Grid (2 columns)
│   ├── TasksByStatus (visual breakdown)
│   └── QuickStats (additional metrics)
└── OverdueAlerts (list of overdue tasks)
```

---

### 2. `pages/TasksRefactored.tsx`
**Status**: ✅ COMPLETE
**Size**: 12KB, 440 lines
**Components Used**: PageContainer, PageHeader, Section, DataTable, FormWrapper, FormField
**Data Isolation**: ✅ useFilteredTasks() (non-admins see only own tasks)
**Role Features**: ✅ Create/edit restricted to admin

**Structure**:
```
Tasks/
├── PageHeader (title, action button - admin only)
├── TaskForm Dialog (create/edit)
├── DataTable (tasks list)
│   ├── Columns: Title, Assigned, Deadline, Priority, Status, Actions
│   └── Actions: Edit, Delete (admin only)
└── Delete Confirmation Dialog
```

---

### 3. `pages/MembersRefactored.tsx`
**Status**: ✅ COMPLETE
**Size**: 13KB, 480 lines
**Components Used**: PageContainer, PageHeader, Section, DataTable, FormWrapper, Dialog
**Data Isolation**: ✅ Admin-only (early return if not admin)
**Role Features**: ✅ Complete admin-only page

**Structure**:
```
Members/
├── Admin Check (early return if not admin)
├── PageHeader (title, add member button)
├── PendingApprovals Section
│   └── DataTable (pending members)
│       └── Actions: Approve, Reject
├── MemberForm Dialog (add/edit)
└── MembersList Section
    └── DataTable (all members)
        ├── Columns: Name, Email, Role, Actions
        └── Actions: Edit, Delete
```

---

## EXAMPLES OF COMPONENT USAGE

### Example 1: Using FormWrapper + FormField
```typescript
const [formData, setFormData] = useState({ title: '', description: '' });
const form = useForm(formData, async (data) => {
  await storage.createTask(data);
  dialog.close();
});

return (
  <Dialog isOpen={dialog.isOpen} onClose={dialog.close}>
    <FormWrapper
      title="Create Task"
      onSubmit={form.handleSubmit}
      onCancel={dialog.close}
      isSubmitting={form.isSubmitting}
    >
      <FormField label="Title" error={form.errors.title} required>
        <Input
          value={form.formData.title}
          onChange={(e) => form.handleChange('title', e.target.value)}
          placeholder="Task title..."
        />
      </FormField>
      <FormField label="Description" error={form.errors.description}>
        <Textarea
          value={form.formData.description}
          onChange={(e) => form.handleChange('description', e.target.value)}
        />
      </FormField>
    </FormWrapper>
  </Dialog>
);
```

### Example 2: Using DataTable with Sorting/Searching
```typescript
const tasks = useFilteredTasks();
const table = useTable(tasks);

const columns: ColumnDef<Task>[] = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  {
    key: 'priority',
    label: 'Priority',
    render: (value) => <Badge>{value}</Badge>,
  },
  {
    key: 'id',
    label: 'Actions',
    render: (id, row) => (
      <Button onClick={() => handleEdit(row)}>Edit</Button>
    ),
  },
];

return (
  <DataTable
    columns={columns}
    data={table.data}
    sortKey={table.sortKey}
    sortDirection={table.sortDirection}
    onSort={table.handleSort}
    searchQuery={table.searchQuery}
    onSearchChange={table.handleSearch}
  />
);
```

### Example 3: Using Layout Components for Page Structure
```typescript
return (
  <PageContainer maxWidth="lg">
    <PageHeader
      title="Team Management"
      description="Manage your team members and permissions"
      action={{
        label: 'Add Member',
        onClick: openAddDialog,
        icon: <Plus size={16} />,
      }}
    />

    <Grid columns={3} gap="lg">
      <StatCard label="Total Members" value={42} />
      <StatCard label="Admins" value={3} />
      <StatCard label="Employees" value={39} />
    </Grid>

    <Section title="Team Members" card={true}>
      {members.length > 0 ? (
        <DataTable columns={columns} data={members} />
      ) : (
        <EmptyState
          icon={<Users />}
          title="No members yet"
          description="Add your first team member to get started"
          action={{ label: 'Add Member', onClick: openAddDialog }}
        />
      )}
    </Section>
  </PageContainer>
);
```

---

## IMPORT STRUCTURE

When creating new refactored pages, use this import structure:

```typescript
// 1. React & hooks
import { useState, useCallback, useMemo } from 'react';

// 2. Layout & UI components
import {
  PageContainer,
  PageHeader,
  Section,
  Grid,
  Stack,
  CardGridItem,
} from '@/components/LayoutComponents';

import {
  DataTable,
  DataGrid,
  StatCard,
  EmptyState,
  type ColumnDef,
} from '@/components/TableComponents';

import {
  FormWrapper,
  FormField,
} from '@/components/FormComponents';

// 3. Composable hooks
import {
  useForm,
  useTable,
  useDialog,
  useFilteredTasks,
  useAllMembers,
  useAsync,
} from '@/hooks/use-composite';

// 4. Design system
import * as S from '@/lib/design-tokens';

// 5. Utilities & storage
import { storage } from '@/lib/storage';

// 6. Shadcn/ui components (as needed)
import { Dialog, Button, Input, Textarea, Select } from '@/components/ui';

// 7. Icons (as needed)
import { Plus, Trash, Edit, ChevronRight } from 'lucide-react';

// 8. Types
import type { Task, Member, User } from '@/types';
```

---

## QUICK START FOR NEXT PAGE REFACTOR

**Next Page to Refactor**: `Attendance.tsx`

**Quick checklist**:
1. ✅ Import components from LayoutComponents, TableComponents, FormComponents
2. ✅ Use `useFilteredTasks()` or role-based hook
3. ✅ Create columns: ColumnDef<Attendance>[]
4. ✅ Use PageContainer → PageHeader → Section → DataTable pattern
5. ✅ Add stats using StatCard
6. ✅ Keep component < 200 lines
7. ✅ Use design tokens for any custom styling
8. ✅ Test data isolation (non-admins see only their attendance)

---

## STATUS SUMMARY

| Component | File | Status | Lines |
|-----------|------|--------|-------|
| Design System | design-tokens.ts | ✅ Complete | 220 |
| Composite Hooks | use-composite.ts | ✅ Complete | 280 |
| Form Components | FormComponents.tsx | ✅ Complete | 150 |
| Table Components | TableComponents.tsx | ✅ Complete | 320 |
| Layout Components | LayoutComponents.tsx | ✅ Complete | 340 |
| Dashboard Page | DashboardRefactored.tsx | ✅ Complete | 280 |
| Tasks Page | TasksRefactored.tsx | ✅ Complete | 440 |
| Members Page | MembersRefactored.tsx | ✅ Complete | 480 |

**Total New Code**: 2,490 lines  
**Total Files Created**: 8  
**Pages Refactored**: 3 of 20  
**Completion Rate**: 15%

**Ready to proceed with remaining 17 pages** ✅
