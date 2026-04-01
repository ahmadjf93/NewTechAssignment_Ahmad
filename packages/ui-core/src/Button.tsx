import React from 'react';
import { cn } from './utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
  size?: 'md' | 'sm';
};

export function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn('nt-btn', variant === 'ghost' && 'ghost', size === 'sm' && 'sm', className)}
    />
  );
}

export function IconButton(props: ButtonProps) {
  return <Button {...props} size="sm" />;
}
