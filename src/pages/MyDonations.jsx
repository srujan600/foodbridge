import React, { useEffect } from 'react';
import { useOutletContext, Link, useSearchParams } from 'react-router-dom';

import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Inbox } from 'lucide-react';
import DonationCard from '@/components/donations/DonationCard';
import { toast } from 'sonner';

export default function MyDonations() {
  const { user } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const activeTab = searchParams.get('tab') || 'all';

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['my-donations', user?.email],
    queryFn: async () => {
      const { data, error } = await supabase.from('Donation').select('*').order('created_date', { ascending: false }).limit(100);
      if (error) throw error;
      return (data || []).filter(d => d.created_by === user?.email);
    },
    enabled: !!user?.email,
  });

  useEffect(() => {
    const channel = supabase.channel('my-donations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Donation' }, () => {
        queryClient.invalidateQueries({ queryKey: ['my-donations'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const pending = donations.filter(d => d.status === 'pending');
  const accepted = donations.filter(d => d.status === 'accepted');
  const denied = donations.filter(d => d.status === 'denied');
  const completed = donations.filter(d => d.status === 'completed');

  const handleDelete = async (donation) => {
    if (donation.status !== 'pending') {
      toast.error('Only pending donations can be deleted.');
      return;
    }
    try {
      const { error } = await supabase.from('Donation').delete().eq('id', donation.id);
      if (error) throw error;
      toast.success('Donation deleted.');
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
    } catch {
      toast.error('Failed to delete donation. Please try again.');
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

  const renderList = (list, emptyMsg) => {
    if (isLoading) return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl border border-border p-5 space-y-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
    if (list.length === 0) return <EmptyState msg={emptyMsg} />;
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {list.map(d => (
          <DonationCard
            key={d.id}
            donation={d}
            showActions
            isNgo={false}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">My Donations</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track all your food donations</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 rounded-xl shadow-sm shadow-blue-200 dark:shadow-blue-900/30">
          <Link to="/donate">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Donation
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })}>
        <TabsList className="bg-secondary rounded-xl p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All ({donations.length})</TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="accepted" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Accepted ({accepted.length})</TabsTrigger>
          <TabsTrigger value="denied" className="rounded-lg data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">Denied ({denied.length})</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Completed ({completed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">{renderList(donations, 'No donations yet')}</TabsContent>
        <TabsContent value="pending" className="mt-4">{renderList(pending, 'No pending donations')}</TabsContent>
        <TabsContent value="accepted" className="mt-4">{renderList(accepted, 'No accepted donations')}</TabsContent>
        <TabsContent value="denied" className="mt-4">{renderList(denied, 'No denied donations')}</TabsContent>
        <TabsContent value="completed" className="mt-4">
          {isLoading ? renderList(completed, '') : completed.length === 0 ? <EmptyState msg="No completed donations" /> : (
            <div className="grid gap-4 md:grid-cols-2">
              {completed.map(d => (
                <DonationCard key={d.id} donation={d} isNgo={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

    </div>
  );
}