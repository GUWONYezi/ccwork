import { ReactNode } from 'react';

interface DialogOverlayProps {
  children: ReactNode;
}

export function DialogOverlay({ children }: DialogOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/20 p-4">
      {children}
    </div>
  );
}
