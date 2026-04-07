import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getToken } from "@/lib/api";
import { storage, useApiBackend } from "@/lib/storage";
import { AppLayout } from "@/components/AppLayout";
import { CommandPalette } from "@/components/CommandPalette";
import { UndoProvider } from "@/lib/undo";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";
import Dashboard from "@/pages/Dashboard";
import Attendance from "@/pages/Attendance";
import WorkReports from "@/pages/WorkReports";
import Members from "@/pages/Members";
import Holidays from "@/pages/Holidays";
import Tasks from "@/pages/Tasks";
import MyWork from "@/pages/MyWork";
import Settings from "@/pages/Settings";
import Board from "@/pages/Board";
import Performance from "@/pages/Performance";
import FocusMode from "@/pages/FocusMode";
import NotFound from "@/pages/NotFound";
import { ListView } from "@/pages/ListView";
import { CalendarView } from "@/pages/CalendarView";
import { ActivityTimeline } from "@/pages/ActivityTimeline";
import { DailyStatusUpdate } from "@/pages/DailyStatus";
import { AdminReviewDashboard } from "@/pages/AdminReview";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  const role = storage.getCurrentRole();
  
  // Check if we're in focus mode
  const isFocusMode = location.pathname.startsWith("/focus");
  
  if (isFocusMode) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Routes location={location}>
            <Route path="/focus/:taskId" element={<FocusMode />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/board" element={<Board />} />
          <Route path="/list" element={<ListView />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/activity" element={<ActivityTimeline />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/my-work" element={role === "Admin" ? <Navigate to="/board" replace /> : <MyWork />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reports" element={<WorkReports />} />
          <Route path="/members" element={<Members />} />
          <Route path="/holidays" element={<Holidays />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/daily-status" element={<DailyStatusUpdate />} />
          <Route path="/admin-review" element={<AdminReviewDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => {
  const [ready, setReady] = useState(!useApiBackend);
  const [loggedIn, setLoggedIn] = useState(() => !useApiBackend && storage.isLoggedIn());
  const [authPage, setAuthPage] = useState<"login" | "forgot" | "reset">("login");
  const [resetToken, setResetToken] = useState<string | undefined>();

  useEffect(() => {
    // Check URL for password reset token
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setAuthPage("reset");
      setResetToken(token);
    }
  }, []);

  useEffect(() => {
    if (!useApiBackend) return;
    let cancelled = false;
    (async () => {
      if (getToken()) {
        try {
          await storage.hydrate();
          if (!cancelled) setLoggedIn(storage.isLoggedIn());
        } catch {
          storage.logout();
          if (!cancelled) setLoggedIn(false);
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = () => {
    setLoggedIn(true);
  };

  const handleLogout = () => {
    storage.logout();
    setLoggedIn(false);
  };

  const handleForgotPassword = () => {
    setAuthPage("forgot");
  };

  const handleBackToLogin = () => {
    setAuthPage("login");
    setResetToken(undefined);
  };

  const handleResetSuccess = () => {
    setAuthPage("login");
    setResetToken(undefined);
  };

  if (!ready) {
    return (
      <TooltipProvider>
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Connecting to server…</p>
        </div>
      </TooltipProvider>
    );
  }

  if (!loggedIn) {
    return (
      <BrowserRouter>
        <TooltipProvider>
          {authPage === "login" && <Login onLogin={handleLogin} onForgotPassword={handleForgotPassword} />}
          {authPage === "forgot" && <ForgotPassword onBack={handleBackToLogin} />}
          {authPage === "reset" && <ResetPassword token={resetToken} onBack={handleBackToLogin} onSuccess={handleResetSuccess} />}
          <Routes>
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Routes>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </BrowserRouter>
    );
  }

  return (
    <UndoProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CommandPalette />
            <AppLayoutWithFocusMode onLogout={handleLogout} />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </UndoProvider>
  );
};

function AppLayoutWithFocusMode({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const isFocusMode = location.pathname.startsWith("/focus");

  if (isFocusMode) {
    return <AnimatedRoutes />;
  }

  return (
    <AppLayout onLogout={onLogout}>
      <AnimatedRoutes />
    </AppLayout>
  );
}

export default App;
