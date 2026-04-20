import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, AlertCircle } from "lucide-react";
import logoImg from "@/assets/RISE WITH MEDIA - LOGO.png";
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const readField = (field: string, fallback: string) => {
      const raw = formData.get(field);
      return typeof raw === "string" ? raw : fallback;
    };

    // Read from form first to avoid browser autofill/state mismatch issues
    const submittedName = readField("name", name).trim();
    const submittedEmail = readField("email", email).trim();
    const submittedUsername = readField("username", username).trim();
    const submittedPassword = readField("password", password);

    if (mode === "register") {
      // Enhanced validation with specific error messages
      if (!submittedName) {
        setError("Name is required.");
        setErrorCode(null);
        return;
      }
      if (!submittedUsername) {
        setError("Username is required.");
        setErrorCode(null);
        return;
      }
      if (!submittedEmail) {
        setError("Email is required.");
        setErrorCode(null);
        return;
      }
      if (!submittedEmail.includes("@") || !submittedEmail.includes(".")) {
        setError("Please enter a valid email address.");
        setErrorCode(null);
        return;
      }
      if (!submittedPassword.trim()) {
        setError("Password is required.");
        setErrorCode(null);
        return;
      }
      if (submittedPassword.length < 8) {
        setError("Password must be at least 8 characters long.");
        setErrorCode(null);
        return;
      }
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(submittedPassword)) {
        setError("Password must include uppercase, lowercase, number, and special character.");
        setErrorCode(null);
        return;
      }
      
      const u = submittedUsername.toLowerCase();
      setName(submittedName);
      setEmail(submittedEmail);
      setUsername(submittedUsername);
      setPassword(submittedPassword);

      // Debug logging
      console.log("Registering user:", {
        name: submittedName,
        username: u,
        email: submittedEmail,
        passwordLength: submittedPassword.length,
        role
      });

      if (useApiBackend) {
        setIsLoading(true);
        setError("");
        setErrorCode(null);
        try {
          await apiJson("/auth/register", {
            method: "POST",
            body: JSON.stringify({ 
              username: u, 
              email: submittedEmail, 
              password: submittedPassword, 
              name: submittedName,
              role,
              memberId: `member_${Date.now()}` 
            }),
          });
          toast.success("Registration successful! Please check your email to verify your account.");
          setMode("login");
          setName("");
          setPassword("");
          setUsername("");
          setEmail("");
        } catch (err) {
          console.error("Registration error:", err);
          const msg = err instanceof Error ? err.message : "Request failed.";
          if (msg.includes("Username taken")) {
            setError("Username is already taken.");
          } else if (msg.includes("Email already exists")) {
            setError("Email already registered.");
          } else if (msg.includes("Name is required")) {
            setError("Name is required.");
          } else if (msg.includes("Email is required")) {
            setError("Email is required.");
          } else if (msg.includes("Password is required")) {
            setError("Password is required.");
          } else {
            setError(msg);
          }
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
        { id: generateId(), name: submittedName, username: u, password: submittedPassword, role, createdAt: Date.now() },
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
      setUsername(submittedUsername);
      setPassword(submittedPassword);
      const ok = await storage.login(submittedUsername.toLowerCase(), submittedPassword);
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
    <div className="min-h-screen bg-neutral-50 p-3 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1160px] items-center justify-center md:min-h-[calc(100vh-3rem)]">
        <div className="app-shell mx-auto w-full max-w-[1160px] overflow-hidden">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="hidden border-r border-neutral-200 bg-white lg:flex lg:flex-col lg:justify-center lg:gap-10 lg:p-12 xl:p-16">
              <div className="flex items-center gap-3">
                <img src={logoImg} alt="Rise With Media" className="h-12 w-12 rounded-2xl object-cover" />
                <div>
                  <p className="text-sm font-bold text-foreground">Rise With Media</p>
                  <p className="text-xs text-muted-foreground">Management Platform</p>
                </div>
              </div>

              <div className="space-y-5">
                <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600">
                  Fast Workspace
                </span>
                <h1 className="text-5xl font-bold leading-tight text-foreground xl:text-6xl">
                  Rise With
                  <br />
                  Media.
                </h1>
                <p className="max-w-md text-base leading-7 text-muted-foreground">
                  Manage attendance, tasks, and performance in a clean workspace.
                </p>
              </div>
            </div>

            <div className="flex w-full items-center justify-center bg-white p-6 md:p-10 lg:p-12">
              <div className="w-full max-w-sm">
                <div className="mb-8 text-center lg:hidden">
                  <img src={logoImg} alt="Rise With Media" className="mx-auto mb-4 h-16 w-16 rounded-2xl" />
                  <h1 className="mb-1 text-3xl font-bold text-foreground">Rise With Media</h1>
                  <p className="text-sm text-muted-foreground">Management Platform</p>
                </div>

                <div className="rounded-3xl border border-neutral-200 bg-white p-8 md:p-10">
                  <div className="mb-7 text-center">
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-500">
                      {mode === "login" ? "Sign In" : "Create Account"}
                    </p>
                    <h2 className="text-3xl font-bold text-foreground">
                      {mode === "login" ? "Welcome Back" : "Get Started"}
                    </h2>
                  </div>

                  <div className="mb-7 flex rounded-xl border border-neutral-200 bg-neutral-100 p-1">
                    {(["login", "register"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                          mode === m ? "bg-white text-foreground" : "text-neutral-500"
                        }`}
                      >
                        {m === "login" ? "Login" : "Register"}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "register" && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Full Name</Label>
                          <Input
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            autoComplete="name"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Email</Label>
                          <Input
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            autoComplete="email"
                            autoCapitalize="none"
                            autoCorrect="off"
                            disabled={isLoading}
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                        <Input
                          name="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder={mode === "login" ? "admin" : "johndoe"}
                          autoComplete="username"
                          autoCapitalize="none"
                          autoCorrect="off"
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                        <Input
                          name="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="........"
                          autoComplete={mode === "login" ? "current-password" : "new-password"}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {mode === "register" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Role</Label>
                        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                          <SelectTrigger className="h-11 border-neutral-200 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Intern">Intern</SelectItem>
                            <SelectItem value="Employee">Employee</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {error && (
                      <div
                        className={`rounded-xl border p-4 text-sm ${
                          errorCode === "EMAIL_NOT_SET_UP"
                            ? "border-red-200 bg-red-50 text-red-900"
                            : "border-neutral-200 bg-neutral-50 text-neutral-900"
                        }`}
                      >
                        <div className="flex gap-2">
                          {errorCode === "EMAIL_NOT_SET_UP" && (
                            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-700" />
                          )}
                          <div>
                            <p className="mb-1 font-semibold">
                              {errorCode === "EMAIL_NOT_SET_UP" ? "Email Not Configured" : "Error"}
                            </p>
                            <p className="text-xs opacity-90">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-1">
                      <Button type="submit" className="h-11 w-full text-sm font-bold" disabled={isLoading}>
                        {isLoading ? (mode === "login" ? "Signing in..." : "Creating...") : mode === "login" ? "Sign In" : "Request Access"}
                      </Button>
                    </div>
                  </form>

                  <div className="mt-6 space-y-2 border-t border-neutral-200 pt-5 text-center text-xs text-neutral-500">
                    <p>Secure authentication enabled</p>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => onForgotPassword?.()}
                        className="block w-full text-xs font-semibold text-neutral-600 hover:underline"
                      >
                        Forgot your password?
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
