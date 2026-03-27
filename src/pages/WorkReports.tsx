import { useState, useEffect, useMemo } from "react";
import { storage, WorkReport, generateId } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, FileText, Search } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function WorkReports() {
  const [reports, setReports] = useState<WorkReport[]>(storage.getWorkReports());
  const members = storage.getMembers();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [memberId, setMemberId] = useState("");
  const [assigned, setAssigned] = useState("");
  const [completed, setCompleted] = useState("");
  const [pending, setPending] = useState("");
  const [delivery, setDelivery] = useState<"Done" | "Not Done">("Not Done");

  const [filterDate, setFilterDate] = useState("");
  const [filterMember, setFilterMember] = useState("all");
  const [search, setSearch] = useState("");

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
    setDate(r.date); setMemberId(r.memberId);
    setAssigned(r.assigned); setCompleted(r.completed); setPending(r.pending);
    setDelivery(r.delivery);
    setOpen(true);
  };

  const save = () => {
    if (!memberId || !date) return;
    const entry: WorkReport = { id: editId || generateId(), date, memberId, assigned, completed, pending, delivery };
    if (editId) {
      setReports(prev => prev.map(r => r.id === editId ? entry : r));
      toast.success("Report updated");
    } else {
      setReports(prev => [...prev, entry]);
      toast.success("Report added");
    }
    setOpen(false);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setReports(prev => prev.filter(r => r.id !== deleteId));
      toast.success("Report deleted");
      setDeleteId(null);
    }
  };

  const filtered = useMemo(() => {
    let list = [...reports];
    if (filterDate) list = list.filter(r => r.date === filterDate);
    if (filterMember && filterMember !== "all") list = list.filter(r => r.memberId === filterMember);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(r => {
        const name = members.find(m => m.id === r.memberId)?.name || "";
        return name.toLowerCase().includes(s) || r.assigned.toLowerCase().includes(s) || r.completed.toLowerCase().includes(s);
      });
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [reports, filterDate, filterMember, search, members]);

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || "Unknown";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Work Reports</h2>
          <p className="text-sm text-muted-foreground mt-1">{reports.length} total reports</p>
        </div>
        <Button onClick={openAdd} disabled={members.length === 0} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="mr-1.5 h-4 w-4" />Add Report
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card rounded-2xl">
        <CardContent className="p-4 flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl bg-muted/50 border-0" />
          </div>
          <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-44 h-10 rounded-xl bg-muted/50 border-0" />
          <Select value={filterMember} onValueChange={setFilterMember}>
            <SelectTrigger className="w-44 h-10 rounded-xl bg-muted/50 border-0"><SelectValue placeholder="All Members" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {(filterDate || filterMember !== "all" || search) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterDate(""); setFilterMember("all"); setSearch(""); }} className="rounded-xl text-xs">
              Clear All
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Member</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Assigned</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Completed</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Pending</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Delivery</TableHead>
                  <TableHead className="w-24 text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No reports found</p>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((r, i) => (
                  <TableRow key={r.id} className={cn("hover:bg-muted/30 transition-colors", i % 2 === 0 && "bg-muted/10")}>
                    <TableCell className="text-sm">{r.date}</TableCell>
                    <TableCell className="font-medium text-sm">{getMemberName(r.memberId)}</TableCell>
                    <TableCell className="text-sm max-w-[180px] truncate" title={r.assigned}>{r.assigned}</TableCell>
                    <TableCell className="text-sm max-w-[180px] truncate" title={r.completed}>{r.completed}</TableCell>
                    <TableCell className="text-sm max-w-[180px] truncate" title={r.pending}>{r.pending}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border",
                        r.delivery === "Done"
                          ? "bg-success/15 text-success border-success/20"
                          : "bg-muted text-muted-foreground border-border"
                      )}>
                        {r.delivery}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive" onClick={() => setDeleteId(r.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Work Report</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Member</Label>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Select member" /></SelectTrigger>
                  <SelectContent>
                    {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assigned</Label>
              <Textarea value={assigned} onChange={e => setAssigned(e.target.value)} placeholder="Tasks assigned" rows={2} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Completed</Label>
              <Textarea value={completed} onChange={e => setCompleted(e.target.value)} placeholder="Tasks completed" rows={2} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending</Label>
              <Textarea value={pending} onChange={e => setPending(e.target.value)} placeholder="Tasks pending" rows={2} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Delivery</Label>
              <Select value={delivery} onValueChange={v => setDelivery(v as "Done" | "Not Done")}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Done">Done</SelectItem>
                  <SelectItem value="Not Done">Not Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
        title="Delete Report"
        description="This work report will be permanently removed."
      />
    </div>
  );
}
