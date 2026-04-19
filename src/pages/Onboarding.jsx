import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { HandHeart, Building2, Phone, Utensils, ArrowRight, Sparkles, MapPin } from 'lucide-react';

import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { toast } from 'sonner';
import LocationPicker from '@/components/map/LocationPicker';

export default function Onboarding() {
  const { user, updateUser } = useCurrentUser();
  const [role, setRole] = useState('donor');
  const [mobile, setMobile] = useState('');
  const [orgName, setOrgName] = useState('');
  const [ngoLocation, setNgoLocation] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (role === 'ngo' && !orgName.trim()) {
      toast.error('Organization name is required for NGOs');
      return;
    }
    if (role === 'ngo' && !ngoLocation) {
      toast.error('Please set your NGO office location on the map');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        email: user?.email,
        full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
        user_type: role,
        mobile,
        ...(role === 'ngo' && {
          organization_name: orgName.trim(),
          latitude: ngoLocation.lat,
          longitude: ngoLocation.lng,
          address: ngoLocation.address || '',
        }),
      };
      await updateUser(payload);
      toast.success('Welcome to Food Bridge!');
      window.location.href = '/';
    } catch (err) {
      setSaving(false);
      const msg = err?.response?.data?.message || err?.message || 'Failed to save profile. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0F2057 0%, #1E3A8A 40%, #2563EB 70%, #3B82F6 100%)' }}
    >
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2 blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-300/10 translate-x-1/3 translate-y-1/3 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="w-18 h-18 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-5 shadow-xl border border-white/20"
            style={{ width: 72, height: 72 }}
          >
            <Utensils className="w-9 h-9 text-white" />
          </motion.div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Welcome to Food Bridge</h1>
          <p className="text-blue-200/80 mt-2.5 text-sm">Set up your profile to start making a difference</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">I am a...</Label>
              <RadioGroup value={role} onValueChange={setRole} className="grid grid-cols-2 gap-3">
                {[
                  { value: 'donor', label: 'Food Donor', sub: 'I want to donate food', Icon: HandHeart },
                  { value: 'ngo', label: 'NGO', sub: 'I collect & distribute food', Icon: Building2 },
                ].map(({ value, label, sub, Icon }) => (
                  <Label
                    key={value}
                    htmlFor={value}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.01]
                      ${role === value
                        ? 'border-blue-500 bg-gradient-to-b from-blue-50 to-blue-50/50 dark:from-blue-900/30 dark:to-blue-900/10 shadow-md shadow-blue-100'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                  >
                    <RadioGroupItem value={value} id={value} className="sr-only" />
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${role === value ? 'bg-blue-500 shadow-sm shadow-blue-200' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <Icon className={`w-5 h-5 ${role === value ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <span className={`font-semibold text-sm ${role === value ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      {label}
                    </span>
                    <span className="text-[11px] text-gray-400 text-center leading-tight">{sub}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* Mobile */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="10-digit number (e.g. 9876543210)"
                    value={mobile}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="pl-10 rounded-xl border-gray-200 focus:border-blue-500 h-11"
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  Used for WhatsApp contact — no country code needed
                </p>
              </div>
            </div>

            {/* NGO fields */}
            <AnimatePresence>
              {role === 'ngo' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Organization Name</Label>
                    <Input
                      placeholder="Your NGO / organization name"
                      value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      className="rounded-xl border-gray-200 focus:border-blue-500 h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      NGO Office Location <span className="text-blue-500">*</span>
                    </Label>
                    <p className="text-xs text-gray-400">Pin your office location — used for matching nearby donations</p>
                    <div className="rounded-xl overflow-hidden border border-gray-200">
                      <LocationPicker value={ngoLocation} onChange={setNgoLocation} height="240px" />
                    </div>
                    {ngoLocation && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        Location set: {ngoLocation.lat.toFixed(4)}, {ngoLocation.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={saving}
              className="w-full h-12 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-all hover:scale-[1.01]"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Get Started <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-blue-200/60 text-xs mt-5">Food Bridge — Connecting donors &amp; NGOs</p>
      </motion.div>
    </div>
  );
}