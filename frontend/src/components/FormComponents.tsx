/**
 * FORM WRAPPER COMPONENT
 * Standardized form with consistent styling and behavior
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title?: string;
  description?: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitVariant?: 'default' | 'destructive';
  layout?: 'card' | 'inline';
  spacing?: 'compact' | 'normal' | 'spacious';
}

export const FormWrapper = React.forwardRef<HTMLFormElement, FormProps>(
  (
    {
      title,
      description,
      onSubmit,
      submitLabel = 'Save',
      cancelLabel = 'Cancel',
      onCancel,
      isSubmitting = false,
      submitVariant = 'default',
      layout = 'card',
      spacing = 'normal',
      children,
      className,
      ...props
    },
    ref
  ) => {
    const spacingClass = {
      compact: 'gap-3',
      normal: 'gap-4',
      spacious: 'gap-6',
    }[spacing];

    const form = (
      <form
        ref={ref}
        onSubmit={onSubmit}
        className={cn('flex flex-col', spacingClass, className)}
        {...props}
      >
        {children}

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isSubmitting} variant={submitVariant}>
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {cancelLabel}
            </Button>
          )}
        </div>
      </form>
    );

    if (layout === 'card') {
      return (
        <Card>
          {(title || description) && (
            <CardHeader>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
          )}
          <CardContent>{form}</CardContent>
        </Card>
      );
    }

    return form;
  }
);

FormWrapper.displayName = 'FormWrapper';

/**
 * FORM FIELD WRAPPER
 * Consistent form field with label and error message
 */
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  helperText?: string;
  children: React.ReactNode;
}

export function FormField({ label, error, required, helperText, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
      {helperText && !error && <span className="text-xs text-gray-500">{helperText}</span>}
    </div>
  );
}
