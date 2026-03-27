import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { storage } from "@/lib/storage";
import { AppLayout } from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Attendance from "@/pages/Attendance";
import WorkReports from "@/pages/WorkReports";
import Members from "@/pages/Members";
import Holidays from "@/pages/Holidays";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [loggedIn, setLoggedIn] = useState(storage.isLoggedIn());

  const handleLogin = () => {
    storage.login();
    setLoggedIn(true);
  };

  const handleLogout = () => {
    storage.logout();
    setLoggedIn(false);
  };

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
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/reports" element={<WorkReports />} />
              <Route path="/members" element={<Members />} />
              <Route path="/holidays" element={<Holidays />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
