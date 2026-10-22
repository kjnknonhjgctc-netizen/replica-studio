import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_auto] sm:flex sm:items-end sm:justify-between gap-3 mb-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-lg font-extrabold text-foreground  tracking-normal">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground  mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-10 px-4 bg-transparent border-0 rounded-none transition-colors ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-accent  text-primary  flex items-center justify-center mb-3.5">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground  mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 3,
  className = ''
}) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 bg-muted  rounded-2xl w-full" />
      ))}
    </div>
  );
};

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry
}) => {
  return (
    <div className="p-6 bg-destructive-subtle  border border-destructive-border  rounded-2xl text-center">
      <p className="text-sm font-medium text-destructive  mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-destructive  underline hover:opacity-80 cursor-pointer"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
};

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDestructive = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-card  rounded-2xl max-w-sm w-full p-6 border border-border  shadow-xl text-left transition-colors">
        <h3 className="text-lg font-bold text-foreground  mb-2">{title}</h3>
        <p className="text-xs text-muted-foreground  leading-relaxed mb-6">{description}</p>
        <div className="flex gap-2.5 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-muted-foreground  hover:bg-muted  rounded-xl cursor-pointer transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold rounded-xl text-primary-foreground cursor-pointer transition-all ${
              isDestructive
                ? 'bg-destructive hover:bg-destructive shadow-sm'
                : 'bg-gradient-to-r from-primary via-primary to-primary hover:from-primary hover:to-primary shadow-md shadow-primary/25'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      <label htmlFor={id} className="text-xs font-semibold text-foreground ">
        {label}
      </label>
      <input
        id={id}
        className={`delux-field w-full h-12 px-3.5 bg-card border-2 rounded-xl text-sm text-foreground  placeholder:text-muted-foreground  focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
          error ? 'border-destructive-border ' : 'border-border  focus:border-primary'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-[11px] text-destructive  font-medium">{error}</span>}
      {!error && helperText && <span className="text-[11px] text-muted-foreground ">{helperText}</span>}
    </div>
  );
};

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backAction?: () => void;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  backAction,
  className = ''
}) => {
  return (
    <div className={`delux-page-header grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 mb-7 ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        {backAction && (
          <button
            onClick={backAction}
            aria-label="Voltar"
            className="w-10 h-10 shrink-0 rounded-xl bg-card  border border-border  flex items-center justify-center text-foreground  hover:bg-card  transition-all cursor-pointer mt-0.5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-foreground ">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-muted-foreground  mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
