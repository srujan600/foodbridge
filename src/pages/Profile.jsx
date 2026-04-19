import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, Building2, Save, Shield, AlertTriangle, Trash2 } from 'lucide-react';

import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function Profile() {
  const { user, updateUser } = useCurrentUser();
  const [mobile, setMobile]   = useState(user?.mobile || '');
  const [orgName, setOrgName] = useState(user?.organization_name || '');
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingDelete, setSavingDelete] = useState(false);

  const handleDeleteAccount = async () => {
    setSavingDelete(true);
    try {
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success('Your account has been successfully deleted.');
    } catch (err) {
      toast.error('Failed to delete account. Note: You must configure the SQL RPC script first!');
      console.error(err);
      setSavingDelete(false);
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (mobile && !/^\d{10}$/.test(mobile)) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }
    setSaving(true);
    try {
      await updateUser({ mobile, organization_name: orgName, address });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 p-3.5 bg-secondary/60 rounded-xl">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-sm text-foreground">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account information</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        {/* Avatar hero */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 p-6 flex items-center gap-5 shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-2xl font-bold text-white">
              {(user?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-white">{user?.full_name || 'User'}</h2>
            <p className="text-blue-200 text-sm">{user?.email}</p>
            <Badge className="mt-1.5 bg-white/20 text-white border-white/30 text-xs capitalize hover:bg-white/30">
              {user?.user_type || 'donor'}
            </Badge>
          </div>
        </div>

        {/* Read-only info */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Account Information
            </CardTitle>
            <CardDescription className="text-sm">Managed by the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={User}   label="Full Name" value={user?.full_name} />
            <InfoRow icon={Mail}   label="Email"     value={user?.email} />
            <InfoRow icon={Shield} label="Role"      value={user?.user_type || 'donor'} />
          </CardContent>
        </Card>

        {/* Editable info */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base">Edit Profile</CardTitle>
            <CardDescription className="text-sm">Update your contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medium text-sm flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" /> Mobile Number
              </Label>
              <Input
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="rounded-xl h-11"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">Used for WhatsApp contact by NGOs</p>
            </div>

            {user?.user_type === 'ngo' && (
              <div className="space-y-2">
                <Label className="font-medium text-sm flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" /> Organization Name
                </Label>
                <Input
                  placeholder="Your NGO name"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="font-medium text-sm">Default Address</Label>
              <Input
                placeholder="Your default address"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 font-semibold shadow-sm shadow-blue-200 dark:shadow-blue-900/30"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Changes
                </span>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="rounded-2xl border-destructive/20 shadow-sm overflow-hidden">
          <CardHeader className="bg-destructive/5 pb-4">
            <CardTitle className="font-heading text-base text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
            </CardTitle>
            <CardDescription className="text-sm">
              Permanently delete your account and all associated data. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 bg-destructive/5 border-t border-destructive/10">
            {!deleting ? (
              <Button
                variant="destructive"
                onClick={() => setDeleting(true)}
                className="w-full sm:w-auto rounded-xl hover:bg-destructive/90"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Account
              </Button>
            ) : (
              <div className="space-y-4 animation-in fade-in slide-in-from-top-2">
                <p className="text-sm font-medium text-destructive">Are you absolutely sure you want to delete your account?</p>
                <div className="flex flex-col sm:flex-row gap-3">
                   <Button
                    variant="outline"
                    onClick={() => setDeleting(false)}
                    className="flex-1 rounded-xl h-11"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={savingDelete}
                    className="flex-1 rounded-xl h-11"
                  >
                    {savingDelete ? 'Deleting...' : 'Yes, Delete My Account'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}