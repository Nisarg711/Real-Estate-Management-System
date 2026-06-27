'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

const UserCard = ({ userType = {}, image = null }) => {
  const {
    id = 1,
    title = 'Buyers',
    description = 'Find your perfect property',
    buttonText = 'Buy Now',
  } = userType;

  return (
    <div className="relative h-80 rounded-lg overflow-hidden group cursor-pointer border border-dark-border shadow-dark-lg hover:border-accent-primary/40 transition">
      {/* Background Image Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-bg-tertiary via-dark-bg-secondary to-accent-primary/10 flex items-center justify-center">
        <p className="text-dark-text-muted text-sm">Background Image</p>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:bg-black/50 dark:group-hover:bg-black/60 transition" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-8">
        {/* Top Section */}
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-3xl font-bold text-dark-text dark:text-white mb-3">{title}</h3>
          <p className="text-dark-text-secondary dark:text-white/80 text-sm leading-relaxed max-w-xs">
            {description}
          </p>
        </div>

        {/* Bottom Section - Button */}
        <div>
          <button className="flex items-center gap-2 text-accent-primary dark:text-accent-light hover:text-accent-dark dark:hover:text-accent-primary hover:gap-3 transition-all duration-300 group/btn">
            <span className="text-sm font-semibold tracking-wide">{buttonText}</span>
            <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
