import { useState, useEffect, useCallback, useRef, memo } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Save, LogOut, Mail, AlertCircle, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";

import { storage } from "@/lib/storage";
import { apiJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SettingsProps {
  onLogout?: () => void;
}

const SettingsComponent = function Settings({ onLogout }: SettingsProps) {
  const me = storage.getCurrentMember();
  const currentUser = storage
    .getUsers()
    .find((u) => u.memberId === me?.id);

  // Profile state
  const [fullName, setFullName] = useState(me?.name ?? "");
  const [email, setEmail] = useState("");
  const [emailUpdating, setEmailUpdating] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailStatus, setEmailStatus] = useState<{ hasEmail: boolean; isVerified: boolean; email?: string }>({ hasEmail: false, isVerified: false });
  const [loadingEmailStatus, setLoadingEmailStatus] = useState(true);
  const [sendingVerification, setSendingVerification] = useState(false);
  const profileSectionRef = useRef<HTMLDivElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Dialog state
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Load email status on component mount
  useEffect(() => {
    const loadEmailStatus = async () => {
      try {
        const response = await apiJson("/auth/check-email-status", {
          method: "GET",
        });

        if (response.success) {
          setEmailStatus(response.data);
        }
      } catch (err) {
        console.error("Failed to load email status", err);
      } finally {
        setLoadingEmailStatus(false);
      }
    };

    loadEmailStatus();
  }, []);

  const handleUpdateEmail = useCallback(async () => {
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!email.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const currentEmail = emailStatus.email?.trim().toLowerCase();
    if (emailStatus.hasEmail && currentEmail && currentEmail === normalizedEmail) {
      setEmailError("Enter a different email to change it.");
      return;
    }

    setEmailUpdating(true);
    setEmailError("");
    try {
      // Step 1: Update email
      const response = await apiJson("/auth/update-email", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (response.success) {
        setEmailStatus({ hasEmail: true, isVerified: false, email: normalizedEmail });
        setEmail("");
        
        // Step 2: Send verification email automatically
        try {
          const verifyResponse = await apiJson("/auth/send-verification", {
            method: "POST",
          });

          if (verifyResponse.success) {
            toast.success("Email added! Verification link sent to your email. Please check your inbox.");
          } else {
            toast.error(verifyResponse.error || "Email saved, but failed to send verification link.");
          }
        } catch (verifyErr) {
          const verifyMsg = verifyErr instanceof Error ? verifyErr.message : "Email saved, but failed to send verification link.";
          toast.error(verifyMsg);
        }
      } else {
        setEmailError(response.error || "Failed to update email");
        toast.error(response.error || "Failed to update email");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setEmailError(msg);
      toast.error(msg);
    } finally {
      setEmailUpdating(false);
    }
  }, [email, emailStatus.email, emailStatus.hasEmail]);

  const handleStartEmailChange = useCallback(() => {
    setEmail(emailStatus.email ?? "");
    setEmailError("");
    profileSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => emailInputRef.current?.focus(), 250);
  }, [emailStatus.email]);

  const handleSendVerificationEmail = useCallback(async () => {
    setSendingVerification(true);
    try {
      const response = await apiJson("/auth/send-verification", {
        method: "POST",
      });

      if (response.success) {
        toast.success("Verification email sent! Please check your inbox.");
      } else {
        toast.error(response.error || "Failed to send verification email");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      toast.error(msg);
    } finally {
      setSendingVerification(false);
    }
  }, []);

  const handleSaveProfile = useCallback(() => {
    if (!fullName.trim()) {
      toast.error("Name is required");
      return;
    }
    // Update member name
    const members = storage.getMembers();
    const updated = members.map((m) =>
      m.id === me?.id ? { ...m, name: fullName.trim() } : m
    );
    storage.setMembers(updated);
    toast.success("Profile updated successfully");
  }, [fullName, me?.id]);

  const handleChangePassword = useCallback(() => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // Note: In real app, verify currentPassword against server
    // For now, just show success
    const users = storage.getUsers();
    const updated = users.map((u) =>
      u.id === currentUser?.id ? { ...u, password: newPassword } : u
    );
    storage.setUsers(updated);

    toast.success("Password changed successfully");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangePasswordOpen(false);
  }, [currentPassword, newPassword, confirmPassword, currentUser?.id]);

  const handleLogout = useCallback(() => {
    storage.logout();
    if (onLogout) onLogout();
    toast.success("Logged out successfully");
  }, [onLogout]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h2 className="page-title mono-title">Settings</h2>
          <p className="page-subtitle mt-1">Manage your account and preferences</p>
        </div>
      </motion.div>

      {/* Profile Section */}
      <motion.div ref={profileSectionRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold">
                {me?.name.charAt(0).toUpperCase()}
              </div>
              Profile Settings
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullname" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Full Name
                </Label>
                <Input
                  id="fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Role
                </Label>
                <Input
                  id="role"
                  value={me?.role ?? "Unknown"}
                  disabled
                  className="rounded-lg bg-white/5 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Username
              </Label>
              <Input
                id="username"
                value={currentUser?.username ?? ""}
                disabled
                className="rounded-lg bg-white/5 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                ref={emailInputRef}
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                placeholder="your.email@example.com"
                className="rounded-lg"
                disabled={emailUpdating}
              />
              {emailError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-600"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {emailError}
                </motion.div>
              )}
              <p className="text-xs text-muted-foreground">We'll send a verification link to this email</p>
            </div>

            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button onClick={handleSaveProfile} className="rounded-lg gap-2">
                <Save className="h-4 w-4" />
                Save Profile
              </Button>
              <Button 
                onClick={handleUpdateEmail} 
                variant="outline" 
                className="rounded-lg gap-2"
                disabled={!email.trim() || emailUpdating}
              >
                <Mail className="h-4 w-4" />
                {emailUpdating ? "Sending..." : emailStatus.hasEmail ? "Change Email & Send Link" : "Add Email & Send Link"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your password and account security</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Verification
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Email is required for password reset and account recovery
              </p>

              {loadingEmailStatus ? (
                <div className="text-xs text-muted-foreground">Loading email status...</div>
              ) : emailStatus.hasEmail ? (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-lg mb-3 text-xs flex items-center gap-2",
                    emailStatus.isVerified
                      ? "bg-green-500/10 border border-green-500/30 text-green-600"
                      : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-600"
                  )}
                >
                  {emailStatus.isVerified ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      <span>✅ {emailStatus.email} - Verified</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>⚠️ {emailStatus.email} - Verification Pending</span>
                    </>
                  )}
                </motion.div>
              ) : (
                <div className="text-xs mb-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-blue-600">
                  💡 Add your email in the Profile section above to secure your account
                </div>
              )}

              {emailStatus.hasEmail && (
                <div className="flex flex-wrap gap-2">
                  {!emailStatus.isVerified && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSendVerificationEmail}
                      disabled={sendingVerification}
                      className="rounded-lg gap-2 text-xs"
                    >
                      <Send className="h-3 w-3" />
                      {sendingVerification ? "Sending..." : "Resend Verification Email"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartEmailChange}
                    className="rounded-lg gap-2 text-xs"
                  >
                    <Mail className="h-3 w-3" />
                    Change Email
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm font-medium mb-3">Password</p>
              <p className="text-xs text-muted-foreground mb-4">
                Last changed: Never
              </p>
              <Button
                variant="outline"
                onClick={() => setChangePasswordOpen(true)}
                className="rounded-lg"
              >
                Change Password
              </Button>
            </div>


          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="glass-card border-red-500/30 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-400">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm font-medium text-red-300 mb-2">Logout</p>
              <p className="text-xs text-red-200/80 mb-4">
                You will be logged out of all sessions
              </p>
              <Button
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/20 rounded-lg"
                onClick={() => setLogoutConfirmOpen(true)}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>

            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm font-medium text-red-300 mb-2">Delete Account</p>
              <p className="text-xs text-red-200/80 mb-4">
                Permanently delete your account and all data
              </p>
              <Button
                variant="outline"
                disabled
                className="border-red-500/50 text-red-400 hover:bg-red-500/20 rounded-lg opacity-50 cursor-not-allowed"
              >
                Delete Account (Admin Only)
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and set a new one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-lg pr-10"
                />
                <button
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                New Password
              </Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-lg pr-10"
                />
                <button
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-lg pr-10"
                />
                <button
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangePasswordOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button onClick={handleChangePassword} className="rounded-lg">
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout? You will need to login again to access your account.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLogoutConfirmOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setLogoutConfirmOpen(false);
                handleLogout();
              }}
              className="rounded-lg bg-red-500/80 hover:bg-red-600"
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(SettingsComponent);
