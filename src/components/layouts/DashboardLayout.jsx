import Sidebar from '../Sidebar';
import Topbar from '../Topbar';

/**
 * Dashboard layout wrapper — dark background + sidebar + topbar.
 * Eliminates the repeated wrapper pattern from every dashboard page.
 *
 * @param {{ title: string, children: React.ReactNode }} props
 */
export default function DashboardLayout({ title, children }) {
  return (
    <div className="bg-djati-bg min-h-screen font-primary text-white">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-[1.4rem_2rem_2.5rem] overflow-y-auto box-border">
          <Topbar title={title} />
          {children}
        </main>
      </div>
    </div>
  );
}
