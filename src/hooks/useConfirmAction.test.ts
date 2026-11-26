import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useConfirmAction } from './useConfirmAction';

describe('useConfirmAction', () => {
  it('should `pending`에 대상을 담아 Confirm 열림 상태가 됨 when `request(target)` 호출', () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useConfirmAction<string>(action));
    expect(result.current.pending).toBeNull();

    act(() => result.current.request('test-1'));

    expect(result.current.pending).toBe('test-1');
    expect(action).not.toHaveBeenCalled();
  });

  it('should `action`을 대상과 함께 호출하고 `pending`을 null로 닫음 when `confirm()` 호출', async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useConfirmAction<string>(action));
    act(() => result.current.request('test-1'));

    await act(() => result.current.confirm());

    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith('test-1');
    expect(result.current.pending).toBeNull();
  });

  it('should `action` 호출 없이 `pending`을 null로 닫음 when `cancel()` 호출', () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useConfirmAction<string>(action));
    act(() => result.current.request('test-1'));

    act(() => result.current.cancel());

    expect(action).not.toHaveBeenCalled();
    expect(result.current.pending).toBeNull();
  });

  it('should 에러를 호출자에게 전파하고 `pending`을 null로 닫음 when `action`이 reject', async () => {
    const error = new Error('Failed to update note');
    const action = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useConfirmAction<string>(action));
    act(() => result.current.request('test-1'));

    await act(async () => {
      await expect(result.current.confirm()).rejects.toThrow('Failed to update note');
    });

    expect(result.current.pending).toBeNull();
  });
});
