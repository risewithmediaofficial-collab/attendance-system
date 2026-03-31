import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { storage, type Member, type Task, type AttendanceRecord } from "@/lib/storage";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function isHoliday(dateStr: string, holidays: { date: string }[]) {
  return holidays.some((h) => h.date === dateStr);
}

function calcAttendancePct(memberId: string, days: string[], attendance: AttendanceRecord[], holidays: { date: string }[]) {
  const workDays = days.filter((d) => !isHoliday(d, holidays));
  if (workDays.length === 0) return 0;
  const present = workDays.filter((d) => attendance.some((a) => a.memberId === memberId && a.date === d)).length;
  return +(present / workDays.length * 100).toFixed(1);
}

function calcTaskCompletionPct(memberId: string, tasks: Task[], days: string[]) {
  const relevant = tasks.filter((t) => t.assignedTo === memberId && days.includes(t.deadline));
  if (relevant.length === 0) return 0;
  const completed = relevant.filter((t) => t.status === "Completed").length;
  return +(completed / relevant.length * 100).toFixed(1);
}

function calcScore(attPct: number, taskPct: number) {
  // Weighted: attendance matters slightly more.
  return Math.round(attPct * 0.6 + taskPct * 0.4);
}

const donutColors = ["hsl(0, 0%, 18%)", "hsl(0, 0%, 38%)", "hsl(0, 0%, 56%)"];

export default function Performance() {
  const role = storage.getCurrentRole();
  const me = storage.getCurrentMember();
  const members = storage.getMembers();
  const attendance = storage.getAttendance();
  const tasks = storage.getTasks();
  const holidays = storage.getHolidays();

  const days = useMemo(() => {
    const out: string[] = [];
    const end = new Date();
    // last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      out.push(toIsoDate(d));
    }
    return out;
  }, []);

  const targetMembers = useMemo(() => {
    if (role === "Admin") return members;
    if (!me) return [];
    return [me];
  }, [role, me, members]);

  const computed = useMemo(() => {
    return targetMembers.map((m) => {
      const attPct = calcAttendancePct(m.id, days, attendance, holidays);
      const taskPct = calcTaskCompletionPct(m.id, tasks, days);
      const score = calcScore(attPct, taskPct);
      const tasksAssigned = tasks.filter((t) => t.assignedTo === m.id && days.includes(t.deadline)).length;
      const tasksCompleted = tasks.filter((t) => t.assignedTo === m.id && t.status === "Completed" && days.includes(t.deadline)).length;
      const presentDays = days.filter((d) => !isHoliday(d, holidays) && attendance.some((a) => a.memberId === m.id && a.date === d)).length;
      return {
        member: m,
        score,
        attPct,
        taskPct,
        tasksAssigned,
        tasksCompleted,
        presentDays,
        workDays: days.filter((d) => !isHoliday(d, holidays)).length,
      };
    });
  }, [targetMembers, days, attendance, holidays, tasks]);

  const chartData = useMemo(() => {
    // Attendance trend: aggregate present count / workdays.
    const workDays = days.filter((d) => !isHoliday(d, holidays));
    const series = days.map((d) => {
      const denom = workDays.includes(d) ? 1 : 0;
      if (!denom) {
        return { day: format(new Date(d), "EEE"), presentPct: 0, holiday: true };
      }
      const relevantMembers = role === "Admin" ? members : me ? [me] : [];
      const presentCount = relevantMembers.filter((m) => attendance.some((a) => a.memberId === m.id && a.date === d)).length;
      const pct = relevantMembers.length > 0 ? (presentCount / relevantMembers.length) * 100 : 0;
      return { day: format(new Date(d), "EEE"), presentPct: +pct.toFixed(1), holiday: false };
    });
    return series;
  }, [days, holidays, role, members, me, attendance]);

  const donutData = useMemo(() => {
    const relevantMemberIds = new Set(targetMembers.map((m) => m.id));
    const relTasks = tasks.filter((t) => relevantMemberIds.has(t.assignedTo) && days.includes(t.deadline));
    const completed = relTasks.filter((t) => t.status === "Completed").length;
    const other = Math.max(0, relTasks.length - completed);
    return [
      { name: "Completed", value: completed, color: donutColors[0] },
      { name: "In-flight / Pending", value: other, color: donutColors[1] },
    ];
  }, [tasks, targetMembers, days]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Performance Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Score = Attendance% (60%) + Task Completion% (40%)
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge className="bg-white/10 border-white/20 text-foreground px-3 py-1 rounded-full">
            {role} view
          </Badge>
          <Button
            variant="outline"
            onClick={() => toastNotImplemented()}
            className="rounded-full"
            style={{ display: "none" }}
          >
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
          <Card className="glass-card rounded-2xl border-white/20 shadow-2xl">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-lg">Attendance % (Last 14 Days)</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Holiday days are excluded from the denominator.</p>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
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
                    <Bar dataKey="presentPct" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} animationDuration={700} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card rounded-2xl border-white/20 shadow-2xl">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-lg">Task Completion (Selected)</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Based on deadlines within the last 14 days.</p>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      strokeWidth={0}
                      animationDuration={700}
                    >
                      {donutData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        background: "rgba(255, 255, 255, 0.1)",
                        backdropFilter: "blur(10px)",
                        fontSize: 12,
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Score Table */}
      <Card className="glass-card rounded-2xl border-white/20 shadow-2xl">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg">Performance Scores</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{role === "Admin" ? "All members" : "Your personal performance"}</p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/5 border-b border-white/10">
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Member</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Attendance %</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Task Completion %</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Score</TableHead>
                  <TableHead className="w-48 font-bold text-xs uppercase tracking-widest text-foreground/80">Task Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {computed.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                      No members available.
                    </TableCell>
                  </TableRow>
                )}

                {computed.map((row) => (
                  <TableRow key={row.member.id} className="border-b border-white/5">
                    <TableCell className="font-semibold">{row.member.name}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{row.attPct.toFixed(1)}%</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{row.taskPct.toFixed(1)}%</span>
                    </TableCell>
                    <TableCell>
                      <span className="badge-pill badge-full-day bg-white/10 border border-white/20 text-foreground">
                        {row.score}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.tasksCompleted}/{row.tasksAssigned} completed
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Avoid adding more runtime logic; this UI button is currently hidden.
function toastNotImplemented() {
  // noop
}

