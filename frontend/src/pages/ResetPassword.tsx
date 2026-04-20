import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
import logoImg from "@/assets/RISE WITH MEDIA - LOGO.png";
import { apiJson } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  token?: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function ResetPassword({ token, onBack, onSuccess }: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError(true);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Both password fields are required");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await apiJson("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });

      if (response.success) {
        setSuccess(true);
        toast.success("Password reset successfully!");
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(response.error || "Failed to reset password");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="min-h-screen p-3 md:p-6 flex items-center justify-center">
        <div className="app-scene mx-auto max-w-[1320px] min-h-[calc(100vh-1.5rem)] md:min-h-[calc(100vh-3rem)] flex items-center justify-center">
          <div className="app-bubble light h-24 w-24 left-1 top-20 md:h-36 md:w-36 md:left-8" />
          <div className="app-bubble dark h-24 w-24 left-0 bottom-16 md:h-32 md:w-32 md:left-4" />
          <div className="app-bubble dark h-24 w-24 right-16 top-8 md:h-28 md:w-28 md:right-24" />
          <div className="app-bubble light h-24 w-24 right-2 bottom-14 md:h-36 md:w-36 md:right-8" />

          <div className="app-shell w-full overflow-hidden max-w-md">
            <div className="glass-card rounded-3xl p-8 md:p-10 text-center">
              <h2 className="text-2xl font-bold mb-4">Invalid Reset Link</h2>
              <p className="text-muted-foreground mb-6">
                The password reset link is invalid or has expired. Please request a new one.
              </p>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2"
                style={{ color: "rgba(0,0,0,0.58)" }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-6">
      <div className="app-scene mx-auto max-w-[1320px] min-h-[calc(100vh-1.5rem)] md:min-h-[calc(100vh-3rem)] flex items-center justify-center">
        <div className="app-bubble light h-24 w-24 left-1 top-20 md:h-36 md:w-36 md:left-8" />
        <div className="app-bubble dark h-24 w-24 left-0 bottom-16 md:h-32 md:w-32 md:left-4" />
        <div className="app-bubble dark h-24 w-24 right-16 top-8 md:h-28 md:w-28 md:right-24" />
        <div className="app-bubble light h-24 w-24 right-2 bottom-14 md:h-36 md:w-36 md:right-8" />

        <div className="app-shell w-full overflow-hidden">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="hidden lg:flex flex-col justify-between p-12 xl:p-14 relative border-r border-white/45">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10"
              >
                <div className="flex items-center gap-3 mb-12">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl blur-lg" style={{ background: "rgba(24, 32, 46, 0.2)" }} />
                    <img
                      src={logoImg}
                      alt="Rise With Media"
                      className="h-12 w-12 rounded-2xl object-cover relative"
                      style={{ boxShadow: "0 6px 20px rgba(21, 27, 39, 0.25)" }}
                    />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">Rise With Media</p>
                    <p className="text-xs text-muted-foreground">Management Platform</p>
                  </div>
                </div>

                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8"
                  style={{
                    background: "rgba(247, 250, 255, 0.48)",
                    border: "1px solid rgba(255,255,255,0.65)",
                    color: "rgba(34,44,59,0.75)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
                  }}
                >
                  <Sparkles className="h-3 w-3" />
                  Minimal Workspace
                </div>

                <h1 className="text-6xl xl:text-7xl font-bold leading-[0.95] mb-6 mono-title">
                  Create New
                  <br />
                  Password.
                </h1>
                <p className="text-lg leading-relaxed max-w-md text-muted-foreground">
                  Enter a strong, unique password to secure your account.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="relative z-10"
              >
                <div className="h-px mb-6" style={{ background: "linear-gradient(90deg, transparent, rgba(86,99,120,0.3), transparent)" }} />
                <p className="text-sm font-semibold text-muted-foreground">Strong password tips:</p>
                <p className="text-xs mt-1 text-black/45">At least 8 characters with mixed case, numbers, and symbols.</p>
              </motion.div>
            </div>

            <div className="w-full flex items-center justify-center p-6 md:p-10 lg:p-12">
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-sm"
              >
                <motion.div className="lg:hidden mb-8 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-block mb-4"
                  >
                    <img
                      src={logoImg}
                      alt="Rise With Media"
                      className="h-16 w-16 rounded-2xl mx-auto"
                      style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
                    />
                  </motion.div>
                  <h1 className="text-4xl font-bold mb-1 mono-title">Rise With Media</h1>
                  <p className="text-sm text-muted-foreground">Management Platform</p>
                </motion.div>

                <div className="glass-card rounded-3xl p-8 md:p-10">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-7 text-center"
                  >
                    <p className="text-xs font-bold tracking-widest uppercase mb-2 text-black/55">Create New Password</p>
                    <h2 className="text-3xl font-bold text-foreground">Set Password</h2>
                  </motion.div>

                  {!success ? (
                    <>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="space-y-1.5"
                        >
                          <Label className="text-xs font-bold tracking-widest uppercase text-black/55">
                            New Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-black/55" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="••••••••"
                              className="pl-10 pr-10"
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-3.5 text-black/55 hover:text-black/75"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 }}
                          className="space-y-1.5"
                        >
                          <Label className="text-xs font-bold tracking-widest uppercase text-black/55">
                            Confirm Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-black/55" />
                            <Input
                              type={showConfirm ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              className="pl-10 pr-10"
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirm(!showConfirm)}
                              className="absolute right-3.5 top-3.5 text-black/55 hover:text-black/75"
                            >
                              {showConfirm ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </motion.div>

                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm rounded-xl p-3"
                            style={{
                              color: "#111111",
                              background: "rgba(0,0,0,0.08)",
                              border: "1px solid rgba(0,0,0,0.16)",
                            }}
                          >
                            {error}
                          </motion.div>
                        )}

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="pt-1"
                        >
                          <Button type="submit" className="w-full h-11 text-sm font-bold" disabled={isLoading}>
                            {isLoading ? (
                              <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                                Resetting...
                              </motion.span>
                            ) : (
                              "Reset Password"
                            )}
                          </Button>
                        </motion.div>
                      </form>

                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        onClick={onBack}
                        className="mt-6 w-full flex items-center justify-center gap-2 text-sm font-semibold"
                        style={{ color: "rgba(0,0,0,0.58)" }}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Login
                      </motion.button>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-6 pt-5 border-t text-center text-xs"
                        style={{ borderColor: "rgba(0,0,0,0.1)", color: "rgba(0,0,0,0.58)" }}
                      >
                        Your password will be updated immediately after reset.
                      </motion.div>
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4 text-center"
                    >
                      <div
                        className="inline-flex items-center justify-center h-16 w-16 rounded-full mb-4"
                        style={{ background: "rgba(34, 197, 94, 0.1)" }}
                      >
                        <Lock className="h-8 w-8" style={{ color: "#22c55e" }} />
                      </div>
                      <h3 className="text-lg font-bold">Password Reset Successful!</h3>
                      <p className="text-sm text-muted-foreground">
                        Your password has been updated. You can now log in with your new password.
                      </p>
                      <p className="text-xs text-black/45">Redirecting to login...</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
