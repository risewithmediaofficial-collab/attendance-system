import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storage } from "@/lib/storage";
import { Users, CalendarCheck, Clock, FileText } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const today = format(new Date(), "yyyy-MM-dd");

  const stats = useMemo(() => {
    const members = storage.getMembers();
    const attendance = storage.getAttendance();
    const reports = storage.getWorkReports();
    const holidays = storage.getHolidays();

    const todayAttendance = attendance.filter(a => a.date === today);
    const totalHoursToday = todayAttendance.reduce((s, a) => s + a.hours, 0);
    const isHolidayToday = holidays.some(h => h.date === today);

    const totalReports = reports.length;
    const doneReports = reports.filter(r => r.delivery === "Done").length;

    return {
      totalMembers: members.length,
      presentToday: todayAttendance.length,
      absentToday: Math.max(0, members.length - todayAttendance.length),
      totalHoursToday: totalHoursToday.toFixed(1),
      isHolidayToday,
      totalReports,
      doneReports,
      pendingReports: totalReports - doneReports,
    };
  }, [today]);

  const cards = [
    { title: "Total Members", value: stats.totalMembers, icon: Users, color: "text-primary" },
    { title: "Present Today", value: stats.isHolidayToday ? "Holiday" : stats.presentToday, icon: CalendarCheck, color: "text-[hsl(var(--success))]" },
    { title: "Absent Today", value: stats.isHolidayToday ? "—" : stats.absentToday, icon: CalendarCheck, color: "text-destructive" },
    { title: "Hours Today", value: stats.isHolidayToday ? "—" : stats.totalHoursToday, icon: Clock, color: "text-[hsl(var(--warning))]" },
    { title: "Reports Done", value: stats.doneReports, icon: FileText, color: "text-[hsl(var(--success))]" },
    { title: "Reports Pending", value: stats.pendingReports, icon: FileText, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
