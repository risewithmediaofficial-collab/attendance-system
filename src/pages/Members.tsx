import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  approvePendingAccount,
  rejectPendingAccount,
  storage,
  type Member,
  type PendingUser,
  type Role,
  type User,
  useApiBackend,
  generateId,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, User, Shield, BadgeCheck } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";

type RoleOption = Role;

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function roleBadgeClass(role: RoleOption) {
  switch (role) {
    case "Admin":
      return "bg-primary/15 text-primary border border-primary/30";
    case "Employee":
      return "bg-black/12 text-black/80 border border-black/22";
    case "Intern":
      return "bg-black/8 text-black/70 border border-black/18";
  }
}

export default function Members() {
  const role = storage.getCurrentRole();
  const membersStore = storage.getMembers();
  const usersStore = storage.getUsers();
  const pendingStore = storage.getPendingUsers();

  const [members, setMembers] = useState<Member[]>(membersStore);
  const [users, setUsers] = useState<User[]>(usersStore);
  const [pending, setPending] = useState<PendingUser[]>(pendingStore);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [memberRole, setMemberRole] = useState<RoleOption>("Intern");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    storage.setMembers(members);
  }, [members]);

  useEffect(() => {
    storage.setUsers(users);
  }, [users]);

  useEffect(() => {
    storage.setPendingUsers(pending);
  }, [pending]);

  useEffect(() => {
    // Keep in sync after external changes (very lightweight).
    setMembers(storage.getMembers());
    setUsers(storage.getUsers());
    setPending(storage.getPendingUsers());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditId(null);
    setName("");
    setMemberRole("Intern");
    setUsername("");
    setPassword("");
    setOpen(true);
  };

  const openEdit = (m: Member) => {
    const user = users.find((u) => u.memberId === m.id);
    setEditId(m.id);
    setName(m.name);
    setMemberRole((m.role ?? "Intern") as RoleOption);
    setUsername(user?.username ?? "");
    setPassword("");
    setOpen(true);
  };

  const validateUsername = (nextUsername: string, excludeMemberId?: string) => {
    const u = nextUsername.trim().toLowerCase();
    if (!u) return false;
    const taken = users.some((x) => x.username.toLowerCase() === u && x.memberId !== excludeMemberId);
    return !taken;
  };

  const save = () => {
    if (!name.trim()) return toast.error("Name is required.");
    if (!username.trim()) return toast.error("Username is required for login.");
    if (!password.trim() && !editId) return toast.error("Password is required for new accounts.");
    const nextUsername = username.trim().toLowerCase();

    if (!validateUsername(nextUsername, editId ?? undefined)) {
      return toast.error("Username is already taken.");
    }

    if (editId) {
      const nextMembers = members.map((m) =>
        m.id === editId
          ? { ...m, name: name.trim(), role: memberRole, avatarSeed: m.avatarSeed ?? name.trim() }
          : m,
      );
      setMembers(nextMembers);

      setUsers((prev) => {
        const existing = prev.find((u) => u.memberId === editId);
        if (existing) {
          return prev.map((u) =>
            u.id === existing.id
              ? { ...u, username: nextUsername, password: password.trim() ? password : u.password }
              : u,
          );
        }
        // Edge case: member exists but user missing.
        return [{ id: generateId(), memberId: editId, username: nextUsername, password: password.trim() || "password123" }, ...prev];
      });

      toast.success("Member updated");
      setOpen(false);
      return;
    }

    const memberId = generateId();
    const newMember: Member = { id: memberId, name: name.trim(), role: memberRole, avatarSeed: generateId() };
    setMembers((prev) => [newMember, ...prev]);

    const newUser: User = {
      id: generateId(),
      memberId: memberId,
      username: nextUsername,
      password: password.trim(),
    };
    setUsers((prev) => [newUser, ...prev]);
    toast.success("Member added");
    setOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteId) return;

    // Remove member and dependent records.
    const nextMembers = members.filter((m) => m.id !== deleteId);
    setMembers(nextMembers);
    setUsers((prev) => prev.filter((u) => u.memberId !== deleteId));

    // Clean dependent datasets to avoid "Unknown" references.
    const tasks = storage.getTasks().filter((t) => t.assignedTo !== deleteId);
    storage.setTasks(tasks);
    const attendance = storage.getAttendance().filter((a) => a.memberId !== deleteId);
    storage.setAttendance(attendance);
    const reports = storage.getReports().filter((r) => r.memberId !== deleteId);
    storage.setReports(reports);

    toast.success("Member deleted");
    setDeleteId(null);
  };

  const visibleMembers = useMemo(() => {
    // For cards, show newest first.
    return [...members].sort((a, b) => a.name.localeCompare(b.name)).reverse();
  }, [members]);

  const approvePending = async (req: PendingUser) => {
    if (useApiBackend) {
      try {
        await approvePendingAccount(req.id);
        setMembers(storage.getMembers());
        setUsers(storage.getUsers());
        setPending(storage.getPendingUsers());
        toast.success(`Approved ${req.name} as ${req.role}.`);
      } catch {
        toast.error("Could not approve request. Try again.");
      }
      return;
    }

    const memberId = generateId();
    const newMember: Member = { id: memberId, name: req.name, role: req.role, avatarSeed: generateId() };
    setMembers((prev) => [newMember, ...prev]);

    const newUser: User = {
      id: generateId(),
      memberId,
      username: req.username,
      password: req.password,
    };
    setUsers((prev) => [newUser, ...prev]);

    setPending((prev) => prev.filter((p) => p.id !== req.id));
    toast.success(`Approved ${req.name} as ${req.role}.`);
  };

  const rejectPending = async (id: string) => {
    const req = pending.find((p) => p.id === id);
    if (useApiBackend) {
      try {
        await rejectPendingAccount(id);
        setMembers(storage.getMembers());
        setUsers(storage.getUsers());
        setPending(storage.getPendingUsers());
        toast.success(req ? `Rejected request from ${req.name}.` : "Request rejected.");
      } catch {
        toast.error("Could not reject request.");
      }
      return;
    }

    setPending((prev) => prev.filter((p) => p.id !== id));
    toast.success(req ? `Rejected request from ${req.name}.` : "Request rejected.");
  };

  if (role !== "Admin") {
    return (
      <div className="space-y-6">
        <Card className="glass-card rounded-2xl border-white/20 shadow-2xl">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-lg">Members are Admin-only</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Your role does not have permission to manage members.</p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-xs text-muted-foreground">Ask an Admin to add or update your account.</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <Card className="glass-card border-white/20 shadow-2xl rounded-2xl">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-sm">Pending account requests</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Approve or reject new user registrations.
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{p.username} • requested <span className="capitalize">{p.role.toLowerCase()}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() => approvePending(p)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => rejectPending(p.id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Members</h2>
          <p className="text-sm text-muted-foreground mt-2">Manage employees and interns, assign roles, and handle logins.</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={openAdd}
            className="rounded-full shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <AnimatePresence>
          {visibleMembers.map((m) => {
            const r = m.role ?? "Intern";
            const initials = getInitials(m.name);
            const icon =
              r === "Admin" ? <Shield className="h-4 w-4" /> : r === "Employee" ? <BadgeCheck className="h-4 w-4" /> : <User className="h-4 w-4" />;
            return (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card rounded-2xl p-4 border-white/20 shadow-lg"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border",
                        r === "Admin" && "bg-primary/15 text-primary border-primary/30",
                        r === "Employee" && "bg-black/12 text-black/80 border-black/22",
                        r === "Intern" && "bg-black/8 text-black/70 border-black/18",
                      )}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-foreground truncate">{m.name}</p>
                        <Badge className={cn("px-3 py-1 rounded-full text-xs font-semibold border", roleBadgeClass(r))}>
                          {r}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {icon}
                        <span className="truncate">Login: {users.find((u) => u.memberId === m.id)?.username ?? "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl hover:bg-white/20 hover:text-primary transition-all"
                      onClick={() => openEdit(m)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl hover:bg-black/12 hover:text-black transition-all"
                      onClick={() => setDeleteId(m.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {members.length === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-20 text-center text-muted-foreground">
          No members yet
        </motion.div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Member" : "Add Member"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter member name" className="rounded-xl" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</Label>
                <Select value={memberRole} onValueChange={(v) => setMemberRole(v as RoleOption)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="Intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Username</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. intern" className="rounded-xl" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editId ? "(leave blank to keep current password)" : "Set a password"}
                className="rounded-xl"
                type="password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={save} className="rounded-xl">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Member"
        description="This will remove the member, their login account, and their related attendance, tasks, and reports."
      />
    </div>
  );
}

