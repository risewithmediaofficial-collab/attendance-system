import { useState, useEffect, useMemo } from "react";
import { storage, AttendanceRecord, generateId, calculateHours, getStatus, getDayName, isHoliday, getHolidayReason } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";

export default function Attendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>(storage.getAttendance());
  const members = storage.getMembers();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [memberId, setMemberId] = useState("");
  const [loginTime, setLoginTime] = useState("09:00");
  const [logoutTime, setLogoutTime] = useState("18:00");

  const [filterDate, setFilterDate] = useState("");
  const [filterMember, setFilterMember] = useState("all");

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
    } else {
      setRecords(prev => [...prev, { id: generateId(), date, memberId, loginTime, logoutTime, hours, status }]);
    }
    setOpen(false);
  };

  const remove = (id: string) => setRecords(prev => prev.filter(r => r.id !== id));

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterDate) list = list.filter(r => r.date === filterDate);
    if (filterMember && filterMember !== "all") list = list.filter(r => r.memberId === filterMember);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [records, filterDate, filterMember]);

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || "Unknown";

  const statusColor = (s: string) => {
    if (s === "Full Day") return "default";
    if (s === "Half Day") return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Attendance</h2>
        <Button onClick={openAdd} size="sm" disabled={members.length === 0}>
          <Plus className="mr-1 h-4 w-4" />Add Entry
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
              <TableHead>Day</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Login</TableHead>
              <TableHead>Logout</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No records</TableCell></TableRow>
            )}
            {filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.date}</TableCell>
                <TableCell>{getDayName(r.date)}</TableCell>
                <TableCell className="font-medium">{getMemberName(r.memberId)}</TableCell>
                <TableCell>{r.loginTime}</TableCell>
                <TableCell>{r.logoutTime}</TableCell>
                <TableCell>{r.hours}</TableCell>
                <TableCell><Badge variant={statusColor(r.status) as any}>{r.status}</Badge></TableCell>
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
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Attendance</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Day</Label>
                <Input value={date ? getDayName(date) : ""} readOnly className="bg-muted" />
              </div>
            </div>

            {holidayOnDate && (
              <p className="text-sm text-destructive font-medium">⚠ This date is a holiday: {getHolidayReason(date)}</p>
            )}

            <div className="space-y-1">
              <Label>Member</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {isDuplicate(date, memberId, editId || undefined) && (
              <p className="text-sm text-destructive">Entry already exists for this member on this date.</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Login Time</Label>
                <Input type="time" value={loginTime} onChange={e => setLoginTime(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Logout Time</Label>
                <Input type="time" value={logoutTime} onChange={e => setLogoutTime(e.target.value)} />
              </div>
            </div>

            {loginTime && logoutTime && (
              <div className="flex gap-4 text-sm">
                <span>Hours: <strong>{calculateHours(loginTime, logoutTime)}</strong></span>
                <span>Status: <strong>{getStatus(calculateHours(loginTime, logoutTime))}</strong></span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={holidayOnDate || isDuplicate(date, memberId, editId || undefined)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
