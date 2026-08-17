import { useId } from 'react';

import { cn } from '@/shared/lib/cn';

const CONTROL_CLASS =
  'w-full rounded-btn border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none disabled:bg-ink-50 disabled:text-ink-400';

/** 라벨 + 컨트롤 + 오류/도움말을 묶는 래퍼 */
export function Field({
  label,
  error,
  hint,
  required,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-700">
        {label}
        {required && <span className="ml-0.5 text-tone-danger-fg">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-tone-danger-fg">{error}</p>
      ) : (
        hint && <p className="text-xs text-ink-400">{hint}</p>
      )}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, className, ...rest }: InputProps) {
  const id = useId();
  const control = (
    <input
      id={id}
      className={cn(CONTROL_CLASS, error && 'border-tone-danger-fg', className)}
      aria-invalid={Boolean(error)}
      {...rest}
    />
  );

  if (!label) return control;
  return (
    <Field
      label={label}
      error={error}
      hint={hint}
      required={rest.required}
      htmlFor={id}
    >
      {control}
    </Field>
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Textarea({
  label,
  error,
  hint,
  className,
  rows = 4,
  ...rest
}: TextareaProps) {
  const id = useId();
  const control = (
    <textarea
      id={id}
      rows={rows}
      className={cn(
        CONTROL_CLASS,
        'resize-y',
        error && 'border-tone-danger-fg',
        className,
      )}
      aria-invalid={Boolean(error)}
      {...rest}
    />
  );

  if (!label) return control;
  return (
    <Field
      label={label}
      error={error}
      hint={hint}
      required={rest.required}
      htmlFor={id}
    >
      {control}
    </Field>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
};

export function Select({
  label,
  error,
  hint,
  options,
  placeholder,
  className,
  ...rest
}: SelectProps) {
  const id = useId();
  const control = (
    <select
      id={id}
      className={cn(CONTROL_CLASS, error && 'border-tone-danger-fg', className)}
      aria-invalid={Boolean(error)}
      {...rest}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  if (!label) return control;
  return (
    <Field
      label={label}
      error={error}
      hint={hint}
      required={rest.required}
      htmlFor={id}
    >
      {control}
    </Field>
  );
}
