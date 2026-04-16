/**
 * COMPOSITE HOOKS - Reusable logic for forms, tables, and common patterns
 */

import { useState, useCallback, useMemo } from 'react';
import { storage, type Task, type Member, type User } from '@/lib/storage';

/**
 * useForm - Manages form state with validation
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => void | Promise<void>
) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = useCallback((field: keyof T, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
        setIsDirty(false);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onSubmit]
  );

  const reset = useCallback(() => {
    setFormData(initialValues);
    setErrors({});
    setIsDirty(false);
  }, [initialValues]);

  const setError = useCallback((field: keyof T, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    isDirty,
    handleChange,
    handleSubmit,
    reset,
    setError,
    setFormData,
  };
}

/**
 * useTable - Manages table state (sorting, filtering, pagination)
 */
export function useTable<T extends Record<string, any>>(
  data: T[],
  {
    initialSort = { key: 'id', direction: 'asc' as const },
    itemsPerPage = 10,
  } = {}
) {
  const [sortKey, setSortKey] = useState<string | null>(initialSort.key);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSort.direction);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDirection]);

  const filteredData = useMemo(() => {
    return sortedData.filter((item) => {
      // Apply search across all string fields
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = Object.values(item).some((val) =>
          String(val).toLowerCase().includes(query)
        );
        if (!matches) return false;
      }

      // Apply specific filters
      for (const [key, value] of Object.entries(filters)) {
        if (value && item[key] !== value) return false;
      }

      return true;
    });
  }, [sortedData, searchQuery, filters]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  }, [sortKey]);

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? null : value,
    }));
    setCurrentPage(1);
  }, []);

  return {
    data: paginatedData,
    allData: filteredData,
    totalItems: filteredData.length,
    totalPages,
    currentPage,
    setCurrentPage,
    sortKey,
    sortDirection,
    handleSort,
    searchQuery,
    setSearchQuery,
    filters,
    handleFilterChange,
  };
}

/**
 * useDialog - Manages dialog open/close state
 */
export function useDialog(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}

/**
 * useAllMembers - Get all accessible members based on role
 */
export function useAllMembers() {
  const role = storage.getCurrentRole();
  const currentMember = storage.getCurrentMember();
  const allMembers = storage.getMembers();

  return useMemo(() => {
    // Admins see all members
    if (role === 'Admin') return allMembers;
    
    // Non-admins only see themselves
    return currentMember ? [currentMember] : [];
  }, [role, currentMember, allMembers]);
}

/**
 * useFilteredTasks - Get tasks based on current user role with data isolation
 */
export function useFilteredTasks(tasks: Task[] = []) {
  const role = storage.getCurrentRole();
  const currentMember = storage.getCurrentMember();
  const taskList = tasks.length > 0 ? tasks : storage.getTasks() || [];

  return useMemo(() => {
    // Admins see all tasks
    if (role === 'Admin') return taskList;
    
    // Non-admins only see their own tasks
    if (!currentMember) return [];
    
    return taskList.filter((t) => {
      const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
      return assignees.includes(currentMember.id);
    });
  }, [role, currentMember, taskList]);
}

/**
 * useAsync - Handle async operations with loading/error states
 */
export function useAsync<T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setValue(null);
    setError(null);
    try {
      const response = await asyncFunction();
      setValue(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error as E);
      setStatus('error');
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      void execute();
    }
  }, [execute, immediate]);

  return { execute, status, value, error };
}

/**
 * usePrevious - Get previous value of a prop/state
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// Re-export for convenience
import { useEffect, useRef } from 'react';
export type { Task, Member, User };
