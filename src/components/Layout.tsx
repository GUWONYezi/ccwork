import { ReactNode } from 'react';

interface LayoutProps {
  onNewNote: () => void;
  sidebar: ReactNode;
  main: ReactNode;
}

export function Layout({ onNewNote, sidebar, main }: LayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-surface">
      {/* 헤더 */}
      <header className="flex items-center justify-between bg-surface px-6 py-4">
        <h1 className="text-2xl font-bold text-on-surface">Notes</h1>
        <button
          onClick={onNewNote}
          className="rounded-md bg-linear-to-br from-tertiary to-tertiary-container px-5 py-2 text-sm font-semibold text-on-tertiary transition-opacity hover:opacity-75 cursor-pointer"
        >
          + 새 노트
        </button>
      </header>

      {/* 바디 */}
      <div className="flex min-h-0 flex-1">
        {/* 사이드바 */}
        <div className="flex w-72 shrink-0 flex-col gap-[1.4rem] overflow-y-auto bg-surface-container-low p-3">
          {sidebar}
        </div>

        {/* 메인 */}
        <div className="flex-1 overflow-y-auto bg-surface-container p-8">{main}</div>
      </div>
    </div>
  );
}
