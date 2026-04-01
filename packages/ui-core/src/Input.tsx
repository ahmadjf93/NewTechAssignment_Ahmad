import React from 'react';
import { cn } from './utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
};

export function Input({ label, helperText, className, id, ...rest }: InputProps) {
  const inputId = id || (label ? `nt-input-${Math.random().toString(36).slice(2, 8)}` : undefined);
  return (
    <label className="nt-field" htmlFor={inputId}>
      {label ? <span className="nt-label">{label}</span> : null}
      <input id={inputId} className={cn('nt-input', className)} {...rest} />
      {helperText ? <span className="nt-helper">{helperText}</span> : null}
    </label>
  );
}
