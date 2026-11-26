import { useState } from 'react';

export interface UseConfirmActionResult<T> {
  pending: T | null; // 확인 대기 중인 대상. null이면 Confirm 닫힘
  request: (target: T) => void; // Confirm 열기
  confirm: () => Promise<void>; // pending으로 action 실행 후 닫기
  cancel: () => void; // action 호출 없이 닫기
}

export function useConfirmAction<T>(
  action: (target: T) => Promise<void>,
): UseConfirmActionResult<T> {
  const [pending, setPending] = useState<T | null>(null);

  const request = (target: T) => setPending(target);

  const cancel = () => setPending(null);

  const confirm = async () => {
    if (pending === null) return;
    try {
      await action(pending);
    } finally {
      setPending(null);
    }
  };

  return { pending, request, confirm, cancel };
}
