import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface UndoAction {
  id: string;
  type: "delete" | "update" | "create" | "complete";
  label: string;
  timestamp: number;
  data: any;
  undo: () => Promise<void>;
}

interface UndoContextType {
  lastAction: UndoAction | null;
  setLastAction: (action: UndoAction | null) => void;
  clearLastAction: () => void;
}

const UndoContext = createContext<UndoContextType | undefined>(undefined);

export function UndoProvider({ children }: { children: ReactNode }) {
  const [lastAction, setLastActionInternal] = useState<UndoAction | null>(null);

  const setLastAction = useCallback((action: UndoAction | null) => {
    setLastActionInternal(action);
    // Auto-clear after 5 seconds
    if (action) {
      const timeout = setTimeout(() => {
        setLastActionInternal((prev) => (prev?.id === action.id ? null : prev));
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, []);

  const clearLastAction = useCallback(() => {
    setLastActionInternal(null);
  }, []);

  return (
    <UndoContext.Provider value={{ lastAction, setLastAction, clearLastAction }}>
      {children}
    </UndoContext.Provider>
  );
}

export function useUndo() {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error("useUndo must be used within UndoProvider");
  }
  return context;
}

/**
 * Helper to create an undo action
 * Usage: createUndoAction('delete', 'Task deleted', taskData, async () => { ... undo logic ... })
 */
export function createUndoAction(
  type: UndoAction["type"],
  label: string,
  data: any,
  undoFn: () => Promise<void>
): UndoAction {
  return {
    id: `${type}-${Date.now()}`,
    type,
    label,
    timestamp: Date.now(),
    data,
    undo: undoFn,
  };
}
