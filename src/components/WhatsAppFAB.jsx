import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Phone, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function buildWhatsAppLink(phone, message) {
  if (!phone || !/^\d{10}$/.test(phone)) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default function WhatsAppFAB({ user }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(
    `Hello, I'm using Food Bridge to coordinate food donations. I'd like to get in touch regarding a food donation. Please let me know if you're available.`
  );
  const [error, setError] = useState('');

  const handleSend = () => {
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    const link = buildWhatsAppLink(phone, message);
    if (link) window.open(link, '_blank');
  };

  return (
    <>
      {/* FAB button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 280 }}
              className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl shadow-black/10 p-5 w-80"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shadow-sm">
                  <MessageCircle className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-sm text-foreground">Contact via WhatsApp</h3>
                  <p className="text-[11px] text-muted-foreground">Food Bridge quick contact</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Phone number */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/70">Phone Number (10 digits)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={e => {
                        setError('');
                        setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      }}
                      className="pl-9 h-9 rounded-xl text-sm"
                      maxLength={10}
                    />
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/70">Message</Label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    className="w-full text-sm rounded-xl border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>

                <Button
                  onClick={handleSend}
                  className="w-full h-9 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold shadow-sm shadow-green-200 dark:shadow-green-900/30"
                >
                  <Send className="w-3.5 h-3.5 mr-2" />
                  Open WhatsApp
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB toggle */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(!open)}
          className="w-14 h-14 rounded-2xl bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-xl shadow-green-400/30 dark:shadow-green-900/40 transition-colors"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <motion.div key="wa" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageCircle className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}