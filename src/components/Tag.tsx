import type { ReactElement } from 'react';

interface TagProps {
  label: string;
  // x 버튼 클릭 시. 어떤 태그인지는 부모(TagList)가 바인딩한다
  // 생략하면 삭제 버튼을 그리지 않는다 (읽기 전용)
  onDelete?: () => void;
}

export function Tag({ label, onDelete }: TagProps): ReactElement {
  return (
    <span className="group inline-flex max-w-[12rem] items-center gap-1 rounded-full bg-surface-container-highest px-3 py-1 text-xs text-on-surface-variant">
      {/* 라벨 */}
      <span className="truncate" title={label}>
        {label}
      </span>

      {/* 삭제 버튼 */}
      {onDelete && (
        <button
          type="button"
          aria-label={`${label} 태그 삭제`}
          onClick={onDelete}
          className="shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          ×
        </button>
      )}
    </span>
  );
}
