import { ReactNode } from 'react';
import { HEADER_STYLES, type AlertVariant } from './statusStyles';

export type { AlertVariant };

interface AlertProps {
  variant?: AlertVariant;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function Alert({ variant = 'info', title, children, onClose }: AlertProps) {
  return (
    <div
      role="alert"
      className="w-full max-w-sm overflow-hidden rounded-md bg-surface/80 backdrop-blur-[12px] shadow-[0_16px_32px_rgba(43,52,55,0.06)]"
    >
      {/* 헤더 */}
      <div
        className={`flex items-center justify-between px-4 py-3 text-on-surface ${HEADER_STYLES[variant]}`}
      >
        <h3 className="text-sm font-semibold">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="-mr-1 flex h-6 w-6 items-center justify-center rounded-md text-lg leading-none hover:bg-on-surface/6 transition-colors cursor-pointer"
        >
          ×
        </button>
      </div>

      {/* 내용 */}
      <div className="px-4 py-4 text-sm leading-relaxed text-on-surface">{children}</div>
    </div>
  );
}
