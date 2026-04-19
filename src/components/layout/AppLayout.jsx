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
  const [notifications, setNotifications] = useState([]);

  // Subscribe to real-time events for notifications
  useEffect(() => {
    if (!user) return;

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const channels = [];

    // 1. NGO Notification: Listen for new donations (INSERT)
    if (user.user_type === 'ngo') {
      const channelNgo = supabase.channel('public:Donation:Insert')
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
          setNotifications((prev) => [donation, ...prev]);
          toast.info('🍱 New donation available nearby!', {
            description: 'Open the map to find and accept it.',
            duration: 6000,
          });

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Donation Nearby', {
              body: `${donation.food_type} is available. Open Food Bridge to accept.`,
            });
          }
        })
        .subscribe();
      channels.push(channelNgo);
    }

    // 2. Donor Notification: Listen for accepted donations (UPDATE)
    const channelDonor = supabase.channel('public:Donation:Update')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'Donation' }, (payload) => {
        const newDoc = payload.new;
        const oldDoc = payload.old || {};
        
        // Ensure it's the current user's donation and it transitioned to accepted
        if (newDoc.donor_email === user.email) {
          if (oldDoc.status !== 'accepted' && newDoc.status === 'accepted') {
            toast.success('🎉 Your donation was accepted!', {
              description: `An NGO has accepted your ${newDoc.food_type}.`,
              duration: 6000,
            });

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Donation Accepted!', {
                body: `Your donation of ${newDoc.food_type} has been accepted by an NGO.`,
              });
            }
          // Also optionally notify when completed
          } else if (oldDoc.status !== 'completed' && newDoc.status === 'completed') {
            toast.success('✅ Donation Completed', {
              description: `Your ${newDoc.food_type} donation was marked as successfully picked up!`,
              duration: 6000,
            });
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Pickup Completed', {
                body: `Your donation of ${newDoc.food_type} was successfully picked up. Thank you!`,
              });
            }
          }
        }
      })
      .subscribe();
    
    channels.push(channelDonor);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
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
          notifications={notifications}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet context={{ user }} />
        </main>
      </div>
      <WhatsAppFAB user={user} />
    </div>
  );
}