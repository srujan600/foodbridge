import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistance, getDistanceKm } from '@/lib/utils/distance';
import { Clock, MapPin, Package, Check, X, Trash2, CheckCircle2, MessageCircle, Star, Quote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const statusConfig = {
  pending:   { bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', label: 'Pending' },
  accepted:  { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',     label: 'Accepted' },
  completed: { bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', label: 'Completed' },
  denied:    { bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',        label: 'Denied' },
};

export default function DonationCard({
  donation, userPosition, showActions, isNgo,
  onAccept, onDeny, onComplete, onDelete
}) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Fetch Donor's global historical rating dynamically (cached by React Query natively)
  const { data: donorReputation } = useQuery({
    queryKey: ['donor-reputation', donation.created_by],
    enabled: !!donation.created_by && isNgo,
    staleTime: 60000 * 5, // Cache for 5 mins to prevent heavy network spam
    queryFn: async () => {
      const { data } = await supabase
        .from('Donation')
        .select('notes')
        .eq('created_by', donation.created_by)
        .eq('status', 'completed');
        
      if (!data || data.length === 0) return null;
      let total = 0, count = 0;
      data.forEach(d => {
        const rMatch = d.notes?.match(/\[Donor Rating: (\d)\/5\]/);
        if (rMatch && rMatch[1]) {
          total += parseInt(rMatch[1]);
          count++;
        }
      });
      return count > 0 ? { avg: (total / count).toFixed(1), count } : null;
    }
  });

  const dist = userPosition && donation.latitude && donation.longitude
    ? getDistanceKm(userPosition.lat, userPosition.lng, parseFloat(donation.latitude), parseFloat(donation.longitude))
    : null;

  const st = statusConfig[donation.status] || statusConfig.pending;
  
  const createdDate = new Date(donation.created_date || new Date());
  const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true });

  const donorWaLink = donation.donor_mobile && /^\d{10}$/.test(donation.donor_mobile)
    ? `https://wa.me/91${donation.donor_mobile}?text=${encodeURIComponent(`Hello, I'm contacting regarding the food donation on FooBridge.`)}`
    : null;

  return (
    <Card className="rounded-2xl border-border shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
      <CardContent className="p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-heading font-semibold text-lg text-foreground line-clamp-1">{donation.food_type}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" /> {timeAgo}
            </div>
          </div>
          <Badge className={`${st.bg} border-0 shadow-none px-2.5 py-1 text-xs font-semibold rounded-lg`}>
            {st.label}
          </Badge>
        </div>

        {/* Details */}
        <div className="space-y-2 mt-2 flex-1">
          <div className="flex items-start gap-2.5 text-sm">
            <Package className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span className="text-foreground/90 font-medium">{donation.quantity}</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span className="text-muted-foreground line-clamp-2 leading-tight">
              {donation.address}
              {dist !== null && (
                <span className="block mt-0.5 font-semibold text-primary">
                  {formatDistance(dist)} <span className="text-muted-foreground font-normal text-xs ml-0.5">(air)</span>
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Donor / NGO Info */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex justify-between items-start">
            <p className="text-xs text-muted-foreground flex flex-col gap-0.5">
              {isNgo ? (
                <>
                  <span>Donor: <span className="font-medium text-foreground">{donation.donor_name || 'Anonymous'}</span></span>
                  {donorReputation && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded-md w-fit">
                      {donorReputation.avg} <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" /> ({donorReputation.count} pickups)
                    </span>
                  )}
                </>
              ) : donation.accepted_by_name ? (
                <>Accepted by: <span className="font-medium text-foreground">{donation.accepted_by_name}</span></>
              ) : (
                'Awaiting acceptance from nearby NGOs'
              )}
            </p>
          </div>

          {/* Render past Feedback if available */}
          {donation.notes && donation.notes.includes('[Donor Rating:') && (
            <div className="mt-2.5 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <Quote className="w-3.5 h-3.5 text-blue-500" /> NGO Feedback 
                <span className="text-yellow-500 flex items-center ml-auto">
                  {(donation.notes.match(/\[Donor Rating: (\d)\/5\]/) || [])[1]} <Star className="w-3 h-3 fill-yellow-400 ml-0.5" />
                </span>
              </div>
              {donation.notes.includes('[Feedback:') && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-5 italic line-clamp-3">
                  "{(donation.notes.match(/\[Feedback: (.*?)\]/) || [])[1]}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="mt-4 pt-1 flex gap-2">
            {/* NGO Pending Actions */}
            {isNgo && donation.status === 'pending' && onAccept && onDeny && (
              <>
                <Button variant="outline" size="sm" onClick={() => onDeny(donation)} className="flex-1 rounded-xl h-9 text-destructive border-destructive/20 hover:bg-destructive/10">
                  <X className="w-3.5 h-3.5 mr-1.5" /> Deny
                </Button>
                <Button size="sm" onClick={() => onAccept(donation)} className="flex-1 rounded-xl h-9 bg-blue-600 hover:bg-blue-700 text-white">
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Accept
                </Button>
              </>
            )}

            {/* NGO Accepted Actions */}
            {isNgo && donation.status === 'accepted' && onComplete && (
              !isCompleting ? (
                <Button size="sm" onClick={() => setIsCompleting(true)} className="flex-1 rounded-xl h-9 bg-emerald-500 hover:bg-emerald-600 text-white">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Mark Completed
                </Button>
              ) : (
                <div className="flex flex-col w-full gap-2.5 animation-in slide-in-from-bottom-2 fade-in bg-white dark:bg-gray-900 absolute bottom-0 left-0 p-4 border-t shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] rounded-b-2xl z-10 w-full">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Pickup Complete!</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full -mr-2" onClick={() => setIsCompleting(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Rate Donor:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 cursor-pointer transition-colors ${rating >= star ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm hover:scale-110' : 'text-gray-200 hover:text-gray-300'}`}
                          onClick={() => setRating(star)}
                        />
                      ))}
                    </div>
                  </div>

                  <textarea
                    placeholder="Optional: Leave feedback about this donor..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none h-16"
                  />

                  <Button
                    size="sm"
                    disabled={rating === 0}
                    onClick={() => {
                      const baseNotes = donation.notes ? donation.notes + ' ' : '';
                      const newPayload = `${baseNotes}[Donor Rating: ${rating}/5]${feedback.trim() ? ` [Feedback: ${feedback.trim()}]` : ''}`;
                      onComplete({ ...donation, notes: newPayload });
                      setIsCompleting(false);
                    }}
                    className="w-full rounded-xl h-10 mt-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 font-bold"
                  >
                    Confirm & Submit Feedback
                  </Button>
                </div>
              )
            )}
            
            {/* WhatsApp Contact Button */}
            {isNgo && donation.status === 'accepted' && donorWaLink && (
              <Button size="sm" asChild className="flex-1 rounded-xl h-9 bg-green-500 hover:bg-green-600 text-white shadow-sm shadow-green-200">
                <a href={donorWaLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5 fill-white" /> Contact Donor
                </a>
              </Button>
            )}

            {/* Donor Delete Action (only when pending) */}
            {!isNgo && donation.status === 'pending' && onDelete && (
              <Button variant="outline" size="sm" onClick={() => onDelete(donation)} className="w-full rounded-xl h-9 text-destructive border-destructive/20 hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Request
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}