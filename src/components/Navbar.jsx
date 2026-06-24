'use client';

import React, { useState } from 'react';
import { MapPin, Search, User, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppointments } from '@/context/AppointmentsContext';

const Navbar = ({ locations = [], onLocationChange }) => {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState('All India');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { appointments, loading } = useAppointments();

  // Count only upcoming, scheduled appointments
  const pendingAppointments = appointments.filter(
    (appt) => appt.status === 'Scheduled'
  );
  const pendingCount = pendingAppointments.length;
  const locationOptions = [
    { city: 'All India', state: '' },
    ...locations,
  ];

  const filteredLocations = locationOptions.filter((location) =>
    `${location.city} ${location.state}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCitySelect = (location) => {
    setSelectedCity(location.city);
    if (onLocationChange) {
      onLocationChange(location);
    }
    setShowCityDropdown(false);
    setSearchQuery('');
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  return (
    <nav className="bg-dark-bg-secondary/95 border-b border-dark-border shadow-dark-lg sticky top-0 z-50 backdrop-blur-xs">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* ... left section unchanged ... */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="text-xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">HomeMakers</span>
          </div>

          <div className="relative">
            <button
              onMouseEnter={() => setShowCityDropdown(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-dark-bg-hover transition text-dark-text-secondary font-medium"
            >
              <span>{selectedCity}</span>
            </button>

            {showCityDropdown && (
              <div
                onMouseEnter={() => setShowCityDropdown(true)}
                onMouseLeave={() => setShowCityDropdown(false)}
                className="absolute top-full mt-2 w-72 bg-dark-bg-tertiary rounded-lg shadow-dark-xl border border-dark-border p-4 left-0 z-50"
              >
                <div className="mb-4 relative">
                  <Search size={18} className="absolute left-3 top-2.5 text-dark-text-muted" />
                  <input
                    type="text"
                    placeholder="Search cities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-dark-border rounded-lg bg-dark-bg-secondary text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-primary placeholder:text-dark-text-muted text-sm"
                    autoFocus
                  />
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((location) => (
                      <button
                        key={`${location.state}-${location.city}`}
                        onClick={() => handleCitySelect(location)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition ${
                          selectedCity === location.city
                            ? 'bg-accent-primary text-white font-semibold'
                            : 'text-dark-text-secondary hover:bg-dark-bg-hover'
                        }`}
                      >
                        <span className="block">{location.city}</span>
                        {location.state && (
                          <span className="block text-xs opacity-70">{location.state}</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="text-dark-text-muted text-sm text-center py-4">No cities found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-6">
            <a href="#" className="text-dark-text-secondary font-medium hover:text-accent-primary transition">Buy</a>
            <a href="/sell" className="text-dark-text-secondary font-medium hover:text-accent-primary transition">Sell</a>
            <a href="#" className="text-dark-text-secondary font-medium hover:text-accent-primary transition">About us</a>
          </div>

          {/* Profile Icon with Badge */}
          <button
            onClick={handleProfileClick}
            className="relative p-2 rounded-full hover:bg-dark-bg-hover transition group"
            title={pendingCount > 0 ? `${pendingCount} upcoming appointment${pendingCount > 1 ? 's' : ''}` : undefined}
          >
            <User size={24} className="text-dark-text-secondary" />

            {!loading && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-dark-bg-secondary">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}

            {/* Tooltip on hover */}
            {pendingCount > 0 && (
              <span className="absolute top-full right-0 mt-2 w-max px-3 py-1.5 bg-dark-bg-tertiary border border-dark-border rounded-lg text-xs text-dark-text-secondary opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap shadow-dark-lg">
                You have {pendingCount} pending appointment{pendingCount > 1 ? 's' : ''}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;