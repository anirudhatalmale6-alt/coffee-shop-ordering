'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Coffee, LayoutGrid, MapPin, Clock, ShoppingBag, LogOut, Monitor } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/menu', label: 'Menu', icon: LayoutGrid },
  { href: '/admin/locations', label: 'Locations', icon: MapPin },
  { href: '/admin/timeslots', label: 'Time Slots', icon: Clock },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show layout for login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch('/api/auth/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-20 hidden md:block">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center">
              <Coffee size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold">Coffee Shop</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Counter view link */}
          <Link
            href="/counter"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 mt-4 border-t border-gray-100 pt-4"
          >
            <Monitor size={20} />
            <span className="font-medium">Counter View</span>
          </Link>
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 w-full"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Coffee size={24} className="text-[var(--primary)]" />
            <span className="font-bold">Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-red-600 p-2"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* Mobile nav */}
        <nav className="flex overflow-x-auto no-scrollbar px-2 pb-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm ${
                  isActive
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-gray-600 bg-gray-100'
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main content */}
      <main className="md:ml-64 pt-24 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
