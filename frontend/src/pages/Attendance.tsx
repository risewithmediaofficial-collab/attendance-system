import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  CalendarDays,
  CalendarCheck,
  Clock,
  Search,
  AlertTriangle,
  Pencil,
  Trash2,
  UserCheck,
  CheckCircle2,
  XCircle,
  History,
} from "lucide-react";
import { storage, type AttendanceRecord, type Member, calculateHours, getStatus, getDayName, isHoliday as isHolidayFn, getHolidayReason, submitAttendance, approveAttendance, rejectAttendance } from "@/lib/storage";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Calendar } from "@/components/ui/calendar";
import { ConfirmDialog } from "@/components/ConfirmDialog";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";

type AttendanceCell = {
  member: Member;
  status: "Full Day" | "Half Day" | "Short" | "Absent" | "Holiday";
  record?: AttendanceRecord;
};

function toIsoDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function dateIsPast(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00");
  return d.getTime() < today.getTime();
}

const statusClass: Record<AttendanceCell["status"], string> = {
  "Full Day": "badge-pill badge-full-day",
  "Half Day": "badge-pill badge-half-day",
  Short: "badge-pill badge-short",
  Absent: "badge-pill badge-absent",
  Holiday: "badge-pill badge-holiday",
};

function statusOrder(s: AttendanceCell["status"]) {
  switch (s) {
    case "Holiday":
      return 5;
    case "Full Day":
      return 4;
    case "Half Day":
      return 3;
    case "Short":
      return 2;
    case "Absent":
      return 1;
  }
}

