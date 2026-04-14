import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import { CalendarCheck, Clock, Plus, Search, Users } from "lucide-react";
import {
  storage,
  calculateHours,
  createAdminAttendance,
  deleteAdminAttendance,
  getStatus,
  getHolidayReason,
  isHoliday,
  type AttendanceRecord,
  type Member,
  updateAdminAttendance,
} from "@/lib/storage";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StatusOption = "auto" | AttendanceRecord["status"];

type AttendanceFormState = {
  memberId: string;
  date: string;
  loginTime: string;
  logoutTime: string;
  lunchStartTime: string;
  lunchEndTime: string;
  status: StatusOption;
};

const EMPTY_FILTER = "all";

const statusClass: Record<AttendanceRecord["status"], string> = {
  "Full Day": "badge-pill badge-full-day",
  "Half Day": "badge-pill badge-half-day",
  Short: "badge-pill badge-short",
};

const calendarStatusClass = {
  full: "bg-black/16 text-black/90 border border-black/24",
  half: "bg-black/12 text-black/82 border border-black/22",
  short: "bg-black/10 text-black/78 border border-black/20",
  absent: "bg-black/6 text-black/62 border border-black/14",
  holiday: "bg-black/8 text-black/70 border border-black/18",
} as const;

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDate(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function computedStatusFromForm(form: AttendanceFormState): AttendanceRecord["status"] {
  if (!isTime(form.loginTime) || !isTime(form.logoutTime)) return "Short";
  return getStatus(calculateHours(form.loginTime, form.logoutTime, form.lunchStartTime || undefined, form.lunchEndTime || undefined));
}

function displayStatus(record: AttendanceRecord["status"]) {
  return <Badge className={statusClass[record]}>{record}</Badge>;
}

function getAttendanceCycle(baseDate = new Date()) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const day = baseDate.getDate();

  if (day >= 16) {
    return {
      start: format(new Date(year, month, 16), "yyyy-MM-dd"),
      end: format(new Date(year, month + 1, 15), "yyyy-MM-dd"),
    };
  }

  return {
    start: format(new Date(year, month - 1, 16), "yyyy-MM-dd"),
    end: format(new Date(year, month, 15), "yyyy-MM-dd"),
  };
}

