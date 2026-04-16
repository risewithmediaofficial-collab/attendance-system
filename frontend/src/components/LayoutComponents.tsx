/**
 * LAYOUT COMPONENTS
 * Standardized page layouts and containers
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

/**
 * PAGE HEADER - Consistent header for pages
 */
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
    icon?: React.ReactNode;
  };
  backButton?: () => void;
}

export function PageHeader({ title, description, action, backButton }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-start justify-between">
      <div className="flex items-center gap-4">
        {backButton && (
          <Button variant="ghost" size="icon" onClick={backButton} className="hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-gray-600 mt-1">{description}</p>}
        </div>
      </div>
      {action && (
        <Button onClick={action.onClick} variant={action.variant}>
          {action.icon && <span className="mr-2">{action.icon}</span>}
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * PAGE CONTAINER - Enforces consistent page structure
 */
interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function PageContainer({
  children,
  className,
  maxWidth = 'xl',
}: PageContainerProps) {
  const maxWidthClass = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'w-full',
  }[maxWidth];

  return (
    <div className={cn('mx-auto px-4 md:px-6 lg:px-8 py-6', maxWidthClass, className)}>
      {children}
    </div>
  );
}

/**
 * SECTION - Groups related content
 */
interface SectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  card?: boolean;
}

export function Section({
  title,
  description,
  children,
  className,
  card = true,
}: SectionProps) {
  const content = (
    <>
      {(title || description) && (
        <div className="mb-6">
          {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
      )}
      {children}
    </>
  );

  if (card) {
    return (
      <Card className={cn('p-6', className)}>
        {content}
      </Card>
    );
  }

  return <div className={className}>{content}</div>;
}

/**
 * GRID - Responsive grid layout
 */
interface GridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Grid({
  children,
  columns = 3,
  gap = 'md',
  className,
}: GridProps) {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1';

  const gapClass = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  }[gap];

  return (
    <div className={cn('grid', colClass, gapClass, className)}>
      {children}
    </div>
  );
}

/**
 * STACK - Flexible box layout
 */
interface StackProps {
  children: React.ReactNode;
  direction?: 'row' | 'col';
  gap?: 'xs' | 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end';
  justify?: 'start' | 'center' | 'end' | 'between';
  className?: string;
}

export function Stack({
  children,
  direction = 'col',
  gap = 'md',
  align = 'start',
  justify = 'start',
  className,
}: StackProps) {
  const directionClass = direction === 'row' ? 'flex-row' : 'flex-col';
  const gapClass = {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  }[gap];
  const alignClass = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
  }[align];
  const justifyClass = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  }[justify];

  return (
    <div className={cn('flex', directionClass, gapClass, alignClass, justifyClass, className)}>
      {children}
    </div>
  );
}

/**
 * CARD GRID - Cards in a grid with actions
 */
interface CardGridItemProps {
  id: string;
  title: string;
  description?: string;
  content?: React.ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline';
    disabled?: boolean;
  }>;
  selected?: boolean;
  onClick?: () => void;
}

export function CardGridItem({
  id,
  title,
  description,
  content,
  actions,
  selected,
  onClick,
}: CardGridItemProps) {
  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all',
        selected ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
      )}
      onClick={onClick}
    >
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-xs text-gray-600 mt-1">{description}</p>}
        </div>

        {content && <div className="text-sm text-gray-700">{content}</div>}

        {actions && (
          <div className="flex gap-2 pt-3 border-t">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
