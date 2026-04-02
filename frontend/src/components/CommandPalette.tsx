import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, Home, Zap, Archive, Command } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();

  const commands: CommandItem[] = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      description: "View your dashboard overview",
      icon: <Home className="h-4 w-4" />,
      category: "Navigation",
      action: () => {
        navigate("/");
        setOpen(false);
      },
    },
    {
      id: "mywork",
      label: "Go to My Work",
      description: "View your personal tasks",
      icon: <Zap className="h-4 w-4" />,
      category: "Navigation",
      action: () => {
        navigate("/my-work");
        setOpen(false);
      },
    },
    {
      id: "tasks",
      label: "Go to Tasks",
      description: "View all tasks and board",
      icon: <FileText className="h-4 w-4" />,
      category: "Navigation",
      action: () => {
        navigate("/tasks");
        setOpen(false);
      },
    },
    {
      id: "board",
      label: "Go to Board",
      description: "View Kanban board",
      icon: <Archive className="h-4 w-4" />,
      category: "Navigation",
      action: () => {
        navigate("/board");
        setOpen(false);
      },
    },
    {
      id: "create-task",
      label: "Create Task",
      description: "Create a new task",
      icon: <FileText className="h-4 w-4" />,
      category: "Actions",
      action: () => {
        toast.info("Task creation feature coming soon");
        setOpen(false);
      },
    },
    {
      id: "search-tasks",
      label: "Search Tasks",
      description: "Search across all tasks",
      icon: <Search className="h-4 w-4" />,
      category: "Search",
      action: () => {
        toast.info("Advanced search coming soon");
        setOpen(false);
      },
    },
  ];

  const filtered = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
        setSearch("");
        setSelected(0);
      }

      if (!open) return;

      switch (e.key) {
        case "Escape":
          setOpen(false);
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelected((prev) => (prev + 1) % (filtered.length || 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelected((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
          break;
        case "Enter":
          e.preventDefault();
          if (filtered[selected]) {
            filtered[selected].action();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, search, filtered, selected]);

  return (
    <>
      {/* Command Palette Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl"
          >
            <div className="rounded-2xl border border-white/20 bg-gradient-to-b from-white/10 to-white/5 shadow-2xl backdrop-blur-xl overflow-hidden">
              {/* Search Input */}
              <div className="border-b border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <Command className="h-5 w-5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setSelected(0);
                    }}
                    placeholder="Type a command or search..."
                    className="border-0 bg-transparent placeholder:text-muted-foreground/60 focus:outline-none"
                  />
                </div>
              </div>

              {/* Commands List */}
              <div className="max-h-96 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">No commands found</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filtered.map((cmd, idx) => (
                      <motion.button
                        key={cmd.id}
                        onClick={() => cmd.action()}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-start gap-3",
                          selected === idx
                            ? "bg-white/15 border border-white/20"
                            : "hover:bg-white/10"
                        )}
                      >
                        <div className="text-primary mt-0.5">{cmd.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{cmd.label}</p>
                          <p className="text-xs text-muted-foreground">{cmd.description}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground/70">
                  {filtered.length} command{filtered.length !== 1 ? "s" : ""} available
                </p>
                <div className="flex gap-2 text-xs text-muted-foreground/70">
                  <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">↑↓</kbd>
                  <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">Enter</kbd>
                  <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">Esc</kbd>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Hint (hidden) */}
      {!open && (
        <motion.button
          onClick={() => setOpen(true)}
          className="hidden fixed top-4 right-4 z-40 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 transition-colors flex items-center gap-2 text-sm"
          whileHover={{ scale: 1.05 }}
        >
          <Command className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-muted-foreground">Ctrl + K</span>
        </motion.button>
      )}
    </>
  );
}
