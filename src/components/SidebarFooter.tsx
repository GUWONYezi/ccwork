interface SidebarFooterProps {
  onOpenTrash: () => void;
}

export function SidebarFooter({ onOpenTrash }: SidebarFooterProps) {
  return (
    <div className="mt-6 flex justify-start">
      {/* 휴지통 버튼 */}
      <button
        type="button"
        onClick={onOpenTrash}
        aria-label="휴지통"
        className="rounded-md px-3 py-1.5 text-xs uppercase tracking-[0.05em] text-tertiary hover:bg-tertiary/2 cursor-pointer"
      >
        휴지통
      </button>
    </div>
  );
}
