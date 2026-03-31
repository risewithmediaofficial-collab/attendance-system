import { useState, useEffect } from "react";
import { storage, Holiday, generateId, getDayName } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Palmtree, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Holidays() {
  const role = storage.getCurrentRole();
  const [holidays, setHolidays] = useState<Holiday[]>(storage.getHolidays());
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (role === "Admin") {
      storage.setHolidays(holidays);
    }
  }, [holidays, role]);

  if (role !== "Admin") {
    return (
      <div className="space-y-6">
        <Card className="glass-card rounded-2xl border-white/20 shadow-2xl">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-lg">Holidays are Admin-only</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Your role does not have permission to manage holidays.</p>
          </CardHeader>
          <CardContent className="p-6 pt-0 text-xs text-muted-foreground">
            Ask an Admin to add holidays; they will be reflected in your attendance calendar automatically.
          </CardContent>
        </Card>
      </div>
    );
  }

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
      {/* Header section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h2 className="page-title mono-title">Holidays & Days Off</h2>
          <p className="page-subtitle mt-2">
            {holidays.length} holiday{holidays.length !== 1 ? "s" : ""} scheduled - plan your time
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            onClick={() => { setDate(""); setReason(""); setOpen(true); }} 
            className="rounded-full shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Holiday
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence>
          {holidays.map(h => (
            <motion.div 
              key={h.id} 
              variants={item} 
              layout 
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -4 }}
            >
              <Card className="glass-card rounded-2xl hover:shadow-xl transition-all duration-300 group overflow-hidden border-white/20 shadow-lg">
                {/* Top gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-black to-zinc-500" />
                
                <CardContent className="p-5 pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="h-11 w-11 rounded-xl bg-gradient-to-br from-black/15 to-zinc-500/15 flex items-center justify-center shrink-0"
                      >
                        <Calendar className="h-5 w-5 text-black/80" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground">{h.reason}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(h.date)} - {getDayName(h.date)}</p>
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/12 hover:text-black"
                        onClick={() => setDeleteId(h.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {holidays.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground"
          >
            <Palmtree className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-sm font-medium">No holidays added yet</p>
            <p className="text-xs text-muted-foreground/60">Add holidays to your calendar</p>
          </motion.div>
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

