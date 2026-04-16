/**
 * TABLE WRAPPER COMPONENTS
 * Standardized tables with sorting, filtering, pagination
 */

import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  key: keyof T;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T extends Record<string, any>> {
  columns: ColumnDef<T>[];
  data: T[];
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  rowKey?: keyof T;
  onRowClick?: (row: T) => void;
  selectedRowKey?: string;
  hoverable?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  sortKey,
  sortDirection,
  onSort,
  searchQuery = '',
  onSearchChange,
  isLoading = false,
  emptyMessage = 'No data found',
  rowKey = 'id' as keyof T,
  onRowClick,
  selectedRowKey,
  hoverable = true,
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      {onSearchChange && (
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={String(col.key)}
                  className={cn('font-semibold text-gray-700', col.className)}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.sortable && onSort ? (
                    <button
                      onClick={() => onSort(String(col.key))}
                      className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                    >
                      {col.label}
                      {sortKey === col.key && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const isSelected = selectedRowKey === String(row[rowKey]);
                return (
                  <TableRow
                    key={String(row[rowKey])}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      isSelected && 'bg-blue-50',
                      hoverable && onRowClick && 'cursor-pointer hover:bg-gray-50'
                    )}
                  >
                    {columns.map((col) => (
                      <TableCell key={String(col.key)} className={col.className}>
                        {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/**
 * DATA GRID - Tables with pagination
 */
interface DataGridProps<T extends Record<string, any>> extends DataTableProps<T> {
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
}

export function DataGrid<T extends Record<string, any>>({
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  ...tableProps
}: DataGridProps<T>) {
  return (
    <div className="space-y-4">
      <DataTable {...tableProps} />

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * STAT CARD - For displaying key metrics
 */
interface StatCardProps {
  label: string;
  value: string | number;
  trend?: { direction: 'up' | 'down'; percentage: number };
  icon?: React.ReactNode;
}

export function StatCard({ label, value, trend, icon }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <div className={cn('text-xs font-medium mt-2', trend.direction === 'up' ? 'text-green-600' : 'text-red-600')}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.percentage}%
            </div>
          )}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </Card>
  );
}

/**
 * EMPTY STATE - When no data is present
 */
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-gray-400 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="text-sm text-gray-600 mt-2">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
