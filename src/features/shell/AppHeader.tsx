import type { AppView } from "./navigation";

const NAV_ITEMS: ReadonlyArray<{ id: AppView; label: string }> = [
  { id: "book", label: "Book" },
  { id: "dashboard", label: "Dashboard" },
];

type AppHeaderProps = {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
};

export function AppHeader({ activeView, onViewChange }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="text-sm font-semibold tracking-tight text-text-primary">
          Meridian Digital
        </p>
        <nav aria-label="Primary" className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === activeView;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => onViewChange(item.id)}
                className={[
                  "rounded-control px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
