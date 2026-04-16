/**
 * REFACTORED MEMBERS PAGE
 * Clean admin interface for team management
 */

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Shield, Users } from 'lucide-react';

import { 
  storage, 
  generateId, 
  type Member, 
  type User, 
  type Role,
  useApiBackend,
  approvePendingAccount,
  rejectPendingAccount,
} from '@/lib/storage';
import { useForm, useTable } from '@/hooks/use-composite';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Card } from '@/components/ui/card';

const roleColors = {
  'Admin': 'bg-purple-100 text-purple-800',
  'Employee': 'bg-blue-100 text-blue-800',
  'Intern': 'bg-gray-100 text-gray-800',
};

// Member form
function MemberForm({
  member,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  member?: Member & { user?: User };
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const form = useForm(
    {
      name: member?.name || '',
      role: (member?.role || 'Intern') as Role,
      username: member?.user?.username || '',
      password: '',
    },
    onSubmit
  );

  const errors = form.errors as Record<string, string>;

  return (
    <FormWrapper
      onSubmit={form.handleSubmit}
      submitLabel={member ? 'Update Member' : 'Add Member'}
      isSubmitting={isSubmitting}
      onCancel={onCancel}
      layout="inline"
    >
      <FormField label="Full Name" error={errors.name} required>
        <Input
          placeholder="Enter full name"
          value={form.formData.name}
          onChange={(e) => form.handleChange('name', e.target.value)}
        />
      </FormField>

      <FormField label="Username" error={errors.username} required>
        <Input
          placeholder="Enter username"
          value={form.formData.username}
          onChange={(e) => form.handleChange('username', e.target.value)}
        />
      </FormField>

      {!member && (
        <FormField label="Password" error={errors.password} required>
          <Input
            type="password"
            placeholder="Enter password"
            value={form.formData.password}
            onChange={(e) => form.handleChange('password', e.target.value)}
          />
        </FormField>
      )}

      <FormField label="Role" error={errors.role} required>
        <Select
          value={form.formData.role}
          onValueChange={(value) => form.handleChange('role', value as Role)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Employee">Employee</SelectItem>
            <SelectItem value="Intern">Intern</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
    </FormWrapper>
  );
}

// Main page
export default function MembersRefactored() {
  const role = storage.getCurrentRole();
  const members = storage.getMembers();
  const users = storage.getUsers();
  const pending = storage.getPendingUsers();

  // Only admins can view this page
  if (role !== 'Admin') {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-600">You don't have permission to manage members.</p>
        </div>
      </PageContainer>
    );
  }

  // State
  const [membersList, setMembersList] = useState(members);
  const [usersList, setUsersList] = useState(users);
  const [pendingList, setPendingList] = useState(pending);

  const [showDialog, setShowDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<(Member & { user?: User }) | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table state
  const table = useTable(membersList, {
    initialSort: { key: 'id', direction: 'asc' },
  });

  // Table columns
  const columns: ColumnDef<Member>[] = [
    {
      key: 'name' as keyof Member,
      label: 'Name',
      sortable: true,
    },
    {
      key: 'role' as keyof Member,
      label: 'Role',
      sortable: true,
      render: (val) => (
        <Badge className={roleColors[val as Role]}>
          <Shield className="h-3 w-3 mr-1" />
          {String(val)}
        </Badge>
      ),
    },
    {
      key: 'id' as keyof Member,
      label: 'Actions',
      sortable: false,
      render: (val, row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const user = usersList.find(u => u.memberId === String(val));
              setEditingMember({ ...row, user });
              setShowDialog(true);
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingMemberId(String(val))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleSaveMember = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (editingMember) {
        // Update existing member
        const updated = membersList.map(m =>
          m.id === editingMember.id
            ? { ...m, name: data.name, role: data.role }
            : m
        );
        setMembersList(updated);
        storage.setMembers(updated);

        // Update user
        const userUpdated = usersList.map(u =>
          u.memberId === editingMember.id
            ? { ...u, username: data.username }
            : u
        );
        setUsersList(userUpdated);
        storage.setUsers(userUpdated);

        toast.success('Member updated');
      } else {
        // Create new member
        const memberId = generateId();
        const newMember: Member = {
          id: memberId,
          name: data.name,
          role: data.role,
          avatarSeed: generateId(),
        };

        const newUser: User = {
          id: generateId(),
          memberId,
          username: data.username,
          password: data.password, // In real app, this would be hashed
        };

        setMembersList(prev => [newMember, ...prev]);
        setUsersList(prev => [newUser, ...prev]);
        storage.setMembers([newMember, ...membersList]);
        storage.setUsers([newUser, ...usersList]);

        toast.success('Member added');
      }

      setShowDialog(false);
      setEditingMember(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = (memberId: string) => {
    setMembersList(prev => prev.filter(m => m.id !== memberId));
    setUsersList(prev => prev.filter(u => u.memberId !== memberId));
    storage.setMembers(membersList);
    storage.setUsers(usersList);
    setDeletingMemberId(null);
    toast.success('Member removed');
  };

  const handleApprovePending = async (pendingId: string) => {
    try {
      if (useApiBackend) {
        await approvePendingAccount(pendingId);
      }
      
      const pending = pendingList.find(p => p.id === pendingId);
      if (pending) {
        // Add as member
        const newMember: Member = {
          id: generateId(),
          name: pending.name,
          role: pending.role as Role,
          avatarSeed: generateId(),
        };

        const newUser: User = {
          id: generateId(),
          memberId: newMember.id,
          username: pending.username,
          password: pending.password,
        };

        setMembersList(prev => [newMember, ...prev]);
        setUsersList(prev => [newUser, ...prev]);
        setPendingList(prev => prev.filter(p => p.id !== pendingId));

        storage.setMembers([newMember, ...membersList]);
        storage.setUsers([newUser, ...usersList]);
        storage.setPendingUsers(pendingList.filter(p => p.id !== pendingId));

        toast.success('Account approved');
      }
    } catch (error) {
      toast.error('Failed to approve account');
    }
  };

  const handleRejectPending = async (pendingId: string) => {
    try {
      if (useApiBackend) {
        await rejectPendingAccount(pendingId);
      }
      
      setPendingList(prev => prev.filter(p => p.id !== pendingId));
      storage.setPendingUsers(pendingList.filter(p => p.id !== pendingId));
      toast.success('Account rejected');
    } catch (error) {
      toast.error('Failed to reject account');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Team Members"
        description="Manage your team members and roles"
        action={{
          label: 'Add Member',
          onClick: () => {
            setEditingMember(null);
            setShowDialog(true);
          },
          icon: <Plus className="h-4 w-4" />,
        }}
      />

      {/* Pending approvals */}
      {pendingList.length > 0 && (
        <Section title="Pending Approvals" card className="mb-6">
          <div className="space-y-3">
            {pendingList.map(pend => (
              <Card key={pend.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{pend.name}</p>
                  <p className="text-xs text-gray-600">@{pend.username}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprovePending(pend.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectPending(pend.id)}
                  >
                    Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Members List */}
      <Section title="Current Members" card={false}>
        {membersList.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No members yet"
            description="Add your first team member to get started."
            action={{
              label: 'Add Member',
              onClick: () => setShowDialog(true),
            }}
          />
        ) : (
          <DataTable
            columns={columns}
            data={table.data}
            sortKey={table.sortKey}
            sortDirection={table.sortDirection}
            onSort={table.handleSort}
            searchQuery={table.searchQuery}
            onSearchChange={table.setSearchQuery}
          />
        )}
      </Section>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMember ? 'Edit Member' : 'Add Member'}
            </DialogTitle>
            <DialogDescription>
              {editingMember 
                ? 'Update member details' 
                : 'Add a new team member to your organization'}
            </DialogDescription>
          </DialogHeader>
          <MemberForm
            member={editingMember || undefined}
            onSubmit={handleSaveMember}
            onCancel={() => {
              setShowDialog(false);
              setEditingMember(null);
            }}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deletingMemberId}
        title="Delete Member"
        description="Are you sure you want to remove this member? They will lose access to all tasks and data."
        confirmText="Delete"
        onConfirm={() => deletingMemberId && handleDeleteMember(deletingMemberId)}
        onCancel={() => setDeletingMemberId(null)}
      />
    </PageContainer>
  );
}
