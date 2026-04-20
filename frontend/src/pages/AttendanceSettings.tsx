import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Calendar, Save, RotateCcw, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { apiJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AttendanceSettings {
  officeStartTime: string;
  officeEndTime: string;
  lunchStartTime: string;
  lunchEndTime: string;
  attendancePercentageStartDate?: string;
  attendancePercentageEndDate?: string;
  attendanceResolvedStartDate?: string;
  attendanceResolvedEndDate?: string;
  attendanceCalculationMode: string;
  attendanceLastNDays: number;
}

interface MemberAttendance {
  memberId: string;
  memberName: string;
  presentDays: number;
  totalWorkingDays: number;
  attendancePercentage: number;
  status: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Excellent":
      return "bg-green-100 text-green-800";
    case "Good":
      return "bg-blue-100 text-blue-800";
    case "Average":
      return "bg-yellow-100 text-yellow-800";
    case "Poor":
      return "bg-orange-100 text-orange-800";
    case "Critical":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const AttendanceSettingsAdmin = () => {
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [officeStartTime, setOfficeStartTime] = useState("09:30");
  const [officeEndTime, setOfficeEndTime] = useState("16:30");
  const [lunchStartTime, setLunchStartTime] = useState("12:30");
  const [lunchEndTime, setLunchEndTime] = useState("13:30");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [calculationMode, setCalculationMode] = useState("date-range");
  const [lastNDays, setLastNDays] = useState("30");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [membersList, setMembersList] = useState<MemberAttendance[]>([]);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiJson("/attendance/settings", { method: "GET" });

      if (response.success || response.officeStartTime) {
        const data = response.success ? response.data : response;
        setSettings(data);
        setOfficeStartTime(data.officeStartTime || "09:30");
        setOfficeEndTime(data.officeEndTime || "16:30");
        setLunchStartTime(data.lunchStartTime || "12:30");
        setLunchEndTime(data.lunchEndTime || "13:30");
        setStartDate(data.attendancePercentageStartDate || "");
        setEndDate(data.attendancePercentageEndDate || "");
        setCalculationMode(data.attendanceCalculationMode || "date-range");
        setLastNDays(String(data.attendanceLastNDays || 30));
      } else {
        toast.error("Failed to load settings");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Error loading settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveOfficeHours = async () => {
    if (!officeStartTime || !officeEndTime || !lunchStartTime || !lunchEndTime) {
      toast.error("Please fill in all office hours");
      return;
    }

    setSaving(true);
    try {
      const response = await apiJson("/attendance/settings/office-hours", {
        method: "POST",
        body: JSON.stringify({
          officeStartTime,
          officeEndTime,
          lunchStartTime,
          lunchEndTime,
        }),
      });

      if (response.success || response.officeStartTime) {
        toast.success("Office hours updated successfully");
        loadSettings();
      } else {
        toast.error(response.error || "Failed to save office hours");
      }
    } catch (error) {
      console.error("Error saving office hours:", error);
      toast.error("Error saving office hours");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    const trimmedLastNDays = lastNDays.trim();
    const parsedLastNDays = Number.parseInt(trimmedLastNDays, 10);

    if (calculationMode === "date-range") {
      if (!startDate || !endDate) {
        toast.error("Please select both start and end dates");
        return;
      }

      if (new Date(startDate) > new Date(endDate)) {
        toast.error("Start date must be before end date");
        return;
      }
    } else if (!Number.isInteger(parsedLastNDays) || parsedLastNDays < 1 || parsedLastNDays > 365) {
      toast.error("Number of days must be between 1 and 365");
      return;
    }

    setSaving(true);
    try {
      const response = await apiJson("/attendance/settings/date-range", {
        method: "POST",
        body: JSON.stringify({
          calculationMode,
          startDate: calculationMode === "date-range" ? startDate : undefined,
          endDate: calculationMode === "date-range" ? endDate : undefined,
          lastNDays: parsedLastNDays,
        }),
      });

      if (response.success || response.startDate || response.calculationMode) {
        toast.success("Attendance settings updated successfully");
        loadSettings();
      } else {
        toast.error(response.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = async () => {
    if (!confirm("Are you sure you want to reset settings to default?")) return;

    setSaving(true);
    try {
      const response = await apiJson("/attendance/settings/reset", {
        method: "POST",
      });

      if (response.success || response.message) {
        toast.success("Settings reset successfully");
        setStartDate("");
        setEndDate("");
        setCalculationMode("date-range");
        setLastNDays("30");
        loadSettings();
      } else {
        toast.error("Failed to reset settings");
      }
    } catch (error) {
      console.error("Error resetting settings:", error);
      toast.error("Error resetting settings");
    } finally {
      setSaving(false);
    }
  };

  const handleViewMembersAttendance = async () => {
    setShowMembersDialog(true);
    setLoadingMembers(true);
    try {
      const response = await apiJson("/attendance/percentage", { method: "GET" });

      if (response.success || response.members) {
        const data = response.success ? response.data : response;
        setMembersList(data.members || []);
      } else {
        toast.error(response.error || "Failed to load attendance data");
      }
    } catch (error) {
      console.error("Error loading member attendance:", error);
      toast.error("Error loading attendance data");
    } finally {
      setLoadingMembers(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading attendance settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-4xl space-y-6"
      >
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Attendance Settings</h1>
          <p className="mt-2 text-gray-600">Configure office hours, lunch time, and attendance calculation</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Office Hours Configuration
            </CardTitle>
            <CardDescription>Set office hours, lunch break, and auto-checkout time</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="office-start" className="mb-2 block text-sm font-semibold">
                  Office Start Time
                </Label>
                <Input
                  id="office-start"
                  type="time"
                  value={officeStartTime}
                  onChange={(e) => setOfficeStartTime(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="office-end" className="mb-2 block text-sm font-semibold">
                  Office End Time
                </Label>
                <Input
                  id="office-end"
                  type="time"
                  value={officeEndTime}
                  onChange={(e) => setOfficeEndTime(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="lunch-start" className="mb-2 block text-sm font-semibold">
                  Lunch Start Time
                </Label>
                <Input
                  id="lunch-start"
                  type="time"
                  value={lunchStartTime}
                  onChange={(e) => setLunchStartTime(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="lunch-end" className="mb-2 block text-sm font-semibold">
                  Lunch End Time
                </Label>
                <Input
                  id="lunch-end"
                  type="time"
                  value={lunchEndTime}
                  onChange={(e) => setLunchEndTime(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {settings?.officeStartTime && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-green-900">Current Office Hours</p>
                    <p className="text-green-700">
                      Office: <span className="font-bold">{settings.officeStartTime}</span> -{" "}
                      <span className="font-bold">{settings.officeEndTime}</span>
                    </p>
                    <p className="text-green-700">
                      Lunch: <span className="font-bold">{settings.lunchStartTime}</span> -{" "}
                      <span className="font-bold">{settings.lunchEndTime}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 border-t pt-6">
              <Button
                onClick={handleSaveOfficeHours}
                disabled={saving}
                className="flex flex-1 items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Office Hours"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          <h1 className="text-4xl font-bold text-gray-900">Attendance Calculation</h1>
          <p className="mt-2 text-gray-600">Configure how attendance percentages are calculated</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Attendance Percentage Configuration
            </CardTitle>
            <CardDescription>Set the date range or rolling window for attendance percentages</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-8">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calculation-mode" className="mb-2 block text-sm font-semibold">
                  Calculation Mode
                </Label>
                <Select value={calculationMode} onValueChange={setCalculationMode}>
                  <SelectTrigger id="calculation-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-range">Date Range</SelectItem>
                    <SelectItem value="last-n-days">Last N Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {calculationMode === "last-n-days" && (
                <div>
                  <Label htmlFor="last-n-days" className="mb-2 block text-sm font-semibold">
                    Number of Days
                  </Label>
                  <Input
                    id="last-n-days"
                    type="number"
                    min="1"
                    max="365"
                    value={lastNDays}
                    onChange={(e) => setLastNDays(e.target.value)}
                    placeholder="Enter number of days"
                  />
                </div>
              )}
            </div>

            {calculationMode === "date-range" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 gap-6 md:grid-cols-2"
              >
                <div>
                  <Label htmlFor="start-date" className="mb-2 block text-sm font-semibold">
                    Start Date
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="end-date" className="mb-2 block text-sm font-semibold">
                    End Date
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </motion.div>
            )}

            {settings?.attendanceCalculationMode === "date-range" &&
              settings?.attendanceResolvedStartDate &&
              settings?.attendanceResolvedEndDate && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900">Current Settings</p>
                    <p className="mt-1 text-blue-700">
                      Calculating attendance from{" "}
                      <span className="font-bold">
                        {format(new Date(settings.attendanceResolvedStartDate), "PPP")}
                      </span>{" "}
                      to{" "}
                      <span className="font-bold">
                        {format(new Date(settings.attendanceResolvedEndDate), "PPP")}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {settings?.attendanceCalculationMode === "last-n-days" &&
              settings?.attendanceResolvedStartDate &&
              settings?.attendanceResolvedEndDate && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900">Current Settings</p>
                    <p className="mt-1 text-blue-700">
                      Calculating attendance for the last{" "}
                      <span className="font-bold">{settings.attendanceLastNDays}</span> days from{" "}
                      <span className="font-bold">
                        {format(new Date(settings.attendanceResolvedStartDate), "PPP")}
                      </span>{" "}
                      to{" "}
                      <span className="font-bold">
                        {format(new Date(settings.attendanceResolvedEndDate), "PPP")}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {settings?.attendanceCalculationMode === "date-range" &&
              !settings?.attendancePercentageStartDate && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-900">No Date Range Set</p>
                    <p className="mt-1 text-yellow-700">
                      Please set a date range to enable attendance percentage calculation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 border-t pt-6">
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex flex-1 items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Settings"}
              </Button>

              <Button
                onClick={handleViewMembersAttendance}
                variant="outline"
                className="flex flex-1 items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                View Members Attendance
              </Button>

              <Button
                onClick={handleResetSettings}
                disabled={saving}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">How it works</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="font-bold text-indigo-600">&bull;</span>
                  {calculationMode === "last-n-days"
                    ? "Use Last N Days to calculate attendance against a rolling recent window."
                    : "Select a date range to calculate attendance percentage for all members."}
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-indigo-600">&bull;</span>
                  Weekends and configured holidays are excluded from the calculation.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-indigo-600">&bull;</span>
                  Present, Late, and Half-day statuses count as present.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-indigo-600">&bull;</span>
                  Click "View Members Attendance" to see the calculated percentages.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Members Attendance Report</DialogTitle>
            <DialogDescription>
              Attendance percentages for the currently configured calculation window
            </DialogDescription>
          </DialogHeader>

          {loadingMembers ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                <p className="mt-4 text-gray-600">Loading attendance data...</p>
              </div>
            </div>
          ) : membersList.length > 0 ? (
            <div className="space-y-4">
              {membersList.map((member) => (
                <motion.div
                  key={member.memberId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-lg border p-4 transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{member.memberName}</p>
                      <p className="text-xs text-gray-500">ID: {member.memberId}</p>
                    </div>
                    <Badge className={getStatusColor(member.status)}>{member.status}</Badge>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {member.presentDays} / {member.totalWorkingDays} days
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {member.attendancePercentage.toFixed(2)}%
                        </span>
                      </div>
                      <Progress value={member.attendancePercentage} className="h-2" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto mb-3 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">No attendance data available for the selected range</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMembersDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceSettingsAdmin;
