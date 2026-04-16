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
  attendancePercentageStartDate?: string;
  attendancePercentageEndDate?: string;
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [calculationMode, setCalculationMode] = useState("date-range");
  const [lastNDays, setLastNDays] = useState("30");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [membersList, setMembersList] = useState<MemberAttendance[]>([]);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Load current settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiJson("/attendance/settings", { method: "GET" });

      if (response.success || response.officeStartTime) {
        const data = response.success ? response.data : response;
        setSettings(data);
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

  const handleSaveSettings = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date must be before end date");
      return;
    }

    setSaving(true);
    try {
      const response = await apiJson("/attendance/settings/date-range", {
        method: "POST",
        body: JSON.stringify({
          startDate,
          endDate,
          calculationMode,
          lastNDays: parseInt(lastNDays),
        }),
      });

      if (response.success || response.startDate) {
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Attendance Settings</h1>
          <p className="mt-2 text-gray-600">Configure attendance calculation date range</p>
        </div>

        {/* Settings Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Date Range Configuration
            </CardTitle>
            <CardDescription>Set the date range for calculating attendance percentages</CardDescription>
          </CardHeader>

          <CardContent className="pt-8 space-y-6">
            {/* Calculation Mode Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calculation-mode" className="text-sm font-semibold mb-2 block">
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
                  <Label htmlFor="last-n-days" className="text-sm font-semibold mb-2 block">
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

            {/* Date Range Inputs */}
            {calculationMode === "date-range" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div>
                  <Label htmlFor="start-date" className="text-sm font-semibold mb-2 block">
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
                  <Label htmlFor="end-date" className="text-sm font-semibold mb-2 block">
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

            {/* Current Settings Display */}
            {settings?.attendancePercentageStartDate && settings?.attendancePercentageEndDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900">Current Settings</p>
                    <p className="text-blue-700 mt-1">
                      Calculating attendance from{" "}
                      <span className="font-bold">
                        {format(new Date(settings.attendancePercentageStartDate), "PPP")}
                      </span>{" "}
                      to{" "}
                      <span className="font-bold">
                        {format(new Date(settings.attendancePercentageEndDate), "PPP")}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!settings?.attendancePercentageStartDate && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-900">No Date Range Set</p>
                    <p className="text-yellow-700 mt-1">Please set a date range to enable attendance percentage calculation.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t">
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center gap-2 flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Settings"}
              </Button>

              <Button
                onClick={handleViewMembersAttendance}
                variant="outline"
                className="flex items-center gap-2 flex-1"
              >
                <TrendingUp className="w-4 h-4" />
                View Members Attendance
              </Button>

              <Button
                onClick={handleResetSettings}
                disabled={saving}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">How it works</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="font-bold text-indigo-600">•</span>
                  Select a date range to calculate attendance percentage for all members
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-indigo-600">•</span>
                  Weekends are automatically excluded from the calculation
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-indigo-600">•</span>
                  Present, Late, and Half-day statuses count as present
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-indigo-600">•</span>
                  Click "View Members Attendance" to see the calculated percentages
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Members Attendance Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Members Attendance Report</DialogTitle>
            <DialogDescription>
              Attendance percentages for the selected date range
            </DialogDescription>
          </DialogHeader>

          {loadingMembers ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{member.memberName}</p>
                      <p className="text-xs text-gray-500">ID: {member.memberId}</p>
                    </div>
                    <Badge className={getStatusColor(member.status)}>{member.status}</Badge>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {member.presentDays} / {member.totalWorkingDays} days
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {member.attendancePercentage.toFixed(2)}%
                        </span>
                      </div>
                      <Progress
                        value={member.attendancePercentage}
                        className="h-2"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No attendance data available for the selected date range</p>
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
