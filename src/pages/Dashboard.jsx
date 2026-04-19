import React, { useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';

import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, CheckCircle, Clock, TrendingUp, PlusCircle, MapPin, ArrowRight, Inbox, Sparkles, Heart, Code2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import StatsCard from '@/components/donations/StatsCard';
import DonationCard from '@/components/donations/DonationCard';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { getDistanceKm } from '@/lib/utils/distance';
import { toast } from 'sonner';

const donorGradients = [
  'linear-gradient(135deg, #2563EB, #3B82F6)',
  'linear-gradient(135deg, #F59E0B, #FBBF24)',
  'linear-gradient(135deg, #3B82F6, #60A5FA)',
  'linear-gradient(135deg, #10B981, #34D399)',
];
const ngoGradients = [
  'linear-gradient(135deg, #F59E0B, #FBBF24)',
  'linear-gradient(135deg, #2563EB, #3B82F6)',
  'linear-gradient(135deg, #10B981, #34D399)',
  'linear-gradient(135deg, #8B5CF6, #A78BFA)',
];

export default function Dashboard() {
  const { user } = useOutletContext();
  const { position } = useGeolocation();
  const isNgo = user?.user_type === 'ngo';
  const queryClient = useQueryClient();

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['donations-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Donation')
        .select('*')
        .order('created_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    const channel = supabase.channel('dashboard-donations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Donation' }, () => {
        queryClient.invalidateQueries({ queryKey: ['donations-dashboard'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const myDonations = isNgo
    ? donations.filter(d => d.accepted_by_email === user?.email)
    : donations.filter(d => d.created_by === user?.email);

  // Synchronously calculate Donor's global lifetime rating directly from memory cache
  let donorRep = { total: 0, count: 0, avg: 'N/A' };
  if (!isNgo) {
    myDonations.forEach(d => {
      if (d.status === 'completed' && d.notes) {
        const ratingMatch = d.notes.match(/\[Donor Rating: (\d)\/5\]/);
        if (ratingMatch && ratingMatch[1]) {
          donorRep.total += parseInt(ratingMatch[1]);
          donorRep.count++;
        }
      }
    });
    if (donorRep.count > 0) donorRep.avg = (donorRep.total / donorRep.count).toFixed(1);
  }

  const pendingDonations = donations.filter(d => d.status === 'pending');

  const pendingInRange = isNgo && user?.latitude && user?.longitude
    ? pendingDonations.filter(d => {
        if (!d.latitude || !d.longitude) return true;
        const dist = getDistanceKm(
          parseFloat(user.latitude), parseFloat(user.longitude),
          parseFloat(d.latitude), parseFloat(d.longitude)
        );
        return dist <= 30; // 30km smart matching system
      })
    : pendingDonations;

  const handleAccept = async (donation) => {
    try {
      const { error } = await supabase.from('Donation').update({
        status: 'accepted',
        accepted_by_email: user?.email,
        accepted_by_name: user?.organization_name || user?.full_name || 'NGO',
      }).eq('id', donation.id);
      if (error) throw error;
      toast.success('Donation accepted! Contact the donor to arrange pickup.');
      queryClient.invalidateQueries({ queryKey: ['donations-dashboard'] });
    } catch {
      toast.error('Failed to accept donation. Please try again.');
    }
  };

  const handleDeny = async (donation) => {
    try {
      const { error } = await supabase.from('Donation').update({ status: 'denied' }).eq('id', donation.id);
      if (error) throw error;
      toast.info('Donation denied.');
      queryClient.invalidateQueries({ queryKey: ['donations-dashboard'] });
    } catch {
      toast.error('Failed to deny donation. Please try again.');
    }
  };

  const stats = isNgo
    ? [
        { title: 'Available Nearby', value: isLoading ? '—' : pendingInRange.length, icon: Package, gradient: ngoGradients[0], to: '/map' },
        { title: 'Accepted by Me',   value: isLoading ? '—' : myDonations.filter(d => d.status === 'accepted').length, icon: CheckCircle, gradient: ngoGradients[1], to: '/accepted?tab=accepted' },
        { title: 'Completed',        value: isLoading ? '—' : myDonations.filter(d => d.status === 'completed').length, icon: TrendingUp, gradient: ngoGradients[2], to: '/accepted?tab=completed' },
        { title: 'Total Listed',     value: isLoading ? '—' : pendingInRange.length, icon: Package, gradient: ngoGradients[3], to: '/map' },
      ]
    : [
        { title: 'My Donations',   value: isLoading ? '—' : myDonations.length, icon: Package, gradient: donorGradients[0], to: '/my-donations?tab=all' },
        { title: 'Pending Pickup', value: isLoading ? '—' : myDonations.filter(d => d.status === 'pending').length, icon: Clock, gradient: donorGradients[1], to: '/my-donations?tab=pending' },
        { title: 'Accepted',       value: isLoading ? '—' : myDonations.filter(d => d.status === 'accepted').length, icon: CheckCircle, gradient: donorGradients[2], to: '/my-donations?tab=accepted' },
        { title: 'Completed',      value: isLoading ? '—' : myDonations.filter(d => d.status === 'completed').length, icon: TrendingUp, gradient: donorGradients[3], to: '/my-donations?tab=completed' },
      ];

  const displayList = isNgo ? pendingInRange.slice(0, 6) : myDonations.slice(0, 6);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #0F2057 0%, #1E3A8A 45%, #2563EB 100%)' }}
      >
        {/* Decorative blur */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 translate-x-1/4 -translate-y-1/4 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-blue-400/10 blur-xl pointer-events-none" />

        <div className="relative p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 border-b border-transparent">
              <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                {isNgo ? <Heart className="w-3.5 h-3.5 text-white" /> : <Sparkles className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className="text-blue-200/70 text-xs font-medium uppercase tracking-wider flex items-center gap-2">
                {isNgo ? 'NGO Dashboard' : 'Donor Dashboard'}
                {!isNgo && donorRep.count > 0 && (
                  <span className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 px-1.5 py-0.5 rounded-md font-bold tracking-normal backdrop-blur-md shadow-sm">
                    {donorRep.avg} <Star className="w-3 h-3 fill-yellow-400" /> ({donorRep.count})
                  </span>
                )}
              </div>
            </div>
            <h1 className="text-xl lg:text-2xl font-heading font-bold text-white mt-1">
              Hello, {user?.full_name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="text-blue-200/80 text-sm mt-1">
              {isNgo
                ? `${pendingInRange.length} donation${pendingInRange.length !== 1 ? 's' : ''} available near you`
                : `You've donated ${myDonations.length} time${myDonations.length !== 1 ? 's' : ''}. Thank you!`}
            </p>
          </div>
          <div className="flex-shrink-0">
            {!isNgo && (
              <Button asChild className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-sm border-0 rounded-xl h-10 px-5">
                <Link to="/donate">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Donate Food
                </Link>
              </Button>
            )}
            {isNgo && (
              <Button asChild className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-sm border-0 rounded-xl h-10 px-5">
                <Link to="/map">
                  <MapPin className="w-4 h-4 mr-2" />
                  View Map
                </Link>
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatsCard key={stat.title} {...stat} delay={i * 0.08} />
        ))}
      </div>

      {/* Recent activity */}
      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="font-heading text-base font-semibold">
            {isNgo ? 'Available Donations' : 'My Recent Donations'}
          </CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/10 rounded-xl">
            <Link to={isNgo ? '/map' : '/my-donations'}>
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-2xl border border-border p-5 space-y-3">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-full mt-2" />
                </div>
              ))}
            </div>
          ) : displayList.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Inbox className="w-8 h-8 text-primary/40" />
              </div>
              <p className="text-muted-foreground font-medium">
                {isNgo ? 'No donations available nearby' : 'No donations yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isNgo ? 'Check back soon — new donations appear in real-time.' : 'Start making a difference by donating food today.'}
              </p>
              {!isNgo && (
                <Button asChild className="mt-2 bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl">
                  <Link to="/donate">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Donate Now
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {displayList.map(donation => (
                <DonationCard
                  key={donation.id}
                  donation={donation}
                  userPosition={position}
                  onAccept={isNgo ? handleAccept : undefined}
                  onDeny={isNgo ? handleDeny : undefined}
                  showActions
                  isNgo={isNgo}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}