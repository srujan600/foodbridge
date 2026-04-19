import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';

import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { toast } from 'sonner';
import WhatsAppFAB from '@/components/WhatsAppFAB';
import { getDistanceKm } from '@/lib/utils/distance';
import { supabase } from '@/lib/supabase';

export default function AppLayout() {
  const { user, loading } = useCurrentUser();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Subscribe to new donations for NGO real-time notifications (30km matching)
  useEffect(() => {
    if (!user || user.user_type !== 'ngo') return;
    
    const channel = supabase.channel('public:Donation')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Donation' }, (payload) => {
        const donation = payload.new;
        // Check 30km radius if NGO has a fixed location
        if (user.latitude && user.longitude && donation?.latitude && donation?.longitude) {
          const dist = getDistanceKm(
            parseFloat(user.latitude), parseFloat(user.longitude),
            parseFloat(donation.latitude), parseFloat(donation.longitude)
          );
          if (dist > 30) return;
        }
        setNotificationCount((c) => c + 1);
        toast.info('🍱 New donation available nearby!', {
          description: 'Open the map to find and accept it.',
          duration: 6000,
        });
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading Food Bridge...</p>
        </div>
      </div>
    );
  }

  // Redirect to onboarding if user hasn't set their role/mobile
  if (user && !user.mobile) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        user={user}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          user={user}
          onMenuToggle={() => setMobileOpen(!mobileOpen)}
          notificationCount={notificationCount}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet context={{ user }} />
        </main>
      </div>
      <WhatsAppFAB user={user} />
    </div>
  );
}