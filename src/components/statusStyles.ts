export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

// 상태별 헤더 배경 (연한 색). Tailwind가 클래스를 감지할 수 있도록 전체 문자열로 작성
export const HEADER_STYLES: Record<AlertVariant, string> = {
  info: 'bg-status-info-container',
  success: 'bg-status-success-container',
  warning: 'bg-status-warning-container',
  error: 'bg-status-error-container',
};

// 상태별 확인 버튼 배경 (강한 색)
export const CONFIRM_STYLES: Record<AlertVariant, string> = {
  info: 'bg-status-info',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  error: 'bg-status-error',
};
