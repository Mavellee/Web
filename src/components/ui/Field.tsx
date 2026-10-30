import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cx } from "../../lib/format";

const control =
  "block w-full rounded-2xl border border-line bg-surface/80 px-4 py-3 text-ink placeholder:text-ink-muted/70 shadow-[inset_0_1px_0_var(--sheen)] transition focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10 aria-[invalid=true]:border-accent aria-[invalid=true]:ring-rose/40 disabled:opacity-60";

interface FieldShellProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  id: string;
  children: ReactNode;
  optional?: boolean;
}

export function FieldShell({ label, hint, error, id, children, optional }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-semibold text-ink">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-ink-muted">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type Common = { label: ReactNode; hint?: ReactNode; error?: string; optional?: boolean };

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & Common>(function Input({ label, hint, error, optional, className, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell label={label} hint={hint} error={error} id={fid} optional={optional}>
      <input ref={ref} id={fid} aria-invalid={!!error} aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined} className={cx(control, className)} {...rest} />
    </FieldShell>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & Common>(function Textarea({ label, hint, error, optional, className, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell label={label} hint={hint} error={error} id={fid} optional={optional}>
      <textarea ref={ref} id={fid} aria-invalid={!!error} aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined} className={cx(control, "min-h-28 resize-y", className)} {...rest} />
    </FieldShell>
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & Common>(function Select({ label, hint, error, optional, className, id, children, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell label={label} hint={hint} error={error} id={fid} optional={optional}>
      <select ref={ref} id={fid} aria-invalid={!!error} className={cx(control, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%2376506F%22><path d=%22M5.5 7.5l4.5 4.5 4.5-4.5%22 stroke=%22%2376506F%22 stroke-width=%221.6%22 fill=%22none%22/></svg>')] bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat pr-11", className)} {...rest}>
        {children}
      </select>
    </FieldShell>
  );
});

export function Checkbox({ label, error, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; error?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-soft">
        <input id={id} type="checkbox" aria-invalid={!!error} className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-md border-line-strong text-primary accent-primary focus-visible:ring-2 focus-visible:ring-primary" {...rest} />
        <span>{label}</span>
      </label>
      {error && (
        <p role="alert" className="mt-1 pl-8 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
