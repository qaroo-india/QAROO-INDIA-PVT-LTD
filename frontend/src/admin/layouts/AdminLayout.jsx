import { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import AdminNavbar from '../components/AdminNavbar.jsx';
import CommandPalette from '../components/CommandPalette.jsx';
import useSpotlight from '../hooks/useSpotlight.js';
import { ShimmerPanel } from '../../components/ui/States';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);
  const shellRef = useSpotlight();

  return (
    <div ref={shellRef} className={`admin-shell${mobileOpen ? ' sidebar-open' : ''}`}>
      <div className="admin-sidebar-backdrop" onClick={close} />
      <Sidebar onNavigate={close} />
      <div className="admin-main">
        <AdminNavbar onMenuClick={() => setMobileOpen((o) => !o)} />
        <main className="admin-content">
          <Suspense fallback={<ShimmerPanel variant="table" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
