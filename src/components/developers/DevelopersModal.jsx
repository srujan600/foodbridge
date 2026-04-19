import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Github, Linkedin, Briefcase } from 'lucide-react';

export default function DevelopersModal({ open, onClose }) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-background w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-border"
        >
          {/* Header */}
          <div className="relative h-32 bg-gradient-to-br from-blue-700 to-blue-500 p-6 flex flex-col justify-end">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-white">
              <Heart className="w-5 h-5 text-red-400 fill-red-400" />
              <h2 className="text-xl font-heading font-bold">Meet the Developers</h2>
            </div>
            <p className="text-blue-100 text-sm mt-1">
              Built to reduce food waste globally
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 text-xl font-bold text-blue-700 dark:text-blue-400">
                  FB
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Food Bridge Initiative</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    An open-source project created to bridge the gap between food donors and NGOs. Built beautifully with modern web technologies.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-2xl p-4 text-center">
              <p className="text-sm text-foreground font-medium mb-3">Links & Resources</p>
              <div className="flex justify-center gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
                  <Github className="w-4 h-4" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
                  <Briefcase className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
