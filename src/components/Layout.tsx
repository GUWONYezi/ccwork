import { ReactNode } from 'react';

interface LayoutProps {
  onNewNote: () => void;
  sidebar: ReactNode;
  main: ReactNode;
}

export function Layout({ onNewNote, sidebar, main }: LayoutProps) {
  return (
    <div className="min-h-screen bg-surface">
      {/* 헤더 */}
      <header className="bg-surface px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-on-surface">Notes</h1>
        <button
          onClick={onNewNote}
          className="bg-linear-to-br from-tertiary to-tertiary-container text-on-tertiary px-5 py-2 rounded-md text-sm font-semibold hover:opacity-75 transition-opacity cursor-pointer"
        >
          + 새 노트
        </button>
      </header>

      {/* 바디 */}
      <div className="flex" style={{ height: 'calc(100vh - 65px)' }}>
        {/* 사이드바 */}
        <div className="w-72 overflow-y-auto bg-surface-container-low p-4 shrink-0">{sidebar}</div>

        {/* 메인 */}
        <div className="flex-1 overflow-y-auto bg-surface-container p-8">{main}</div>
      </div>
    </div>
  );
}
