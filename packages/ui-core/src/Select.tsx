import React from 'react';
import { cn } from './utils';

type Option = { label: string; value: string | number; disabled?: boolean };

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  helperText?: string;
  options: Option[];
};

export function Select({ label, helperText, className, id, options, ...rest }: SelectProps) {
  const selectId = id || (label ? `nt-select-${Math.random().toString(36).slice(2, 8)}` : undefined);
  return (
    <label className="nt-field" htmlFor={selectId}>
      {label ? <span className="nt-label">{label}</span> : null}
      <select id={selectId} className={cn('nt-select', className)} {...rest}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {helperText ? <span className="nt-helper">{helperText}</span> : null}
    </label>
  );
}