function buildDateRange(startIso: string, endIso: string) {
  const dates: string[] = [];
  const cursor = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);

  while (cursor <= end) {
    dates.push(toIsoDate(new Date(cursor)));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export default function ManageAttendance() {
  const role = storage.getCurrentRole();
  if (role !== "Admin") {
    return <Navigate to="/attendance" replace />;
  }

  const defaultCycle = getAttendanceCycle();

  const members = storage
    .getMembers()
    .filter((member) => member.role !== "Admin")
    .sort((a, b) => a.name.localeCompare(b.name));

  const memberMap = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const [records, setRecords] = useState<AttendanceRecord[]>(
    () =>
      storage
        .getAttendance()
        .filter((record) => {
          const member = memberMap.get(record.memberId);
          return !!member && member.role !== "Admin";
        }),
  );
  const [search, setSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState(EMPTY_FILTER);
  const [startDate, setStartDate] = useState(defaultCycle.start);
  const [endDate, setEndDate] = useState(defaultCycle.end);
  const [quickMemberId, setQuickMemberId] = useState(members[0]?.id ?? "");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(todayIsoDate());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AttendanceFormState>(() => ({
    memberId: members[0]?.id ?? "",
    date: todayIsoDate(),
    loginTime: "09:00",
    logoutTime: "18:00",
    lunchStartTime: "",
    lunchEndTime: "",
    status: "auto",
  }));

  const refreshRecords = () => {
    setRecords(
      storage.getAttendance().filter((record) => {
        const member = memberMap.get(record.memberId);
        return !!member && member.role !== "Admin";
      }),
    );
  };

  useEffect(() => {
    if (!members.length) {
      if (quickMemberId) setQuickMemberId("");
      return;
    }

    if (!quickMemberId || !memberMap.has(quickMemberId)) {
      setQuickMemberId(members[0].id);
    }
  }, [memberMap, members, quickMemberId]);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm({
      memberId: members[0]?.id ?? "",
      date: todayIsoDate(),
      loginTime: "09:00",
      logoutTime: "18:00",
      lunchStartTime: "",
      lunchEndTime: "",
      status: "auto",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (record: AttendanceRecord) => {
    const calculatedStatus = getStatus(
      calculateHours(record.loginTime, record.logoutTime, record.lunchStartTime, record.lunchEndTime),
    );

    setEditingId(record.id);
    setForm({
      memberId: record.memberId,
      date: record.date,
      loginTime: record.loginTime,
      logoutTime: record.logoutTime,
      lunchStartTime: record.lunchStartTime ?? "",
      lunchEndTime: record.lunchEndTime ?? "",
      status: record.status === calculatedStatus ? "auto" : record.status,
    });
    setDialogOpen(true);
  };

  const filteredRecords = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    const cycleStart = startDate <= endDate ? startDate : endDate;
    const cycleEnd = startDate <= endDate ? endDate : startDate;

    return records
      .filter((record) => {
        const member = memberMap.get(record.memberId);
        if (!member) return false;
        if (memberFilter !== EMPTY_FILTER && record.memberId !== memberFilter) return false;
        if (record.approvalStatus === "Rejected") return false;
        if (record.date < cycleStart) return false;
        if (record.date > cycleEnd) return false;
        if (searchValue && !member.name.toLowerCase().includes(searchValue)) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.date === b.date) return a.loginTime.localeCompare(b.loginTime);
        return b.date.localeCompare(a.date);
      });
  }, [endDate, memberFilter, memberMap, records, search, startDate]);

  const computedHours = useMemo(() => {
    if (!isTime(form.loginTime) || !isTime(form.logoutTime)) return 0;
    return calculateHours(form.loginTime, form.logoutTime, form.lunchStartTime || undefined, form.lunchEndTime || undefined);
  }, [form.loginTime, form.logoutTime, form.lunchEndTime, form.lunchStartTime]);

  const previewStatus = form.status === "auto" ? computedStatusFromForm(form) : form.status;

  const setField = <K extends keyof AttendanceFormState>(key: K, value: AttendanceFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validateForm = () => {
    if (!form.memberId || !form.date || !form.loginTime || !form.logoutTime) {
      return "Employee, date, login time, and logout time are required";
    }
    if (!isTime(form.loginTime) || !isTime(form.logoutTime)) {
      return "Login and logout time must use HH:MM format";
    }
    if ((form.lunchStartTime && !form.lunchEndTime) || (!form.lunchStartTime && form.lunchEndTime)) {
      return "Lunch start and lunch end time must be provided together";
    }
    if (form.lunchStartTime && !isTime(form.lunchStartTime)) {
      return "Lunch start time must use HH:MM format";
    }
    if (form.lunchEndTime && !isTime(form.lunchEndTime)) {
      return "Lunch end time must use HH:MM format";
    }

    const loginMinutes = timeToMinutes(form.loginTime);
    const logoutMinutes = timeToMinutes(form.logoutTime);
    if (logoutMinutes <= loginMinutes) {
      return "Logout time must be after login time";
    }

    if (form.lunchStartTime && form.lunchEndTime) {
      const lunchStartMinutes = timeToMinutes(form.lunchStartTime);
      const lunchEndMinutes = timeToMinutes(form.lunchEndTime);
      if (lunchEndMinutes <= lunchStartMinutes) {
        return "Lunch end time must be after lunch start time";
      }
      if (lunchStartMinutes < loginMinutes || lunchEndMinutes > logoutMinutes) {
        return "Lunch break must stay within login and logout time";
      }
    }

    const duplicate = records.some(
      (record) => record.memberId === form.memberId && record.date === form.date && record.id !== editingId,
    );
    if (duplicate) {
      return "Attendance already exists for this employee on this date";
    }

    return null;
  };

  const submit = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    const payload = {
      memberId: form.memberId,
      date: form.date,
      loginTime: form.loginTime,
      logoutTime: form.logoutTime,
      lunchStartTime: form.lunchStartTime || undefined,
      lunchEndTime: form.lunchEndTime || undefined,
      status: form.status === "auto" ? undefined : form.status,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateAdminAttendance(editingId, payload);
        toast.success("Attendance record updated");
      } else {
        await createAdminAttendance(payload);
        toast.success("Attendance record added");
      }
      refreshRecords();
      setDialogOpen(false);
      setEditingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const activeFilters = [
    memberFilter !== EMPTY_FILTER,
    startDate !== defaultCycle.start,
    endDate !== defaultCycle.end,
    !!search.trim(),
  ].filter(Boolean).length;

  const totals = useMemo(() => {
    return filteredRecords.reduce(
      (summary, record) => {
        summary.total += 1;
        summary.hours += record.hours;
        return summary;
      },
      { total: 0, hours: 0 },
    );
  }, [filteredRecords]);

  const cycleStart = startDate <= endDate ? startDate : endDate;
  const cycleEnd = startDate <= endDate ? endDate : startDate;
  const percentageRows = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    const cycleDays = buildDateRange(cycleStart, cycleEnd);
    const workDays = cycleDays.filter((date) => !isHoliday(date));

    return members
      .filter((member) => {
        if (memberFilter !== EMPTY_FILTER && member.id !== memberFilter) return false;
        if (searchValue && !member.name.toLowerCase().includes(searchValue)) return false;
        return true;
      })
      .map((member) => {
        const personRecords = filteredRecords.filter((record) => record.memberId === member.id);
        const presentDates = new Set(personRecords.map((record) => record.date));
        const presentDays = workDays.filter((date) => presentDates.has(date)).length;
        const percentage = workDays.length > 0 ? +((presentDays / workDays.length) * 100).toFixed(1) : 0;
        const averageHours = personRecords.length > 0
          ? +(personRecords.reduce((sum, record) => sum + record.hours, 0) / personRecords.length).toFixed(2)
          : 0;

        return {
          member,
          percentage,
          presentDays,
          absentDays: Math.max(0, workDays.length - presentDays),
          workDays: workDays.length,
          averageHours,
        };
      })
      .sort((a, b) => b.percentage - a.percentage || a.member.name.localeCompare(b.member.name));
  }, [cycleEnd, cycleStart, filteredRecords, memberFilter, members, search]);
  const selectedQuickMember = memberMap.get(quickMemberId) ?? null;
  const quickRecordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const record of records) {
      if (record.memberId === quickMemberId) {
        map.set(record.date, record);
      }
    }
    return map;
  }, [quickMemberId, records]);
  const selectedQuickRecord = quickRecordMap.get(selectedCalendarDate);
  const selectedQuickStatus = isHoliday(selectedCalendarDate)
    ? "Holiday"
    : selectedQuickRecord
      ? selectedQuickRecord.status
      : "Absent";

  const handleQuickPresent = async () => {
    if (!quickMemberId) {
      toast.error("Select an employee first");
      return;
    }
    if (isHoliday(selectedCalendarDate)) {
      toast.error("Attendance cannot be marked on holidays");
      return;
    }

    const existingRecord = quickRecordMap.get(selectedCalendarDate);

    try {
      if (existingRecord) {
        await updateAdminAttendance(existingRecord.id, {
          memberId: existingRecord.memberId,
          date: existingRecord.date,
          loginTime: existingRecord.loginTime,
          logoutTime: existingRecord.logoutTime,
          lunchStartTime: existingRecord.lunchStartTime,
          lunchEndTime: existingRecord.lunchEndTime,
          status: existingRecord.status,
        });
        toast.success("Marked present and kept existing attendance details");
      } else {
        const payload = {
          memberId: quickMemberId,
          date: selectedCalendarDate,
          loginTime: "09:00",
          logoutTime: "18:00",
        };
        await createAdminAttendance(payload);
        toast.success("Marked present with default office hours");
      }
      refreshRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark present");
    }
  };

  const handleQuickAbsent = async () => {
    if (!quickMemberId) {
      toast.error("Select an employee first");
      return;
    }
    if (isHoliday(selectedCalendarDate)) {
      toast.error("Holiday dates cannot be changed here");
      return;
    }

    const existingRecord = quickRecordMap.get(selectedCalendarDate);
    if (!existingRecord) {
      toast.success("That day is already absent");
      return;
    }

    try {
      await deleteAdminAttendance(existingRecord.id);
      refreshRecords();
      toast.success("Marked absent by removing the attendance record");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark absent");
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingTarget =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable;

      if (isTypingTarget || dialogOpen) return;

      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        void handleQuickPresent();
      }

      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        void handleQuickAbsent();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialogOpen, handleQuickAbsent, handleQuickPresent]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="page-title mono-title">Manage Attendance</h2>
          <p className="page-subtitle mt-1">Review attendance by cycle, quick-mark days, and manage team entries.</p>
        </div>
        <Button onClick={openCreateDialog} disabled={members.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Add Attendance
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card rounded-2xl border-white/20 shadow-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-black/10 border border-black/10 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5 text-black/75" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-black/50 font-bold">Cycle Range</p>
              <p className="text-lg font-bold text-foreground">
                {format(new Date(`${cycleStart}T00:00:00`), "dd MMM")} - {format(new Date(`${cycleEnd}T00:00:00`), "dd MMM")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl border-white/20 shadow-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-black/10 border border-black/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-black/75" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-black/50 font-bold">Employees</p>
              <p className="text-2xl font-bold text-foreground">{percentageRows.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl border-white/20 shadow-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-black/10 border border-black/10 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5 text-black/75" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-black/50 font-bold">Present Entries</p>
              <p className="text-2xl font-bold text-foreground">{totals.total}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card rounded-2xl border-white/20 shadow-2xl">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg">Quick Mark Calendar</CardTitle>
          <p className="text-sm text-muted-foreground">Pick an employee and a day, then press <strong>P</strong> for present or <strong>A</strong> for absent.</p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <div className="mb-4">
                <Select value={quickMemberId} onValueChange={setQuickMemberId}>
                  <SelectTrigger className="w-full md:w-72 rounded-xl">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Calendar
                mode="single"
                selected={selectedCalendarDate ? new Date(`${selectedCalendarDate}T00:00:00`) : undefined}
                onSelect={(date) => {
                  if (!date) return;
                  setSelectedCalendarDate(toIsoDate(date));
                }}
                modifiers={{
                  holiday: (date) => isHoliday(toIsoDate(date)),
                  full: (date) => quickRecordMap.get(toIsoDate(date))?.status === "Full Day",
                  half: (date) => quickRecordMap.get(toIsoDate(date))?.status === "Half Day",
                  short: (date) => quickRecordMap.get(toIsoDate(date))?.status === "Short",
                  absent: (date) => !isHoliday(toIsoDate(date)) && !quickRecordMap.has(toIsoDate(date)),
                }}
                modifiersClassNames={{
                  holiday: calendarStatusClass.holiday,
                  full: calendarStatusClass.full,
                  half: calendarStatusClass.half,
                  short: calendarStatusClass.short,
                  absent: calendarStatusClass.absent,
                  day_today: "ring-2 ring-primary/40",
                }}
              />
            </div>

            <div className="space-y-4">
              <Card className="glass-card border-white/20 shadow-xl rounded-2xl">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Selected Employee</p>
                    <p className="text-sm font-semibold mt-1">{selectedQuickMember?.name ?? "No employee selected"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Selected Date</p>
                    <p className="text-sm font-semibold mt-1">{format(new Date(`${selectedCalendarDate}T00:00:00`), "dd MMM yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</p>
                    <div className="mt-2">
                      {selectedQuickStatus === "Holiday" ? (
                        <Badge className="badge-pill badge-holiday">Holiday</Badge>
                      ) : selectedQuickStatus === "Absent" ? (
                        <Badge className="badge-pill badge-absent">Absent</Badge>
                      ) : (
                        displayStatus(selectedQuickStatus)
                      )}
                    </div>
                  </div>

                  {selectedQuickRecord ? (
                    <div className="rounded-xl bg-muted/50 px-3 py-2.5 text-sm">
                      <div>
                        {selectedQuickRecord.loginTime} - {selectedQuickRecord.logoutTime}
                      </div>
                      <div className="text-muted-foreground mt-1">
                        {selectedQuickRecord.hours.toFixed(2)}h worked
                      </div>
                    </div>
                  ) : !isHoliday(selectedCalendarDate) ? (
                    <div className="rounded-xl bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
                      No attendance record yet for this date.
                    </div>
                  ) : (
                    <div className="rounded-xl bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
                      Holiday: {getHolidayReason(selectedCalendarDate) ?? "Company holiday"}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleQuickPresent} disabled={!quickMemberId || isHoliday(selectedCalendarDate)} className="rounded-xl">
                      Present (P)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleQuickAbsent}
                      disabled={!quickMemberId || isHoliday(selectedCalendarDate)}
                      className="rounded-xl"
                    >
                      Absent (A)
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (selectedQuickRecord) openEditDialog(selectedQuickRecord);
                      else {
                        setEditingId(null);
                        setForm({
                          memberId: quickMemberId,
                          date: selectedCalendarDate,
                          loginTime: "09:00",
                          logoutTime: "18:00",
                          lunchStartTime: "",
                          lunchEndTime: "",
                          status: "auto",
                        });
                        setDialogOpen(true);
                      }
                    }}
                    disabled={!quickMemberId || isHoliday(selectedCalendarDate)}
                    className="w-full rounded-xl justify-start"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {selectedQuickRecord ? "Edit Time Details" : "Open Detailed Entry"}
                  </Button>
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2">
                <Badge className="badge-pill badge-full-day">Present</Badge>
                <Badge className="badge-pill badge-absent">Absent</Badge>
                <Badge className="badge-pill badge-holiday">Holiday</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-2xl border-white/20 shadow-2xl">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by employee name"
                className="pl-9 rounded-xl"
              />
            </div>

            <Select value={memberFilter} onValueChange={setMemberFilter}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_FILTER}>All employees</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white/60 px-3 text-sm text-black/65">
              <span>{activeFilters} active filters</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => {
                  setSearch("");
                  setMemberFilter(EMPTY_FILTER);
                  setStartDate(defaultCycle.start);
                  setEndDate(defaultCycle.end);
                }}
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">From Date</Label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">To Date</Label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-2xl overflow-hidden border-white/20 shadow-2xl">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg">Attendance Percentage</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Cycle attendance percentage from {format(new Date(`${cycleStart}T00:00:00`), "dd MMM yyyy")} to {format(new Date(`${cycleEnd}T00:00:00`), "dd MMM yyyy")}, with Sundays and holidays excluded.
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          {percentageRows.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              No employees match the current filters.
            </div>
          ) : (
            percentageRows.map((row) => (
              <div key={row.member.id} className="rounded-2xl border border-white/15 bg-white/40 px-4 py-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-foreground">{row.member.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {row.presentDays}/{row.workDays} present
                      {row.workDays > 0 ? `, ${row.absentDays} absent` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{row.percentage.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Avg {row.averageHours.toFixed(2)}h/day</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={row.percentage} className="h-2.5 bg-black/8" />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Attendance" : "Add Attendance"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Employee</Label>
                <Select value={form.memberId} onValueChange={(value) => setField("memberId", value)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member: Member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</Label>
                <Input type="date" value={form.date} onChange={(event) => setField("date", event.target.value)} className="rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Login Time</Label>
                <Input type="time" value={form.loginTime} onChange={(event) => setField("loginTime", event.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Logout Time</Label>
                <Input type="time" value={form.logoutTime} onChange={(event) => setField("logoutTime", event.target.value)} className="rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lunch Start</Label>
                <Input
                  type="time"
                  value={form.lunchStartTime}
                  onChange={(event) => setField("lunchStartTime", event.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lunch End</Label>
                <Input
                  type="time"
                  value={form.lunchEndTime}
                  onChange={(event) => setField("lunchEndTime", event.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(value) => setField("status", value as StatusOption)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Automatic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automatic</SelectItem>
                  <SelectItem value="Full Day">Full Day</SelectItem>
                  <SelectItem value="Half Day">Half Day</SelectItem>
                  <SelectItem value="Short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 rounded-xl bg-muted/50 px-3 py-2.5 text-sm">
              <span>
                Hours: <strong>{computedHours.toFixed(2)}h</strong>
              </span>
              <span>
                Applied Status: <strong>{previewStatus}</strong>
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving} className="rounded-xl">
              {saving ? "Saving..." : editingId ? "Update Attendance" : "Add Attendance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
