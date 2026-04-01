import React from 'react';
import { cn } from './utils';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...rest }: DivProps) {
  return <div {...rest} className={cn('nt-card', className)} />;
}

export function Section({ className, ...rest }: DivProps) {
  return <section {...rest} className={cn('nt-section', className)} />;
}

export function Row({ className, ...rest }: DivProps) {
  return <div {...rest} className={cn('nt-row', className)} />;
}