export default function Attendance() {
  const role = storage.getCurrentRole();
  const me = storage.getCurrentMember();

  const members = storage.getMembers();
  const attendance = storage.getAttendance();
  const holidays = storage.getHolidays();

  // Filter out admin members from attendance tracking
  const nonAdminMembers = useMemo(() => members.filter((m) => m.role !== "Admin"), [members]);

  const [records, setRecords] = useState<AttendanceRecord[]>(attendance);

  useEffect(() => {
    storage.setAttendance(records);
  }, [records]);

  const today = toIsoDate(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [calendarMemberId, setCalendarMemberId] = useState<string>(() => me?.id ?? nonAdminMembers[0]?.id ?? "");

  const selectableMembers = role === "Admin" ? nonAdminMembers : me ? [me] : [];

  useEffect(() => {
    if (role !== "Admin" && me) setCalendarMemberId(me.id);
  }, [role, me]);

  const holidayOnSelected = isHolidayFn(selectedDate);

  const tableMembers = role === "Admin" ? selectableMembers : selectableMembers;

  const cellsForSelectedDate: AttendanceCell[] = useMemo(() => {
    const list: AttendanceCell[] = [];
    for (const m of tableMembers) {
      if (isHolidayFn(selectedDate)) {
        list.push({ member: m, status: "Holiday" });
        continue;
      }
      const record = records.find((r) => r.date === selectedDate && r.memberId === m.id);
      if (!record) {
        list.push({ member: m, status: "Absent" });
        continue;
      }
      list.push({ member: m, status: record.status, record });
    }
    return list.sort((a, b) => statusOrder(b.status) - statusOrder(a.status));
  }, [tableMembers, records, selectedDate]);

  // Calendar modifiers for the "member being visualized"
  const calendarMemberAttendanceStatus = useMemo(() => {
    const memberId = calendarMemberId;
    const map = new Map<string, AttendanceCell["status"]>();
    for (const d of getLast90Days(selectedDate)) {
      if (isHolidayFn(d)) {
        map.set(d, "Holiday");
        continue;
      }
      const rec = records.find((r) => r.memberId === memberId && r.date === d);
      if (!rec) map.set(d, "Absent");
      else map.set(d, rec.status);
    }
    return map;
  }, [calendarMemberId, records, selectedDate]);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [formMemberId, setFormMemberId] = useState<string>("");
  const [loginTime, setLoginTime] = useState("09:00");
  const [logoutTime, setLogoutTime] = useState("18:00");
  const [lunchStartTime, setLunchStartTime] = useState<string>("");
  const [lunchEndTime, setLunchEndTime] = useState<string>("");

  const initForm = (memberId: string, record?: AttendanceRecord) => {
    setEditId(record?.id ?? null);
    setFormMemberId(memberId);
    setLoginTime(record?.loginTime ?? "09:00");
    setLogoutTime(record?.logoutTime ?? "18:00");
    setLunchStartTime(record?.lunchStartTime ?? "");
    setLunchEndTime(record?.lunchEndTime ?? "");
  };

  const canAddOrEdit = useMemo(() => {
    if (holidayOnSelected) return false;
    if (!storage.canEditAttendanceDate(selectedDate)) return false;
    if (role === "Admin") return true;
    if (role === "Employee" || role === "Intern") {
      return me ? formMemberId === me.id : true;
    }
    return false;
  }, [holidayOnSelected, selectedDate, role, me, formMemberId]);

  const [search, setSearch] = useState("");

  const filteredCells = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cellsForSelectedDate;
    return cellsForSelectedDate.filter((c) => c.member.name.toLowerCase().includes(q));
  }, [cellsForSelectedDate, search]);

  const analytics = useMemo(() => {
    // Last 14 days present% trend.
    const last14: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last14.push(toIsoDate(d));
    }
    const memberIds = role === "Admin" ? selectableMembers.map((m) => m.id) : me ? [me.id] : [];
    const workDays = last14.filter((d) => !isHolidayFn(d));
    const trend = last14.map((d) => {
      if (isHolidayFn(d)) return { day: format(new Date(d), "EEE"), presentPct: 0 };
      const present = memberIds.filter((id) => 
        records.some((r) => r.memberId === id && r.date === d && r.approvalStatus !== "Rejected")
      ).length;
      const pct = memberIds.length > 0 ? (present / memberIds.length) * 100 : 0;
      return { day: format(new Date(d), "EEE"), presentPct: +pct.toFixed(1) };
    });
    // Status distribution
    const counts: Record<AttendanceCell["status"], number> = { "Full Day": 0, "Half Day": 0, Short: 0, Absent: 0, Holiday: 0 };
    for (const d of last14) {
      if (isHolidayFn(d)) continue;
      for (const id of memberIds) {
        const rec = records.find((r) => r.memberId === id && r.date === d && r.approvalStatus !== "Rejected");
        if (!rec) counts.Absent += 1;
        else counts[rec.status] += 1;
      }
    }
    const pieData = [
      { name: "Full Day", value: counts["Full Day"], color: "hsl(0, 0%, 18%)" },
      { name: "Half Day", value: counts["Half Day"], color: "hsl(0, 0%, 32%)" },
      { name: "Short", value: counts.Short, color: "hsl(0, 0%, 45%)" },
      { name: "Absent", value: counts.Absent, color: "hsl(0, 0%, 60%)" },
    ].filter((x) => x.value > 0);

    return { trend, workDaysCount: workDays.length, pieData };
  }, [records, role, selectableMembers, me]);

  const openAdd = () => {
    if (holidayOnSelected) return;
    if (role !== "Admin" && me) initForm(me.id);
    else initForm(formMemberId || selectableMembers[0]?.id || "");
    setEditId(null);
    setOpen(true);
  };

  const openEditRecord = (cell: AttendanceCell) => {
    if (!cell.record) return;
    if (role !== "Admin" && me && cell.member.id !== me.id) return;
    if (holidayOnSelected) return;
    if (!storage.canEditAttendanceDate(selectedDate)) return;
    initForm(cell.member.id, cell.record);
    setOpen(true);
  };

  const isDuplicate = (dateStr: string, memberId: string, excludeId?: string) => {
    return records.some((r) => r.date === dateStr && r.memberId === memberId && r.id !== excludeId);
  };

  const save = async () => {
    if (!formMemberId || !selectedDate) return;
    if (holidayOnSelected) return;
    if (!storage.canEditAttendanceDate(selectedDate) && role !== "Admin") return;
    if (!loginTime || !logoutTime) return;
    if (isDuplicate(selectedDate, formMemberId, editId ?? undefined)) {
      toast.error("Attendance already exists for this member on this date.");
      return;
    }

    try {
      await submitAttendance({
        date: selectedDate,
        loginTime,
        logoutTime,
        lunchStartTime: lunchStartTime || undefined,
        lunchEndTime: lunchEndTime || undefined,
      });
      toast.success(role === "Admin" ? "Attendance recorded" : "Attendance submitted for approval");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit attendance");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveAttendance(id);
      toast.success("Attendance approved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve");
    }
  };

  const handleReject = async (id: string) => {
    setRejectingId(id);
  };

  const confirmReject = async () => {
    if (!rejectingId) return;
    try {
      await rejectAttendance(rejectingId, rejectionReason);
      toast.error("Attendance rejected");
      setRejectingId(null);
      setRejectionReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject");
    }
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setRecords((prev) => prev.filter((r) => r.id !== deleteId));
    setDeleteId(null);
    toast.success("Attendance record deleted");
  };

  const summaryBadge = (() => {
    if (holidayOnSelected) return <Badge className={statusClass.Holiday}>Holiday</Badge>;
    const selfCell = role === "Admin" ? undefined : cellsForSelectedDate.find((c) => c.member.id === me?.id);
    const status = selfCell?.status ?? "Absent";
    return <Badge className={statusClass[status] as string}>{status}</Badge>;
  })();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="page-title mono-title">
            Attendance
          </h2>
          <p className="page-subtitle mt-1">
            {role === "Admin" ? "Calendar + attendance table for your team." : "Your attendance calendar and daily status."}
          </p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          {summaryBadge}
          <Button
            onClick={() => {
              if (role !== "Admin" && me) initForm(me.id);
              else initForm(selectableMembers[0]?.id || "");
              openAdd();
            }}
            disabled={holidayOnSelected || !storage.canEditAttendanceDate(selectedDate) || (role !== "Admin" && !me)}
          >
            <CalendarCheck className="mr-2 h-4 w-4" />
            {cellsForSelectedDate.some((c) => c.record) ? "Add / Update" : "Add Entry"}
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="calendar">
        <TabsList
          className="p-1 rounded-xl"
          style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(0,0,0,0.12)", backdropFilter: "blur(16px)" }}
        >
          <TabsTrigger value="calendar" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-black data-[state=active]:to-zinc-700 data-[state=active]:text-white data-[state=active]:shadow-md">Calendar</TabsTrigger>
          <TabsTrigger value="table" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-black data-[state=active]:to-zinc-700 data-[state=active]:text-white data-[state=active]:shadow-md">Table</TabsTrigger>
          {role === "Admin" && (
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-black data-[state=active]:to-zinc-700 data-[state=active]:text-white data-[state=active]:shadow-md">
              Pending Approvals
              {records.filter((r) => r.approvalStatus === "Pending").length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {records.filter((r) => r.approvalStatus === "Pending").length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <Card className="glass-card rounded-2xl border-white/20 shadow-2xl">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-lg">Attendance Calendar</CardTitle>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                {role === "Admin" && (
                  <Select value={calendarMemberId} onValueChange={setCalendarMemberId}>
                    <SelectTrigger className="w-64 rounded-full">
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {nonAdminMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} ({m.role ?? "Intern"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Badge className="bg-white/10 border-white/20 text-foreground px-3 py-1 rounded-full">
                  {role === "Admin" ? "Team view" : "Personal view"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Calendar
                    mode="single"
                    selected={selectedDate ? new Date(selectedDate + "T00:00:00") : undefined}
                    onSelect={(d) => {
                      if (!d) return;
                      setSelectedDate(toIsoDate(d));
                    }}
                    modifiers={{
                      holiday: (d) => calendarMemberAttendanceStatus.get(toIsoDate(d)) === "Holiday",
                      full: (d) => calendarMemberAttendanceStatus.get(toIsoDate(d)) === "Full Day",
                      half: (d) => calendarMemberAttendanceStatus.get(toIsoDate(d)) === "Half Day",
                      short: (d) => calendarMemberAttendanceStatus.get(toIsoDate(d)) === "Short",
                      absent: (d) => calendarMemberAttendanceStatus.get(toIsoDate(d)) === "Absent",
                    }}
                    modifiersClassNames={{
                      holiday: "bg-black/8 text-black/70 border border-black/18",
                      full: "bg-black/16 text-black/90 border border-black/24",
                      half: "bg-black/12 text-black/82 border border-black/22",
                      short: "bg-black/10 text-black/78 border border-black/20",
                      absent: "bg-black/6 text-black/62 border border-black/14",
                      // Keep selectable days clickable
                      day_today: "ring-2 ring-primary/40",
                    }}
                  />
                </div>

                <div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Legend</p>
                      <div className="flex flex-wrap gap-2">
                        {(["Full Day", "Half Day", "Short", "Absent", "Holiday"] as AttendanceCell["status"][]).map((s) => (
                          <Badge key={s} className={statusClass[s]}>{s}</Badge>
                        ))}
                      </div>
                    </div>

                    <Card className="glass-card border-white/20 shadow-xl rounded-2xl">
                      <CardContent className="p-4">
                        <p className="text-sm font-semibold">Selected: {selectedDate}</p>
                        <p className="text-xs text-muted-foreground mt-1">{getDayName(selectedDate)}</p>
                        {holidayOnSelected && (
                          <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-black/8 text-foreground rounded-xl text-sm">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            Holiday: {getHolidayReason(selectedDate) ?? "—"}
                          </div>
                        )}
                        {!holidayOnSelected && (
                          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl text-sm">
                            <Clock className="h-4 w-4 text-primary" />
                            {role === "Admin" ? "Pick a member to see their status in calendar." : "Use the Table tab to update your entry."}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by member..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-72 rounded-full border-0"
                />
              </div>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-44 rounded-full input-glass border-0 h-11" />
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              {role === "Admin" ? (
                <Badge className="bg-white/10 border-white/20 text-foreground px-3 py-1 rounded-full">Editing disabled on Holidays</Badge>
              ) : (
                <Badge className="bg-white/10 border-white/20 text-foreground px-3 py-1 rounded-full">Your personal attendance</Badge>
              )}
            </div>
          </motion.div>

          <Card className="glass-card rounded-2xl overflow-hidden border-white/20 shadow-2xl">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white/5 hover:bg-white/5 border-b border-white/10">
                    <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Member</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Approval</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Login/Logout</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Time Recorded</TableHead>
                    <TableHead className="w-32 text-right font-bold text-xs uppercase tracking-widest text-foreground/80">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCells.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                        No results
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredCells.map((cell) => {
                    const canEditThis =
                      role === "Admin"
                        ? storage.canEditAttendanceDate(selectedDate) && !isHolidayFn(selectedDate)
                        : storage.canEditAttendanceDate(selectedDate) && !isHolidayFn(selectedDate) && me && cell.member.id === me.id;

                    return (
                      <motion.tr
                        key={cell.member.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="border-b border-white/5 group"
                      >
                        <TableCell className="font-semibold">{cell.member.name}</TableCell>
                        <TableCell>
                          <Badge className={statusClass[cell.status]}>{cell.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {cell.record ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-full px-2 py-0 h-6 text-[10px] font-bold uppercase tracking-tighter transition-all",
                                cell.record.approvalStatus === "Approved" && "bg-black/14 text-black/85 border-black/22",
                                cell.record.approvalStatus === "Pending" && "bg-black/10 text-black/75 border-black/18 animate-pulse",
                                cell.record.approvalStatus === "Rejected" && "bg-black/8 text-black/65 border-black/16",
                                !cell.record.approvalStatus && "bg-black/14 text-black/85 border-black/22" // default approved
                              )}
                            >
                              {cell.record.approvalStatus ?? "Approved"}
                            </Badge>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {cell.record ? `${cell.record.loginTime} - ${cell.record.logoutTime} (${cell.record.hours}h)` : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground italic">
                          {cell.record?.submittedAt ? format(new Date(cell.record.submittedAt), "HH:mm:ss") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 items-center">
                            {role === "Admin" && cell.record && cell.record.approvalStatus === "Pending" && (
                              <div className="flex gap-1 mr-1 border-r pr-2 border-white/10">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full bg-black/12 text-black/80 hover:bg-black hover:text-white transition-all duration-200"
                                  onClick={() => handleApprove(cell.record!.id)}
                                  title="Approve"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full bg-black/10 text-black/70 hover:bg-black hover:text-white transition-all duration-200"
                                  onClick={() => handleReject(cell.record!.id)}
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {canEditThis && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg hover:bg-white/20 hover:text-primary transition-all"
                                  onClick={() => openEditRecord(cell)}
                                  disabled={!cell.record}
                                  title={cell.record ? "Edit" : "Add (use top button)"}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {cell.record && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg hover:bg-black/12 hover:text-black transition-all"
                                    onClick={() => setDeleteId(cell.record!.id)}
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card rounded-2xl border-white/20 shadow-2xl">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-lg">Attendance Analytics</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Present rate over the last 14 days.</p>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.trend}>
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          background: "rgba(255, 255, 255, 0.1)",
                          backdropFilter: "blur(10px)",
                          fontSize: 12,
                          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value: unknown) => `${value}%`}
                      />
                      <Bar dataKey="presentPct" fill="url(#attBarGrad)" radius={[8, 8, 0, 0]} animationDuration={700} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card rounded-2xl border-white/20 shadow-2xl">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-lg">Status Distribution</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Full/Half/Short/Absent breakdown.</p>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-72 flex items-center justify-center">
                  {analytics.pieData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analytics.pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" strokeWidth={0} animationDuration={700}>
                          {analytics.pieData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {role === "Admin" && (
          <TabsContent value="pending" className="space-y-6">
            <Card className="glass-card rounded-2xl overflow-hidden border-white/20 shadow-2xl">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-lg">Pending Attendance Approvals</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Requests awaiting your approval</p>
              </CardHeader>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white/5 hover:bg-white/5 border-b border-white/10">
                      <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Member</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Date</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Time</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Hours</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Status</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Submitted</TableHead>
                      <TableHead className="w-32 text-right font-bold text-xs uppercase tracking-widest text-foreground/80">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.filter((r) => r.approvalStatus === "Pending").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                          No pending approvals
                        </TableCell>
                      </TableRow>
                    ) : (
                      records
                        .filter((r) => r.approvalStatus === "Pending")
                        .map((record) => {
                          const member = nonAdminMembers.find((m) => m.id === record.memberId);
                          return (
                            <motion.tr
                              key={record.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="border-b border-white/5 group"
                            >
                              <TableCell className="font-semibold">{member?.name ?? "Unknown"}</TableCell>
                              <TableCell className="text-sm">{record.date}</TableCell>
                              <TableCell className="text-sm whitespace-nowrap">
                                {record.loginTime} - {record.logoutTime}
                                {record.lunchStartTime && record.lunchEndTime && (
                                  <div className="text-xs text-muted-foreground">
                                    Lunch: {record.lunchStartTime} - {record.lunchEndTime}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-sm font-semibold">{record.hours}h</TableCell>
                              <TableCell>
                                <Badge className={statusClass[record.status]}>{record.status}</Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {record.submittedAt ? format(new Date(record.submittedAt), "MMM dd, HH:mm") : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1 items-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full bg-black/12 text-black/80 hover:bg-black hover:text-white transition-all duration-200"
                                    onClick={() => handleApprove(record.id)}
                                    title="Approve"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full bg-black/10 text-black/70 hover:bg-black hover:text-white transition-all duration-200"
                                    onClick={() => handleReject(record.id)}
                                    title="Reject"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Add/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Attendance" : "Add Attendance"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</Label>
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Day</Label>
                <Input value={getDayName(selectedDate)} readOnly className="h-10 rounded-xl bg-muted/50" />
              </div>
            </div>

            {holidayOnSelected && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-black/8 text-foreground rounded-xl text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Attendance is disabled on holidays
              </div>
            )}

            {role === "Admin" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Member</Label>
                <Select value={formMemberId} onValueChange={setFormMemberId}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {nonAdminMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.role ?? "Intern"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Login Time</Label>
                <Input type="time" value={loginTime} onChange={(e) => setLoginTime(e.target.value)} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Logout Time</Label>
                <Input type="time" value={logoutTime} onChange={(e) => setLogoutTime(e.target.value)} className="h-10 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lunch Break (Optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lunch Start</Label>
                  <Input type="time" value={lunchStartTime} onChange={(e) => setLunchStartTime(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lunch End</Label>
                  <Input type="time" value={lunchEndTime} onChange={(e) => setLunchEndTime(e.target.value)} className="h-10 rounded-xl" />
                </div>
              </div>
            </div>

            {loginTime && logoutTime && !holidayOnSelected && (
              <div className="flex gap-4 px-3 py-2.5 bg-muted/50 rounded-xl text-sm">
                <span>
                  Hours: <strong>{calculateHours(loginTime, logoutTime, lunchStartTime, lunchEndTime)}</strong>
                </span>
                <span>
                  Status: <strong>{getStatus(calculateHours(loginTime, logoutTime, lunchStartTime, lunchEndTime))}</strong>
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={!canAddOrEdit}
              className="rounded-xl"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection dialog */}
      <Dialog open={!!rejectingId} onOpenChange={(o) => !o && (setRejectingId(null), setRejectionReason(""))}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reject Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Reason for Rejection</Label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full h-20 p-2 rounded-xl border border-input bg-background"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => (setRejectingId(null), setRejectionReason(""))} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={confirmReject} className="rounded-xl bg-red-500 hover:bg-red-600">
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Attendance"
        description="This attendance record will be permanently removed."
      />
    </div>
  );
}

function getLast90Days(fromDateIso: string) {
  // Calendar modifiers need stable dates; generate a small window around the currently selected date.
  const center = new Date(fromDateIso + "T00:00:00");
  const out: string[] = [];
  // 45 days around selected date to keep DayPicker modifiers predictable.
  for (let i = -45; i <= 45; i++) {
    const d = new Date(center);
    d.setDate(d.getDate() + i);
    out.push(toIsoDate(d));
  }
  return out;
}

