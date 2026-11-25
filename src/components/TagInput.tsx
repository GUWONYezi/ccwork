import type { KeyboardEvent, ReactElement } from 'react';

interface TagInputProps {
  isOpen: boolean;
  value: string;
  onToggle: () => void;
  onChange: (value: string) => void;
  onSubmit: () => void; // Enter 입력 시. 내부에서 preventDefault 후 호출한다
  errorMessage: string | null; // 입력창 아래에 표시할 안내 문구
}

export function TagInput({
  isOpen,
  value,
  onToggle,
  onChange,
  onSubmit,
  errorMessage,
}: TagInputProps): ReactElement {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        {/* 토글 버튼 */}
        <button
          type="button"
          onClick={onToggle}
          className="text-xs text-on-surface-variant hover:opacity-75 cursor-pointer"
        >
          {isOpen ? '닫기' : '태그 추가'}
        </button>

        {/* 태그 입력창 */}
        {isOpen && (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="태그 입력"
            className="bg-surface-container-lowest border border-outline-variant/15 focus:border-tertiary outline-none px-3 py-1 text-xs text-on-surface-variant"
          />
        )}
      </div>

      {/* 안내 문구 */}
      {isOpen && errorMessage && (
        <p role="alert" className="text-xs text-status-error">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
