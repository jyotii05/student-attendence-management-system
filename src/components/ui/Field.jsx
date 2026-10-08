import { CircleAlert, ChevronDown } from 'lucide-react';

export function Field({ label, error, hint, required, children, className = '', htmlFor }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger" role="alert">
          <CircleAlert className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-3">{hint}</p>
      )}
    </div>
  );
}

export function Input({ error, className = '', icon: Icon, ...props }) {
  if (Icon)
    return (
      <div className="relative">
        <Icon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-3" />
        <input {...props} className={`input pl-9 ${error ? 'input-error' : ''} ${className}`} aria-invalid={!!error} />
      </div>
    );
  return <input {...props} className={`input ${error ? 'input-error' : ''} ${className}`} aria-invalid={!!error} />;
}

export function Select({ error, className = '', children, ...props }) {
  return (
    <div className="relative">
      <select {...props} className={`input appearance-none pr-9 ${error ? 'input-error' : ''} ${className}`} aria-invalid={!!error}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-ink-3" />
    </div>
  );
}

export function Textarea({ error, className = '', ...props }) {
  return <textarea {...props} className={`input min-h-[80px] resize-y ${error ? 'input-error' : ''} ${className}`} />;
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${disabled ? 'opacity-60' : ''}`}>
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-ink-3">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-4 focus-visible:ring-brand/20 focus-visible:outline-none ${checked ? 'bg-brand-600' : 'bg-line-strong'}`}
      >
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
