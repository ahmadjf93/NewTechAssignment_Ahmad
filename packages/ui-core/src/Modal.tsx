import React from 'react';
import { cn } from './utils';
import { IconButton } from './Button';

type ModalProps = {
  open?: boolean;
  title?: string;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ open = true, title, onClose, children, className }: ModalProps) {
  if (!open) return null;
  return (
    <div className="nt-modal-backdrop" onClick={onClose}>
      <div className={cn('nt-modal', className)} onClick={(e) => e.stopPropagation()}>
        {onClose ? (
          <IconButton
            aria-label="Close modal"
            className="nt-modal-close"
            variant="ghost"
            onClick={onClose}
          >
            ×
          </IconButton>
        ) : null}
        {title ? <h3>{title}</h3> : null}
        {children}
      </div>
    </div>
  );
}
