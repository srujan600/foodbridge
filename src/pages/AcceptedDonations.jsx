import React, { useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';

import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Inbox } from 'lucide-react';
import DonationCard from '@/components/donations/DonationCard';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { toast } from 'sonner';
export default function AcceptedDonations() {
  const { user } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const { position } = useGeolocation();
  const queryClient = useQueryClient();

  const activeTab = searchParams.get('tab') || 'accepted';

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['accepted-donations', user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Donation')
        .select('*')
        .order('created_date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []).filter(d => d.accepted_by_email === user?.email);
    },
    enabled: !!user?.email,
  });

  useEffect(() => {
    const channel = supabase.channel('accepted-donations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Donation' }, () => {
        queryClient.invalidateQueries({ queryKey: ['accepted-donations'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const accepted = donations.filter(d => d.status === 'accepted');
  const completed = donations.filter(d => d.status === 'completed');

  const handleComplete = async (donation) => {
    try {
      const { error } = await supabase.from('Donation').update({
        status: 'completed',
        notes: donation.notes || ''
      }).eq('id', donation.id);
      if (error) throw error;
      toast.success('Donation marked as completed 🎉');
      queryClient.invalidateQueries({ queryKey: ['accepted-donations'] });
    } catch (err) {
      toast.error('Failed to update status. Please try again.');
    }
  };

  const EmptyState = ({ msg }) => (
    <div className="text-center py-16 space-y-3">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
        <Inbox className="w-7 h-7 text-primary/40" />
      </div>
      <p className="text-muted-foreground font-medium">{msg}</p>
    </div>
  );

  const SkeletonList = () => (
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-2xl border border-border p-5 space-y-3">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-full mt-2" />
        </div>
      ))}
    </div>
  );

  const renderList = (list, emptyMsg) => {
    if (isLoading) return <SkeletonList />;
    if (list.length === 0) return <EmptyState msg={emptyMsg} />;
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {list.map(d => (
          <DonationCard
            key={d.id}
            donation={d}
            userPosition={position}
            onComplete={handleComplete}
            showActions
            isNgo
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            Accepted Donations
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage donations you've accepted</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })}>
        <TabsList className="bg-secondary rounded-xl p-1">
          <TabsTrigger value="accepted" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Active ({accepted.length})</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Completed ({completed.length})</TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All ({donations.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="accepted" className="mt-4">{renderList(accepted, 'No active accepted donations')}</TabsContent>
        <TabsContent value="completed" className="mt-4">
          {isLoading ? <SkeletonList /> : completed.length === 0 ? <EmptyState msg="No completed donations yet" /> : (
            <div className="grid gap-4 md:grid-cols-2">
              {completed.map(d => (
                <DonationCard key={d.id} donation={d} userPosition={position} showActions isNgo />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="all" className="mt-4">{renderList(donations, 'No accepted donations yet')}</TabsContent>
      </Tabs>

    </div>
  );
}