import { useState, useEffect, useMemo } from "react";
import { storage, AttendanceRecord, generateId, calculateHours, getStatus, getDayName, isHoliday, getHolidayReason } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Pencil, CalendarCheck, Search, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Attendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>(storage.getAttendance());
  const members = storage.getMembers();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [memberId, setMemberId] = useState("");
  const [loginTime, setLoginTime] = useState("09:00");
  const [logoutTime, setLogoutTime] = useState("18:00");

  const [filterDate, setFilterDate] = useState("");
  const [filterMember, setFilterMember] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => { storage.setAttendance(records); }, [records]);

  const holidayOnDate = isHoliday(date);

  const isDuplicate = (d: string, mId: string, excludeId?: string) =>
    records.some(r => r.date === d && r.memberId === mId && r.id !== excludeId);

  const openAdd = () => {
    setEditId(null);
    setDate(format(new Date(), "yyyy-MM-dd"));
    setMemberId(members[0]?.id || "");
    setLoginTime("09:00");
    setLogoutTime("18:00");
    setOpen(true);
  };

  const openEdit = (r: AttendanceRecord) => {
    setEditId(r.id);
    setDate(r.date);
    setMemberId(r.memberId);
    setLoginTime(r.loginTime);
    setLogoutTime(r.logoutTime);
    setOpen(true);
  };

  const save = () => {
    if (!memberId || !date || !loginTime || !logoutTime) return;
    if (isHoliday(date)) return;
    if (isDuplicate(date, memberId, editId || undefined)) return;

    const hours = calculateHours(loginTime, logoutTime);
    const status = getStatus(hours);

    if (editId) {
      setRecords(prev => prev.map(r => r.id === editId ? { ...r, date, memberId, loginTime, logoutTime, hours, status } : r));
      toast.success("Attendance updated");
    } else {
      setRecords(prev => [...prev, { id: generateId(), date, memberId, loginTime, logoutTime, hours, status }]);
      toast.success("Attendance recorded");
    }
    setOpen(false);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setRecords(prev => prev.filter(r => r.id !== deleteId));
      toast.success("Record deleted");
      setDeleteId(null);
    }
  };

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterDate) list = list.filter(r => r.date === filterDate);
    if (filterMember && filterMember !== "all") list = list.filter(r => r.memberId === filterMember);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(r => {
        const name = members.find(m => m.id === r.memberId)?.name || "";
        return name.toLowerCase().includes(s);
      });
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [records, filterDate, filterMember, search, members]);

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || "Unknown";

  const statusConfig: Record<string, { className: string }> = {
    "Full Day": { className: "bg-success/15 text-success border-success/20" },
    "Half Day": { className: "bg-warning/15 text-warning border-warning/20" },
    "Short": { className: "bg-destructive/15 text-destructive border-destructive/20" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Attendance</h2>
          <p className="text-sm text-muted-foreground mt-1">{records.length} total entries</p>
        </div>
        <Button onClick={openAdd} disabled={members.length === 0} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="mr-1.5 h-4 w-4" />Add Entry
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card rounded-2xl">
        <CardContent className="p-4 flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/50 border-0"
            />
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
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Day</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Member</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Login</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Logout</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Hours</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="w-24 text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16">
                      <CalendarCheck className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No attendance records found</p>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((r, i) => (
                  <TableRow key={r.id} className={cn("hover:bg-muted/30 transition-colors", i % 2 === 0 && "bg-muted/10")}>
                    <TableCell className="text-sm">{r.date}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{getDayName(r.date)}</TableCell>
                    <TableCell className="font-medium text-sm">{getMemberName(r.memberId)}</TableCell>
                    <TableCell className="text-sm font-mono">{r.loginTime}</TableCell>
                    <TableCell className="text-sm font-mono">{r.logoutTime}</TableCell>
                    <TableCell className="text-sm font-semibold">{r.hours}h</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border", statusConfig[r.status]?.className)}>
                        {r.status}
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
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Attendance</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Day</Label>
                <Input value={date ? getDayName(date) : ""} readOnly className="h-10 rounded-xl bg-muted/50" />
              </div>
            </div>

            {holidayOnDate && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-warning/10 text-warning rounded-xl text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Holiday: {getHolidayReason(date)}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Member</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {isDuplicate(date, memberId, editId || undefined) && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 text-destructive rounded-xl text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Entry already exists for this member on this date
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Login Time</Label>
                <Input type="time" value={loginTime} onChange={e => setLoginTime(e.target.value)} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Logout Time</Label>
                <Input type="time" value={logoutTime} onChange={e => setLogoutTime(e.target.value)} className="h-10 rounded-xl" />
              </div>
            </div>

            {loginTime && logoutTime && (
              <div className="flex gap-4 px-3 py-2.5 bg-muted/50 rounded-xl text-sm">
                <span>Hours: <strong>{calculateHours(loginTime, logoutTime)}</strong></span>
                <span>Status: <strong>{getStatus(calculateHours(loginTime, logoutTime))}</strong></span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={save} disabled={holidayOnDate || isDuplicate(date, memberId, editId || undefined)} className="rounded-xl">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={o => !o && setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Record"
        description="This attendance record will be permanently removed."
      />
    </div>
  );
}
