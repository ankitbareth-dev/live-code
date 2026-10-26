import { useState } from "react";
import { useBookings } from "./hooks/useBookings";
import { BookingPage } from "./features/booking/BookingPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { AppHeader } from "./features/shell/AppHeader";
import { StorageWarningBanner } from "./features/shell/StorageWarningBanner";
import type { AppView } from "./features/shell/navigation";

export default function App() {
  const { appointments, latestWarnings, createAppointment, cancelAppointment } =
    useBookings();
  const [view, setView] = useState<AppView>("book");

  const handleViewChange = (nextView: AppView) => {
    setView(nextView);
    // A new "page" starts at the top — instantly, so reduced-motion
    // users never get a smooth-scroll animation.
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:border focus:border-border focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-text-primary focus:shadow-overlay"
      >
        Skip to content
      </a>

      <AppHeader activeView={view} onViewChange={handleViewChange} />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 focus:outline-none sm:px-6"
      >
        <StorageWarningBanner warnings={latestWarnings} />

        {view === "book" ? (
          <BookingPage
            appointments={appointments}
            createAppointment={createAppointment}
            onGoToDashboard={() => handleViewChange("dashboard")}
          />
        ) : (
          <DashboardPage
            appointments={appointments}
            cancelAppointment={cancelAppointment}
            onBookNew={() => handleViewChange("book")}
          />
        )}
      </main>
    </div>
  );
}
