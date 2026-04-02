import { useMemo, useState } from "react";
import { storage, type TaskPriority, type TaskStatus } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Download } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function priorityBadgeClass(p: TaskPriority) {
  if (p === "High") return "bg-black/14 text-black/85 border border-black/24";
  if (p === "Medium") return "bg-black/10 text-black/78 border border-black/20";
  return "bg-black/7 text-black/68 border border-black/16";
}

function statusBadgeClass(s: TaskStatus) {
  if (s === "Completed") return "badge-pill badge-full-day";
  if (s === "In Progress") return "badge-pill badge-half-day";
  return "badge-pill badge-absent";
}

export default function WorkReports() {
  const role = storage.getCurrentRole();
  const me = storage.getCurrentMember();
  const members = storage.getMembers();
  const tasks = storage.getTasks();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
  const [filterMember, setFilterMember] = useState("all");
  const [filterDueFrom, setFilterDueFrom] = useState("");
  const [filterDueTo, setFilterDueTo] = useState("");

  const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? "Unknown";
  const assigneeIds = (assignedTo: string | string[]) =>
    Array.isArray(assignedTo) ? assignedTo : [assignedTo];
  const assigneeLabel = (assignedTo: string | string[]) =>
    assigneeIds(assignedTo).map(getMemberName).join(", ");

  const visibleTasks = useMemo(() => {
    let list = [...tasks];
    if (role !== "Admin") {
      if (!me) return [];
      list = list.filter((t) => assigneeIds(t.assignedTo).includes(me.id));
    }
    if (filterStatus !== "all") list = list.filter((t) => t.status === filterStatus);
    if (filterPriority !== "all") list = list.filter((t) => t.priority === filterPriority);
    if (filterMember !== "all") list = list.filter((t) => assigneeIds(t.assignedTo).includes(filterMember));
    if (filterDueFrom) list = list.filter((t) => t.deadline >= filterDueFrom);
    if (filterDueTo) list = list.filter((t) => t.deadline <= filterDueTo);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(s) ||
          (t.description || "").toLowerCase().includes(s) ||
          assigneeLabel(t.assignedTo).toLowerCase().includes(s),
      );
    }
    return list.sort((a, b) => {
      const byDue = a.deadline.localeCompare(b.deadline);
      if (byDue !== 0) return byDue;
      return b.updatedAt - a.updatedAt;
    });
  }, [tasks, role, me, filterStatus, filterPriority, filterMember, filterDueFrom, filterDueTo, search, members]);

  const stats = useMemo(() => {
    const base = role === "Admin" ? tasks : me ? tasks.filter((t) => assigneeIds(t.assignedTo).includes(me.id)) : [];
    return {
      total: base.length,
      assigned: base.filter((t) => t.status === "Assigned").length,
      inProgress: base.filter((t) => t.status === "In Progress").length,
      completed: base.filter((t) => t.status === "Completed").length,
    };
  }, [tasks, role, me]);

  const exportCsv = () => {
    const headers = ["Task Title", "Priority", "Due Date", "Assignee", "Status", "Description", "Last Updated"];
    const rows = visibleTasks.map((t) => [
      `"${(t.title || "").replace(/"/g, '""')}"`,
      t.priority,
      t.deadline,
      `"${assigneeLabel(t.assignedTo).replace(/"/g, '""')}"`,
      t.status,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      format(new Date(t.updatedAt), "yyyy-MM-dd HH:mm"),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `task-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-3"
      >
        <div>
          <h2 className="page-title mono-title">
            Work Reports
          </h2>
          <p className="page-subtitle mt-1">
            Auto-generated from the task board — no manual entry. Updates when tasks change on the Board.
          </p>
        </div>
        {role === "Admin" && visibleTasks.length > 0 && (
          <Button variant="outline" className="rounded-full" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        )}
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total tasks", value: stats.total },
          { label: "Assigned", value: stats.assigned },
          { label: "In progress", value: stats.inProgress },
          { label: "Completed", value: stats.completed },
        ].map((s) => (
          <Card key={s.label} className="glass-card rounded-2xl">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="glass-card rounded-2xl">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Filters</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search title, description, assignee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 rounded-full input-glass border-0"
              />
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as TaskStatus | "all")}>
              <SelectTrigger className="w-40 h-11 rounded-full input-glass border-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Assigned">Assigned</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as TaskPriority | "all")}>
              <SelectTrigger className="w-36 h-11 rounded-full input-glass border-0">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
            {role === "Admin" && (
              <Select value={filterMember} onValueChange={setFilterMember}>
                <SelectTrigger className="w-44 h-11 rounded-full input-glass border-0">
                  <SelectValue placeholder="Member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All members</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Input
              type="date"
              value={filterDueFrom}
              onChange={(e) => setFilterDueFrom(e.target.value)}
              className="w-40 h-11 rounded-full input-glass border-0"
              title="Due from"
            />
            <Input
              type="date"
              value={filterDueTo}
              onChange={(e) => setFilterDueTo(e.target.value)}
              className="w-40 h-11 rounded-full input-glass border-0"
              title="Due to"
            />
            {(search || filterStatus !== "all" || filterPriority !== "all" || filterMember !== "all" || filterDueFrom || filterDueTo) && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => {
                  setSearch("");
                  setFilterStatus("all");
                  setFilterPriority("all");
                  setFilterMember("all");
                  setFilterDueFrom("");
                  setFilterDueTo("");
                }}
              >
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-card rounded-2xl overflow-hidden border-white/20 shadow-2xl">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/5 hover:bg-white/5 border-b border-white/10">
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Task title</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Priority</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Due date</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Assignee</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">Board status</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-foreground/80">
                    Description
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">No tasks match your filters.</p>
                        <p className="text-xs text-muted-foreground/70 mt-2">
                          Assign tasks on the Board — they appear here automatically.
                        </p>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                )}
                {visibleTasks.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className={cn(
                      "hover:bg-white/10 transition-all duration-200 border-b border-white/5",
                      i % 2 === 0 && "bg-white/3",
                    )}
                  >
                    <TableCell className="font-semibold text-sm text-foreground max-w-[220px]">
                      <span className="line-clamp-2" title={t.title}>
                        {t.title}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs font-semibold", priorityBadgeClass(t.priority))}>{t.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-foreground/80 whitespace-nowrap">{t.deadline}</TableCell>
                    <TableCell className="text-sm font-medium">{assigneeLabel(t.assignedTo)}</TableCell>
                    <TableCell>
                      <span className={cn("text-xs font-semibold", statusBadgeClass(t.status))}>{t.status}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="line-clamp-1 sm:line-clamp-2 md:line-clamp-3 break-words whitespace-normal" title={t.description || ""}>
                        {t.description?.trim() ? t.description : "—"}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
