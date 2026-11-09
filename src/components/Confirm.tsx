import { ReactNode } from 'react';
import { CONFIRM_STYLES, HEADER_STYLES, type AlertVariant } from './statusStyles';

interface ConfirmProps {
  variant?: AlertVariant;
  title: string;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Confirm({
  variant = 'warning',
  title,
  children,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
}: ConfirmProps) {
  return (
    <div
      role="alertdialog"
      aria-label={title}
      className="w-full max-w-sm overflow-hidden rounded-md bg-surface/80 backdrop-blur-[12px] shadow-[0_16px_32px_rgba(43,52,55,0.06)]"
    >
      {/* 헤더 */}
      <div
        className={`flex items-center justify-between px-4 py-3 text-on-surface ${HEADER_STYLES[variant]}`}
      >
        <h3 className="text-sm font-semibold">{title}</h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label="닫기"
          className="-mr-1 flex h-6 w-6 items-center justify-center rounded-md text-lg leading-none hover:bg-on-surface/6 transition-colors cursor-pointer"
        >
          ×
        </button>
      </div>

      {/* 내용 */}
      <div className="px-4 py-4 text-sm leading-relaxed text-on-surface">{children}</div>

      {/* 버튼 영역 */}
      <div className="flex justify-end gap-2 px-4 pb-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-surface-container-high px-3 py-1.5 text-sm text-on-surface hover:opacity-75 cursor-pointer"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-md px-3 py-1.5 text-sm text-on-tertiary hover:opacity-75 cursor-pointer ${CONFIRM_STYLES[variant]}`}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}
