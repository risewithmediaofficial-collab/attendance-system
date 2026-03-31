import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Lock, User, Sparkles } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { apiJson } from "@/lib/api";
import { storage, type Role, generateId, useApiBackend } from "@/lib/storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("Intern");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "register") {
      if (!name.trim() || !username.trim() || !password.trim()) {
        setError("All fields are required.");
        return;
      }
      const u = username.trim().toLowerCase();

      if (useApiBackend) {
        setIsLoading(true);
        setError("");
        try {
          await apiJson("/auth/register", {
            method: "POST",
            body: JSON.stringify({ name: name.trim(), username: u, password, role }),
          });
          toast.success("Account request submitted. Waiting for admin approval.");
          setMode("login");
          setName("");
          setPassword("");
          setUsername("");
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Request failed.";
          setError(msg === "Username taken" ? "Username is already taken." : msg);
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
    try {
      const ok = await storage.login(username.trim().toLowerCase(), password);
      if (ok) {
        onLogin();
      } else {
        setError("Invalid credentials.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ background: "linear-gradient(160deg, #ffffff 0%, #f4f4f5 52%, #e8e8ea 100%)" }}
    >
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(243,243,245,0.94) 100%)",
          borderRight: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div
          className="absolute top-16 right-10 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,0,0,0.12), transparent)", filter: "blur(60px)" }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,0,0,0.08), transparent)", filter: "blur(70px)" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-3 mb-14">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-lg" style={{ background: "rgba(0,0,0,0.24)" }} />
              <img
                src={logoImg}
                alt="Rise With Media"
                className="h-12 w-12 rounded-2xl object-cover relative"
                style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.3)" }}
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
              background: "rgba(0,0,0,0.07)",
              border: "1px solid rgba(0,0,0,0.18)",
              color: "rgba(0,0,0,0.75)",
            }}
          >
            <Sparkles className="h-3 w-3" />
            Minimal Workspace
          </div>

          <h1 className="text-6xl xl:text-7xl font-bold leading-tight mb-6 mono-title">
            Rise With
            <br />
            Media.
          </h1>
          <p className="text-lg leading-relaxed max-w-md text-muted-foreground">
            Manage attendance, tasks, and performance in a clean black-and-white glassmorphism workspace.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10"
        >
          <div className="h-px mb-6" style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.24), transparent)" }} />
          <p className="text-sm font-semibold text-muted-foreground">Demo: admin / admin123</p>
          <p className="text-xs mt-1 text-black/45">employee / employee123 - intern / intern123</p>
        </motion.div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          <motion.div className="lg:hidden mb-10 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-block mb-5"
            >
              <img
                src={logoImg}
                alt="Rise With Media"
                className="h-16 w-16 rounded-2xl mx-auto"
                style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.24)" }}
              />
            </motion.div>
            <h1 className="text-4xl font-bold mb-1 mono-title">Rise With Media</h1>
            <p className="text-sm text-muted-foreground">Management Platform</p>
          </motion.div>

          <div
            className="rounded-3xl p-8 md:p-10"
            style={{
              background: "rgba(255,255,255,0.76)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: "1px solid rgba(255,255,255,0.58)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.05), 0 0 0 1px rgba(255,255,255,0.8) inset",
            }}
          >
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
              className="mt-6 pt-5 border-t text-center text-xs"
              style={{ borderColor: "rgba(0,0,0,0.1)", color: "rgba(0,0,0,0.58)" }}
            >
              Secure authentication enabled
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
