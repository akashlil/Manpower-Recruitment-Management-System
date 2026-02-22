import React from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, UserPlus, CreditCard, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <Layout />;
};

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Candidates', href: '/candidates', icon: Users },
    ...(user?.role === 'admin' || user?.role === 'super_admin' 
      ? [{ name: 'Agents', href: '/agents', icon: UserPlus }] 
      : []),
  ];

  // Data Entry might not have access to dashboard stats, but can see candidates
  // Accountant can see dashboard and candidates
  // We'll keep the base navigation but the content will be restricted by API.

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white">
        <div className="p-6 text-xl font-bold border-b border-slate-800">RecruitPro</div>
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 p-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
              {user?.name[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header - Mobile */}
        <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between">
          <span className="text-xl font-bold">RecruitPro</span>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-900 text-white p-6">
             <div className="flex justify-between mb-8">
                <span className="text-xl font-bold">RecruitPro</span>
                <button onClick={() => setIsMobileMenuOpen(false)}><X /></button>
             </div>
             <nav className="space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-4 p-4 rounded-xl bg-slate-800"
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-lg">{item.name}</span>
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-4 p-4 rounded-xl bg-red-500/10 text-red-400"
                >
                  <LogOut className="w-6 h-6" />
                  <span className="text-lg">Logout</span>
                </button>
             </nav>
          </div>
        )}

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
