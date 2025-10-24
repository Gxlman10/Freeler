import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  helperText?: string;
  minRows?: number;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, minRows = 3, id, required, ...props }, ref) => {
    const textareaId = id ?? props.name;
    // Igual que el input, heredamos tonos globales para evitar transparencias
    return (
      <label className="flex w-full flex-col gap-1 text-sm text-content">
        {label && (
          <span className="font-medium text-content">
            {label}
            {required ? <span className="ml-1 text-red-500">*</span> : null}
          </span>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={minRows}
          className={cn(
            'w-full rounded-md border border-border bg-field px-3 py-2 text-sm text-content shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60',
            className,
          )}
          {...props}
        />
        {helperText && (
          <span className="text-xs text-content-subtle">{helperText}</span>
        )}
      </label>
    );
  },
);

Textarea.displayName = 'Textarea';
