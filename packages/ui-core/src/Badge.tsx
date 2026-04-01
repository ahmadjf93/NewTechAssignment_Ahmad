import React from 'react';
import { cn } from './utils';

type SpanProps = React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ className, ...rest }: SpanProps) {
  return <span {...rest} className={cn('nt-badge', className)} />;
}

export function Pill({ className, ...rest }: SpanProps) {
  return <span {...rest} className={cn('nt-pill', className)} />;
}
