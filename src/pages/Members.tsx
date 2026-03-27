import { useState, useEffect } from "react";
import { storage, Member, generateId } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function Members() {
  const [members, setMembers] = useState<Member[]>(storage.getMembers());
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => { storage.setMembers(members); }, [members]);

  const openAdd = () => { setEditId(null); setName(""); setOpen(true); };
  const openEdit = (m: Member) => { setEditId(m.id); setName(m.name); setOpen(true); };

  const save = () => {
    if (!name.trim()) return;
    if (editId) {
      setMembers(prev => prev.map(m => m.id === editId ? { ...m, name: name.trim() } : m));
    } else {
      setMembers(prev => [...prev, { id: generateId(), name: name.trim() }]);
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Members</h2>
        <Button onClick={openAdd} size="sm"><Plus className="mr-1 h-4 w-4" />Add Member</Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No members yet</TableCell></TableRow>
            )}
            {members.map((m, i) => (
              <TableRow key={m.id}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Member</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Member name" onKeyDown={e => e.key === "Enter" && save()} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
