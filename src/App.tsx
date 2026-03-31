import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getToken } from "@/lib/api";
import { storage, useApiBackend } from "@/lib/storage";
import { AppLayout } from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Attendance from "@/pages/Attendance";
import WorkReports from "@/pages/WorkReports";
import Members from "@/pages/Members";
import Holidays from "@/pages/Holidays";
import Tasks from "@/pages/Tasks";
import Board from "@/pages/Board";
import Performance from "@/pages/Performance";
import NotFound from "@/pages/NotFound";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
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
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/reports" element={<WorkReports />} />
          <Route path="/members" element={<Members />} />
          <Route path="/holidays" element={<Holidays />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => {
  const [ready, setReady] = useState(!useApiBackend);
  const [loggedIn, setLoggedIn] = useState(() => !useApiBackend && storage.isLoggedIn());

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
      <TooltipProvider>
        <Login onLogin={handleLogin} />
        <Toaster />
        <Sonner />
      </TooltipProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout onLogout={handleLogout}>
            <AnimatedRoutes />
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
