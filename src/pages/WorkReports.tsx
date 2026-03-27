import { useState, useEffect, useMemo } from "react";
import { storage, WorkReport, generateId } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function WorkReports() {
  const [reports, setReports] = useState<WorkReport[]>(storage.getWorkReports());
  const members = storage.getMembers();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [memberId, setMemberId] = useState("");
  const [assigned, setAssigned] = useState("");
  const [completed, setCompleted] = useState("");
  const [pending, setPending] = useState("");
  const [delivery, setDelivery] = useState<"Done" | "Not Done">("Not Done");

  const [filterDate, setFilterDate] = useState("");
  const [filterMember, setFilterMember] = useState("all");

  useEffect(() => { storage.setWorkReports(reports); }, [reports]);

  const openAdd = () => {
    setEditId(null);
    setDate(format(new Date(), "yyyy-MM-dd"));
    setMemberId(members[0]?.id || "");
    setAssigned(""); setCompleted(""); setPending("");
    setDelivery("Not Done");
    setOpen(true);
  };

  const openEdit = (r: WorkReport) => {
    setEditId(r.id);
    setDate(r.date);
    setMemberId(r.memberId);
    setAssigned(r.assigned);
    setCompleted(r.completed);
    setPending(r.pending);
    setDelivery(r.delivery);
    setOpen(true);
  };

  const save = () => {
    if (!memberId || !date) return;
    const entry: WorkReport = { id: editId || generateId(), date, memberId, assigned, completed, pending, delivery };
    if (editId) {
      setReports(prev => prev.map(r => r.id === editId ? entry : r));
    } else {
      setReports(prev => [...prev, entry]);
    }
    setOpen(false);
  };

  const remove = (id: string) => setReports(prev => prev.filter(r => r.id !== id));

  const filtered = useMemo(() => {
    let list = [...reports];
    if (filterDate) list = list.filter(r => r.date === filterDate);
    if (filterMember && filterMember !== "all") list = list.filter(r => r.memberId === filterMember);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [reports, filterDate, filterMember]);

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || "Unknown";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Work Reports</h2>
        <Button onClick={openAdd} size="sm" disabled={members.length === 0}>
          <Plus className="mr-1 h-4 w-4" />Add Report
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-44" />
        <Select value={filterMember} onValueChange={setFilterMember}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Members" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterDate || filterMember !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterDate(""); setFilterMember("all"); }}>Clear</Button>
        )}
      </div>

      <div className="rounded-md border bg-card overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No reports</TableCell></TableRow>
            )}
            {filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.date}</TableCell>
                <TableCell className="font-medium">{getMemberName(r.memberId)}</TableCell>
                <TableCell className="max-w-[200px] truncate">{r.assigned}</TableCell>
                <TableCell className="max-w-[200px] truncate">{r.completed}</TableCell>
                <TableCell className="max-w-[200px] truncate">{r.pending}</TableCell>
                <TableCell>
                  <Badge variant={r.delivery === "Done" ? "default" : "secondary"}>{r.delivery}</Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Work Report</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Member</Label>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                  <SelectContent>
                    {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Assigned</Label>
              <Textarea value={assigned} onChange={e => setAssigned(e.target.value)} placeholder="Tasks assigned" rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Completed</Label>
              <Textarea value={completed} onChange={e => setCompleted(e.target.value)} placeholder="Tasks completed" rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Pending</Label>
              <Textarea value={pending} onChange={e => setPending(e.target.value)} placeholder="Tasks pending" rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Delivery</Label>
              <Select value={delivery} onValueChange={v => setDelivery(v as "Done" | "Not Done")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Done">Done</SelectItem>
                  <SelectItem value="Not Done">Not Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
