import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, PlusCircle, MapPin, History, User,
  Heart, Moon, Sun, LogOut, ChevronLeft, Utensils
} from 'lucide-react';

import { useDarkMode } from '@/lib/hooks/useDarkMode';
import { useAuth } from '@/lib/AuthContext';

const donorLinks = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/donate', label: 'Donate Food', icon: PlusCircle },
  { path: '/my-donations', label: 'My Donations', icon: History },
  { path: '/map', label: 'Map View', icon: MapPin },
  { path: '/profile', label: 'Profile', icon: User },
];

const ngoLinks = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/map', label: 'Find Donations', icon: MapPin },
  { path: '/accepted', label: 'Accepted', icon: Heart },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar({ user, collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const { isDark, toggle } = useDarkMode();
  const { logout } = useAuth();
  const links = user?.user_type === 'ngo' ? ngoLinks : donorLinks;

  const handleLogout = () => logout('/');

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className={`p-5 pb-4 border-b border-sidebar-border ${collapsed ? 'px-3' : ''}`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-heading font-bold text-base text-sidebar-foreground leading-tight">Food Bridge</h1>
              <p className="text-[11px] text-sidebar-foreground/50 capitalize">{user?.user_type || 'donor'} portal</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? link.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                ${collapsed ? 'justify-center' : ''}
                ${isActive
                  ? 'bg-sidebar-primary/20 text-sidebar-primary shadow-sm'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sidebar-primary rounded-r-full" />
              )}
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-sidebar-primary' : ''}`} />
              {!collapsed && (
                <span className={`text-sm font-medium ${isActive ? 'text-sidebar-foreground' : ''}`}>
                  {link.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className={`p-2 space-y-1 border-t border-sidebar-border ${collapsed ? 'px-2' : ''}`}>
        <button
          onClick={toggle}
          title={collapsed ? (isDark ? 'Light Mode' : 'Dark Mode') : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          {isDark ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
          {!collapsed && <span className="text-sm font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-sidebar transition-all duration-300 ease-in-out relative flex-shrink-0
          ${collapsed ? 'w-[68px]' : 'w-[256px]'}`}
        style={{ backgroundColor: 'hsl(var(--sidebar-background))' }}
      >
        <NavContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-7 w-6 h-6 rounded-full bg-blue-600 border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors z-10"
        >
          <ChevronLeft className={`w-3 h-3 text-white transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-[256px]"
              style={{ backgroundColor: 'hsl(var(--sidebar-background))' }}
            >
              <NavContent />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}