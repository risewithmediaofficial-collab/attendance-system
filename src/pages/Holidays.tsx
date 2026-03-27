import { useState, useEffect } from "react";
import { storage, Holiday, generateId } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { getDayName } from "@/lib/storage";

export default function Holidays() {
  const [holidays, setHolidays] = useState<Holiday[]>(storage.getHolidays());
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => { storage.setHolidays(holidays); }, [holidays]);

  const save = () => {
    if (!date || !reason.trim()) return;
    if (holidays.some(h => h.date === date)) return;
    setHolidays(prev => [...prev, { id: generateId(), date, reason: reason.trim() }].sort((a, b) => a.date.localeCompare(b.date)));
    setOpen(false);
    setDate(""); setReason("");
  };

  const remove = (id: string) => setHolidays(prev => prev.filter(h => h.id !== id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Holidays</h2>
        <Button onClick={() => { setDate(""); setReason(""); setOpen(true); }} size="sm">
          <Plus className="mr-1 h-4 w-4" />Add Holiday
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="w-20 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holidays.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No holidays</TableCell></TableRow>
            )}
            {holidays.map((h, i) => (
              <TableRow key={h.id}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell>{h.date}</TableCell>
                <TableCell>{getDayName(h.date)}</TableCell>
                <TableCell className="font-medium">{h.reason}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => remove(h.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Holiday</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              {date && <p className="text-xs text-muted-foreground">{getDayName(date)}</p>}
              {date && holidays.some(h => h.date === date) && (
                <p className="text-xs text-destructive">This date is already a holiday.</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Reason</Label>
              <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Holiday reason" onKeyDown={e => e.key === "Enter" && save()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
