import React from 'react';
import { Menu, Bell, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function TopBar({ user, onMenuToggle, notifications = [] }) {
  const initials = (user?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const notificationCount = notifications?.length || 0;

  const renderBellIcon = () => (
    <div className="relative cursor-pointer">
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl pointer-events-none"
      >
        <Bell className="w-5 h-5" />
      </Button>
      {notificationCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
          {notificationCount > 9 ? '9+' : notificationCount}
        </span>
      )}
    </div>
  );

  return (
    <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
      {/* Left: menu toggle + branding/greeting */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-muted-foreground hover:text-primary hover:bg-primary/10"
          onClick={onMenuToggle}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="hidden lg:flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Utensils className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-heading font-bold text-sm text-foreground">Food Bridge</span>
        </div>
        <div className="lg:hidden">
          <p className="text-sm font-semibold text-foreground leading-tight">
            Hi, <span className="text-primary">{user?.full_name?.split(' ')[0] || 'User'}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="hidden lg:block">
          <p className="text-sm font-semibold text-foreground leading-tight">
            Welcome, <span className="text-primary">{user?.full_name?.split(' ')[0] || 'User'}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Right: notifications + avatar */}
      <div className="flex items-center gap-2">
        {notificationCount > 0 ? (
          <Popover>
            <PopoverTrigger asChild>
              {renderBellIcon()}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4 mt-2 rounded-xl shadow-lg border-border" align="end">
              <div className="bg-primary/5 px-4 py-3 border-b border-border rounded-t-xl">
                 <h4 className="font-heading font-semibold text-sm">Notifications</h4>
              </div>
              <div className="max-h-[300px] overflow-y-auto w-full p-2 space-y-1">
                {notifications.map((notif, idx) => (
                  <div key={idx} className="p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors text-sm">
                    <p className="font-medium text-foreground">{notif.donor_name || 'A donor'} posted a donation</p>
                    <p className="text-muted-foreground text-xs mt-1">Food: {notif.food_type} • Qty: {notif.quantity}</p>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          renderBellIcon()
        )}

        <div className="flex items-center gap-2 pl-2 border-l border-border ml-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-foreground leading-tight">{user?.full_name || 'User'}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{user?.role || 'donor'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}