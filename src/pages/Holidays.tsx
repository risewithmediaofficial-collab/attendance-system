import { useState, useEffect } from "react";
import { storage, Holiday, generateId, getDayName } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Palmtree, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Holidays() {
  const [holidays, setHolidays] = useState<Holiday[]>(storage.getHolidays());
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => { storage.setHolidays(holidays); }, [holidays]);

  const save = () => {
    if (!date || !reason.trim()) return;
    if (holidays.some(h => h.date === date)) {
      toast.error("This date is already a holiday");
      return;
    }
    setHolidays(prev => [...prev, { id: generateId(), date, reason: reason.trim() }].sort((a, b) => a.date.localeCompare(b.date)));
    toast.success("Holiday added");
    setOpen(false);
    setDate(""); setReason("");
  };

  const confirmDelete = () => {
    if (deleteId) {
      setHolidays(prev => prev.filter(h => h.id !== deleteId));
      toast.success("Holiday removed");
      setDeleteId(null);
    }
  };

  const formatDate = (d: string) => {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Holidays</h2>
          <p className="text-sm text-muted-foreground mt-1">{holidays.length} holiday{holidays.length !== 1 ? "s" : ""} scheduled</p>
        </div>
        <Button onClick={() => { setDate(""); setReason(""); setOpen(true); }} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="mr-1.5 h-4 w-4" />Add Holiday
        </Button>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence>
          {holidays.map(h => (
            <motion.div key={h.id} variants={item} layout exit={{ opacity: 0, scale: 0.9 }}>
              <Card className="glass-card rounded-2xl hover:shadow-md transition-all duration-300 group overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{h.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(h.date)} · {getDayName(h.date)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                        onClick={() => setDeleteId(h.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {holidays.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Palmtree className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No holidays added yet</p>
          </div>
        )}
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Add Holiday</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-10 rounded-xl" />
              {date && (
                <p className="text-xs text-muted-foreground">{getDayName(date)}</p>
              )}
              {date && holidays.some(h => h.date === date) && (
                <p className="text-xs text-destructive">This date is already a holiday</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Reason</Label>
              <Input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Independence Day"
                className="h-10 rounded-xl"
                onKeyDown={e => e.key === "Enter" && save()}
              />
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
        title="Delete Holiday"
        description="This holiday will be removed from the calendar."
      />
    </div>
  );
}
