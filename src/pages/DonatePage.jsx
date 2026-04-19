import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Send, UtensilsCrossed, MapPin, AlignLeft, Calendar } from 'lucide-react';

import { toast } from 'sonner';
import LocationPicker from '@/components/map/LocationPicker';

const FOOD_TYPES = [
  'Cooked Meals', 'Raw Vegetables', 'Fruits', 'Rice & Grains',
  'Bread & Bakery', 'Dairy Products', 'Packaged Food', 'Beverages', 'Mixed / Other'
];

export default function DonatePage() {
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ food_type: '', quantity: '', address: '', notes: '', expiry_time: '' });
  const [location, setLocation] = useState(null);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.food_type || !form.quantity || !form.address) {
      toast.error('Please fill in all required fields (food type, quantity, address)');
      return;
    }
    if (!location) {
      toast.error('Please pin your pickup location on the map');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('Donation').insert({
        ...form,
        latitude: location.lat,
        longitude: location.lng,
        status: 'pending',
        donor_name: user?.full_name || 'Anonymous',
        donor_email: user?.email || '',
        donor_mobile: user?.mobile || '',
        created_by: user?.email || '',
        created_date: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('Donation posted! Nearby NGOs will be notified.');
      navigate('/my-donations');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to post donation. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-xl hover:bg-primary/10 hover:text-primary"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Donate Food</h1>
          <p className="text-muted-foreground text-sm">Share your surplus food with those in need</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-sm">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="font-heading text-base">Food Details</CardTitle>
                <CardDescription className="text-sm">All starred fields are required</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Food type + quantity */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-medium text-sm">Food Type <span className="text-blue-500">*</span></Label>
                  <Select value={form.food_type} onValueChange={v => handleChange('food_type', v)}>
                    <SelectTrigger className="rounded-xl h-11 border-border focus:ring-primary/20">
                      <SelectValue placeholder="Select food type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {FOOD_TYPES.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-sm">Quantity <span className="text-blue-500">*</span></Label>
                  <Input
                    placeholder="e.g., 5 kg, 10 plates"
                    value={form.quantity}
                    onChange={e => handleChange('quantity', e.target.value)}
                    className="rounded-xl h-11"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label className="font-medium text-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" /> Pickup Address <span className="text-blue-500">*</span>
                </Label>
                <Input
                  placeholder="Full address for pickup"
                  value={form.address}
                  onChange={e => handleChange('address', e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>

              {/* Expiry */}
              <div className="space-y-2">
                <Label className="font-medium text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" /> Best Before / Pickup By
                </Label>
                <Input
                  type="datetime-local"
                  value={form.expiry_time}
                  onChange={e => handleChange('expiry_time', e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="font-medium text-sm flex items-center gap-1.5">
                  <AlignLeft className="w-4 h-4 text-primary" /> Additional Notes
                </Label>
                <Textarea
                  placeholder="Special instructions for pickup..."
                  value={form.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </div>

              {/* Map picker */}
              <div className="space-y-2">
                <Label className="font-medium text-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" /> Pickup Location on Map <span className="text-blue-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">Click the map or search to pin your exact location</p>
                <LocationPicker value={location} onChange={setLocation} height="340px" />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1 rounded-xl h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 shadow-sm shadow-blue-200 dark:shadow-blue-900/30 font-semibold"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Posting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" /> Post Donation
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}