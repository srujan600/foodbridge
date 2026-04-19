import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { List, Map as MapIcon, Filter, MapPin, Inbox } from 'lucide-react';
import DonationMap from '@/components/map/DonationMap';
import DonationCard from '@/components/donations/DonationCard';
import { getDistanceKm } from '@/lib/utils/distance';
import { toast } from 'sonner';

const MAX_NGO_DISTANCE_KM = 30;

export default function MapView() {
  const { user } = useOutletContext();
  const { position } = useGeolocation();
  const isNgo = user?.user_type === 'ngo';
  const [viewMode, setViewMode] = useState('map');
  const [distanceFilter, setDistanceFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['map-donations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('Donation').select('*').order('created_date', { ascending: false }).limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['ngo-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });
  
  const { data: donorStats = {} } = useQuery({
    queryKey: ['donor-stats-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Donation')
        .select('created_by, notes')
        .eq('status', 'completed');
      if (error) throw error;
      
      const stats = {};
      (data || []).forEach(d => {
        if (!d.created_by) return;
        if (!stats[d.created_by]) stats[d.created_by] = { total: 0, count: 0, feedbacks: [] };
        const s = stats[d.created_by];
        s.count++;
        
        const rMatch = d.notes?.match(/\[Donor Rating: (\d)\/5\]/);
        if (rMatch && rMatch[1]) s.total += parseInt(rMatch[1]);
        
        const fMatch = d.notes?.match(/\[Feedback: (.*?)\]/);
        if (fMatch && fMatch[1] && fMatch[1].trim()) s.feedbacks.push(fMatch[1].trim());
      });
      return stats;
    },
    staleTime: 60000,
  });
  const ngoUsers = allUsers.filter(u => u.user_type === 'ngo' && u.latitude && u.longitude);

  useEffect(() => {
    const channel = supabase.channel('map-donations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Donation' }, () => {
        queryClient.invalidateQueries({ queryKey: ['map-donations'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const pendingDonations = donations.filter(d => d.status === 'pending');

  // For NGO: also filter within 30km of their fixed office location
  const pendingInRange = isNgo && user?.latitude && user?.longitude
    ? pendingDonations.filter(d => {
        if (!d.latitude || !d.longitude) return true; // show if no coords
        const dist = getDistanceKm(parseFloat(user.latitude), parseFloat(user.longitude), parseFloat(d.latitude), parseFloat(d.longitude));
        return dist <= MAX_NGO_DISTANCE_KM;
      })
    : pendingDonations;

  const filteredDonations = distanceFilter === 'all' || !position
    ? pendingInRange
    : pendingInRange.filter(d => {
        if (!d.latitude || !d.longitude) return false;
        return getDistanceKm(position.lat, position.lng, d.latitude, d.longitude) <= parseInt(distanceFilter);
      });

  const handleAccept = async (donation) => {
    try {
      const { error } = await supabase.from('Donation').update({
        status: 'accepted',
        accepted_by_email: user?.email,
        accepted_by_name: user?.organization_name || user?.full_name || 'NGO',
      }).eq('id', donation.id);
      if (error) throw error;
      toast.success('Donation accepted! Contact the donor to arrange pickup.');
      queryClient.invalidateQueries({ queryKey: ['map-donations'] });
    } catch {
      toast.error('Failed to accept donation. Please try again.');
    }
  };

  const handleDeny = async (donation) => {
    try {
      const { error } = await supabase.from('Donation').update({ status: 'denied' }).eq('id', donation.id);
      if (error) throw error;
      toast.info('Donation denied.');
      queryClient.invalidateQueries({ queryKey: ['map-donations'] });
    } catch {
      toast.error('Failed to deny donation. Please try again.');
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {isNgo ? 'Find Donations' : 'Donation Map'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? 'Loading...' : `${filteredDonations.length} pending donation${filteredDonations.length !== 1 ? 's' : ''} available`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={distanceFilter} onValueChange={setDistanceFilter}>
            <SelectTrigger className="w-[150px] rounded-xl border-border">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl z-[9999]">
              <SelectItem value="all">All distances</SelectItem>
              <SelectItem value="5">Within 5 km</SelectItem>
              <SelectItem value="10">Within 10 km</SelectItem>
              <SelectItem value="25">Within 25 km</SelectItem>
              <SelectItem value="50">Within 50 km</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border border-border rounded-xl overflow-hidden shadow-sm">
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('map')}
              className={`rounded-none h-9 ${viewMode === 'map' ? 'bg-primary text-primary-foreground' : ''}`}
            >
              <MapIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`rounded-none h-9 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'map' ? (
        <div className="flex-1 min-h-[400px] lg:h-[calc(100vh-220px)]">
          {isLoading ? (
            <Skeleton className="w-full h-full rounded-2xl" />
          ) : (
            <DonationMap
              donations={filteredDonations}
              userPosition={position}
              onAccept={isNgo ? handleAccept : undefined}
              showAcceptButton={isNgo}
              ngos={!isNgo ? ngoUsers : []}
              donorStats={donorStats}
            />
          )}
        </div>
      ) : (
        <div className="flex-1">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl border border-border p-5 space-y-3">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-full mt-2" />
                </div>
              ))}
            </div>
          ) : filteredDonations.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Inbox className="w-7 h-7 text-primary/40" />
              </div>
              <p className="text-muted-foreground font-medium">No donations found in this area</p>
              <p className="text-sm text-muted-foreground">Try expanding the distance filter</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDonations.map(d => (
                <DonationCard
                  key={d.id}
                  donation={d}
                  userPosition={position}
                  onAccept={isNgo ? handleAccept : undefined}
                  onDeny={isNgo ? handleDeny : undefined}
                  showActions
                  isNgo={isNgo}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}