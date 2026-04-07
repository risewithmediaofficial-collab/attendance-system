import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Lock, User, Sparkles, AlertCircle } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { apiJson } from "@/lib/api";
import { storage, type Role, generateId, useApiBackend } from "@/lib/storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  onLogin: () => void;
  onForgotPassword?: () => void;
}

export default function Login({ onLogin, onForgotPassword }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("Intern");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "register") {
      if (!name.trim() || !username.trim() || !password.trim() || !email.trim()) {
        setError("All fields are required.");
        setErrorCode(null);
        return;
      }
      if (!email.includes("@")) {
        setError("Please enter a valid email address.");
        setErrorCode(null);
        return;
      }
      const u = username.trim().toLowerCase();

      if (useApiBackend) {
        setIsLoading(true);
        setError("");
        setErrorCode(null);
        try {
          await apiJson("/auth/register", {
            method: "POST",
            body: JSON.stringify({ username: u, email: email.trim(), password, memberId: `member_${Date.now()}` }),
          });
          toast.success("Registration successful! Please check your email to verify your account.");
          setMode("login");
          setName("");
          setPassword("");
          setUsername("");
          setEmail("");
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Request failed.";
          setError(msg === "Username taken" ? "Username is already taken." : msg === "Email already exists" ? "Email already registered." : msg);
          setErrorCode(null);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      const existingUsers = storage.getUsers();
      const existingPending = storage.getPendingUsers();
      if (
        existingUsers.some((user) => user.username.toLowerCase() === u) ||
        existingPending.some((p) => p.username.toLowerCase() === u)
      ) {
        setError("Username is already taken.");
        return;
      }

      const pending = storage.getPendingUsers();
      storage.setPendingUsers([
        ...pending,
        { id: generateId(), name: name.trim(), username: u, password, role, createdAt: Date.now() },
      ]);
      toast.success("Account request submitted. Waiting for admin approval.");
      setMode("login");
      setName("");
      setPassword("");
      setUsername("");
      setError("");
      return;
    }

    setIsLoading(true);
    setError("");
    setErrorCode(null);
    try {
      const ok = await storage.login(username.trim().toLowerCase(), password);
      if (ok) {
        onLogin();
      } else {
        setError("Invalid credentials.");
        setErrorCode(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed.";
      if (msg.includes("EMAIL_NOT_SET_UP")) {
        setErrorCode("EMAIL_NOT_SET_UP");
        setError("Your account does not have an email address set. Please contact your administrator to add an email to your account.");
      } else {
        setErrorCode(null);
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
                  Rise With
                  <br />
                  Media.
                </h1>
                <p className="text-lg leading-relaxed max-w-md text-muted-foreground">
                  Manage attendance, tasks, and performance in a clean glass workspace inspired by neumorphic depth.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="relative z-10"
              >
                <div className="h-px mb-6" style={{ background: "linear-gradient(90deg, transparent, rgba(86,99,120,0.3), transparent)" }} />
                <p className="text-sm font-semibold text-muted-foreground">Demo: admin / admin123</p>
                <p className="text-xs mt-1 text-black/45">employee / employee123 - intern / intern123</p>
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
              <p className="text-xs font-bold tracking-widest uppercase mb-2 text-black/55">
                {mode === "login" ? "Sign In" : "Create Account"}
              </p>
              <h2 className="text-3xl font-bold text-foreground">
                {mode === "login" ? "Welcome Back" : "Get Started"}
              </h2>
            </motion.div>

            <div
              className="flex rounded-xl p-1 mb-7"
              style={{ background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.12)" }}
            >
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                  style={
                    mode === m
                      ? {
                          background: "linear-gradient(135deg,#111111,#4b5563)",
                          color: "#fff",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.28)",
                        }
                      : { color: "rgba(0,0,0,0.58)" }
                  }
                >
                  {m === "login" ? "Login" : "Register"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-1.5"
                  >
                    <Label className="text-xs font-bold tracking-widest uppercase text-black/55">Full Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      disabled={isLoading}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.27 }}
                    className="space-y-1.5"
                  >
                    <Label className="text-xs font-bold tracking-widest uppercase text-black/55">Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      disabled={isLoading}
                    />
                  </motion.div>
                </>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-1.5"
              >
                <Label className="text-xs font-bold tracking-widest uppercase text-black/55">Username</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-black/55" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={mode === "login" ? "admin" : "johndoe"}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-1.5"
              >
                <Label className="text-xs font-bold tracking-widest uppercase text-black/55">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-black/55" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="........"
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </motion.div>

              {mode === "register" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-1.5"
                >
                  <Label className="text-xs font-bold tracking-widest uppercase text-black/55">Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                    <SelectTrigger className="h-11 bg-white/75 border-black/12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Intern">Intern</SelectItem>
                      <SelectItem value="Employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm rounded-xl p-4"
                  style={{
                    color: errorCode === 'EMAIL_NOT_SET_UP' ? "#991b1b" : "#111111",
                    background: errorCode === 'EMAIL_NOT_SET_UP' ? "rgba(239, 68, 68, 0.1)" : "rgba(0,0,0,0.08)",
                    border: errorCode === 'EMAIL_NOT_SET_UP' ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(0,0,0,0.16)",
                  }}
                >
                  <div className="flex gap-2">
                    {errorCode === 'EMAIL_NOT_SET_UP' && (
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#991b1b" }} />
                    )}
                    <div>
                      <p className="font-semibold mb-1">{errorCode === 'EMAIL_NOT_SET_UP' ? '⚠️ Email Not Configured' : 'Error'}</p>
                      <p className="text-xs opacity-90">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="pt-1"
              >
                <Button type="submit" className="w-full h-11 text-sm font-bold" disabled={isLoading}>
                  {isLoading ? (
                    <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                      {mode === "login" ? "Signing in..." : "Creating..."}
                    </motion.span>
                  ) : mode === "login" ? "Sign In" : "Request Access"}
                </Button>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="mt-6 pt-5 border-t text-center text-xs space-y-2"
              style={{ borderColor: "rgba(0,0,0,0.1)", color: "rgba(0,0,0,0.58)" }}
            >
              <p>Secure authentication enabled</p>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => onForgotPassword?.()}
                  className="block w-full text-xs font-semibold hover:underline"
                  style={{ color: "rgba(0,0,0,0.58)" }}
                >
                  Forgot your password?
                </button>
              )}
            </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
