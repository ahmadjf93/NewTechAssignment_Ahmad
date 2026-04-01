import React from 'react';
import { cn } from './utils';

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Checkbox({ label, className, ...rest }: CheckboxProps) {
  return (
    <label className={cn('nt-checkbox-row', className)}>
      <input type="checkbox" {...rest} />
      {label ? <span>{label}</span> : null}
    </label>
  );
}
