import { useState, useEffect } from "react";
import { storage, Member, generateId } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Members() {
  const [members, setMembers] = useState<Member[]>(storage.getMembers());
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { storage.setMembers(members); }, [members]);

  const openAdd = () => { setEditId(null); setName(""); setOpen(true); };
  const openEdit = (m: Member) => { setEditId(m.id); setName(m.name); setOpen(true); };

  const save = () => {
    if (!name.trim()) return;
    if (editId) {
      setMembers(prev => prev.map(m => m.id === editId ? { ...m, name: name.trim() } : m));
      toast.success("Member updated");
    } else {
      setMembers(prev => [...prev, { id: generateId(), name: name.trim() }]);
      toast.success("Member added");
    }
    setOpen(false);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setMembers(prev => prev.filter(m => m.id !== deleteId));
      toast.success("Member deleted");
      setDeleteId(null);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const colors = [
    "bg-primary/15 text-primary",
    "bg-success/15 text-success",
    "bg-warning/15 text-warning",
    "bg-info/15 text-info",
    "bg-destructive/15 text-destructive",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Members</h2>
          <p className="text-sm text-muted-foreground mt-1">{members.length} team member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openAdd} className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
          <Plus className="mr-1.5 h-4 w-4" />Add Member
        </Button>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <AnimatePresence>
          {members.map((m, i) => (
            <motion.div
              key={m.id}
              variants={item}
              layout
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card rounded-2xl p-5 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm ${colors[i % colors.length]}`}>
                    {getInitials(m.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{m.name}</p>
                    <p className="text-xs text-muted-foreground">Intern</p>
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(m)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive" onClick={() => setDeleteId(m.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {members.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
            <User className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No members yet. Add your first team member.</p>
          </div>
        )}
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Member</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter member name"
              className="h-11 rounded-xl"
              onKeyDown={e => e.key === "Enter" && save()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={save} className="rounded-xl">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={o => !o && setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Member"
        description="This will permanently remove this member. This cannot be undone."
      />
    </div>
  );
}
