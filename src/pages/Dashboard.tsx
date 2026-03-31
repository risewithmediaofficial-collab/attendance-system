import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { storage } from "@/lib/storage";
import { Users, CalendarCheck, Clock, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Dashboard() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { stats, weekData, pieData } = useMemo(() => {
    const members = storage.getMembers();
    const attendance = storage.getAttendance();
    const reports = storage.getWorkReports();
    const holidays = storage.getHolidays();

    const todayAtt = attendance.filter(a => a.date === today);
    const totalHoursToday = todayAtt.reduce((s, a) => s + a.hours, 0);
    const isHolidayToday = holidays.some(h => h.date === today);

    const doneReports = reports.filter(r => r.delivery === "Done").length;

    // Last 7 days attendance chart data
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = format(d, "yyyy-MM-dd");
      const dayAtt = attendance.filter(a => a.date === ds);
      weekData.push({
        day: format(d, "EEE"),
        present: dayAtt.length,
        hours: +(dayAtt.reduce((s, a) => s + a.hours, 0)).toFixed(1),
      });
    }

    const pieData = [
      { name: "Done", value: doneReports, color: "hsl(0, 0%, 18%)" },
      { name: "Pending", value: Math.max(0, reports.length - doneReports), color: "hsl(0, 0%, 50%)" },
    ];

    return {
      stats: {
        totalMembers: members.length,
        presentToday: isHolidayToday ? "Holiday" : todayAtt.length,
        absentToday: isHolidayToday ? "—" : Math.max(0, members.length - todayAtt.length),
        totalHoursToday: isHolidayToday ? "—" : totalHoursToday.toFixed(1),
        totalReports: reports.length,
        doneReports,
      },
      weekData,
      pieData,
    };
  }, [today]);

  const cards = [
    { title: "Total Members", value: stats.totalMembers, icon: Users, gradient: "from-black/15 to-black/5", iconColor: "text-black/80" },
    { title: "Present Today", value: stats.presentToday, icon: CalendarCheck, gradient: "from-black/12 to-black/5", iconColor: "text-black/75" },
    { title: "Absent Today", value: stats.absentToday, icon: AlertCircle, gradient: "from-black/10 to-black/4", iconColor: "text-black/70" },
    { title: "Hours Today", value: stats.totalHoursToday, icon: Clock, gradient: "from-black/14 to-black/6", iconColor: "text-black/78" },
    { title: "Reports Done", value: stats.doneReports, icon: TrendingUp, gradient: "from-black/12 to-black/5", iconColor: "text-black/75" },
    { title: "Total Reports", value: stats.totalReports, icon: FileText, gradient: "from-black/10 to-black/4", iconColor: "text-black/70" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="page-title">Dashboard</h2>
        <p className="page-subtitle mt-1">Overview of your intern management system</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {cards.map(c => (
          <motion.div key={c.title} variants={item}>
            <Card className="glass-card rounded-2xl hover:shadow-md transition-shadow duration-300 overflow-hidden group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{c.title}</p>
                    <p className="text-3xl font-bold mt-2">{c.value}</p>
                  </div>
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <c.icon className={`h-5 w-5 ${c.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-2">
          <Card className="glass-card rounded-2xl">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-4">Attendance — Last 7 Days</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekData}>
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="present" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Present" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="glass-card rounded-2xl">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-4">Work Completion</h3>
              <div className="h-56 flex items-center justify-center">
                {stats.totalReports === 0 ? (
                  <p className="text-sm text-muted-foreground">No reports yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--card))",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-black/80" />
                  <span>Done</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-black/45" />
                  <span>Pending</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
