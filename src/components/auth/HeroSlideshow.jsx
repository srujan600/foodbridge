import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play } from 'lucide-react';

const IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80',
    title: 'Reduce Waste, Feed Lives',
    subtitle: 'Turn leftovers into lifelines',
  },
  {
    url: 'https://images.unsplash.com/photo-1617450365226-9bf28c04e130?auto=format&fit=crop&q=80',
    title: 'Stop Food Waste',
    subtitle: 'Make an immediate community impact',
  },
  {
    url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80',
    title: 'Support Communities',
    subtitle: 'Real-time routing for fast food rescue',
  }
];

export default function HeroSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden lg:rounded-3xl shadow-xl">
      <AnimatePresence initial={false}>
        <motion.img
          key={currentIndex}
          src={IMAGES[currentIndex].url}
          alt={IMAGES[currentIndex].title}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.65, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent pointer-events-none" />

      {/* Top Bar: Logo & Pause Button */}
      <div className="absolute top-0 left-0 w-full p-6 lg:p-8 flex items-start justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            {/* Minimal colorful logo */}
            <div className="flex">
              <span className="w-2 h-2 rounded-full bg-red-400 -mr-0.5" />
              <span className="w-2 h-2 rounded-full bg-yellow-400 z-10" />
              <span className="w-2 h-2 rounded-full bg-green-400 -ml-0.5" />
            </div>
          </div>
          <div>
            <h2 className="text-white font-bold text-sm leading-tight">Food Bridge</h2>
            <p className="text-gray-300 text-xs mt-0.5">Connecting donors & NGOs</p>
          </div>
        </div>

        <button
          onClick={() => setIsPaused(!isPaused)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition text-white text-xs font-medium border border-white/10"
        >
          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          {isPaused ? 'Play' : 'Paused'}
        </button>
      </div>

      {/* Slide text content anchored to bottom-left */}
      <div className="absolute bottom-0 left-0 w-full p-6 lg:p-10 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-blue-200/80 uppercase tracking-widest text-xs font-bold mb-3 font-heading">
              Food Bridge
            </p>
            <h1 className="text-3xl lg:text-5xl font-bold font-heading text-white mb-3 tracking-tight shadow-sm">
              {IMAGES[currentIndex].title}
            </h1>
            <p className="text-base lg:text-lg text-gray-300 font-medium max-w-lg mb-8">
              {IMAGES[currentIndex].subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="flex items-center gap-2">
          {IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 rounded-full h-1 ${
                currentIndex === idx ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
