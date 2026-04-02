import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  ShoppingCart,
  FileText,
  LogOut,
  Menu,
  Bell,
  ClipboardList,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'STOCK_MANAGER', 'STANDARD_USER'] },
    { name: 'Users', href: '/users', icon: Users, roles: ['SUPER_ADMIN'] },
    { name: 'Products', href: '/products', icon: Package, roles: ['SUPER_ADMIN', 'STOCK_MANAGER', 'STANDARD_USER'] },
    { name: 'Stock Levels', href: '/stock', icon: Boxes, roles: ['SUPER_ADMIN', 'STOCK_MANAGER', 'STANDARD_USER'] },
    { name: 'Orders', href: '/orders', icon: ShoppingCart, roles: ['SUPER_ADMIN', 'STOCK_MANAGER', 'STANDARD_USER'] },
    { name: 'Invoices', href: '/invoices', icon: FileText, roles: ['SUPER_ADMIN', 'STOCK_MANAGER', 'STANDARD_USER'] },
    { name: 'Activity Logs', href: '/logs', icon: ClipboardList, roles: ['SUPER_ADMIN', 'STOCK_MANAGER'] },
  ];

  const filteredNav = navigation.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-white transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:flex-shrink-0 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`h-16 flex items-center border-b border-slate-800 transition-all ${
          isSidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-2'
        }`}>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden flex-1">
               <div className="w-7 h-7 bg-indigo-600 rounded flex-shrink-0 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Boxes className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-sm tracking-tight truncate text-white uppercase italic">
                EnterpriseStock
              </span>
            </div>
          )}
          
          {isSidebarCollapsed && (
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Boxes className="w-5 h-5 text-white" />
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex h-6 w-6 text-slate-500 hover:text-white hover:bg-slate-800 transition-all rounded-md flex-shrink-0"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
        
        <nav className="p-3 space-y-1 mt-2">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                title={isSidebarCollapsed ? item.name : ''}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                {!isSidebarCollapsed && (
                  <span className="truncate animate-in fade-in slide-in-from-left-2 duration-300">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              className="md:hidden p-2 text-slate-500 hover:text-slate-900 bg-slate-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center shadow-md">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[120px] sm:max-w-none">Balaji Enterprises</span>
                <span className="text-[10px] sm:text-xs text-slate-500 leading-tight">Chennai Ops</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="hidden sm:block p-2 text-slate-400 hover:text-slate-500 relative transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-200 pl-2 sm:pl-4">
              <div className="text-sm text-right hidden lg:block">
                <p className="font-bold text-slate-900 leading-none">{user?.firstName} {user?.lastName}</p>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider mt-1">{user?.role.replace('_', ' ')}</p>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-bold shadow-inner text-sm uppercase">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
