import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function StatsCard({ title, value, icon: Icon, gradient, delay = 0, to }) {
  const CardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow ${to ? 'cursor-pointer' : ''}`}
      style={{ background: gradient }}
    >
      {/* Decorative circle */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-white/10" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
          <p className="text-3xl font-heading font-bold text-white">{value}</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  return to ? <Link to={to} className="block">{CardContent}</Link> : CardContent;
}