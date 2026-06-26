'use client';
import { useState,useEffect } from 'react';
import { MapPin, Search } from 'lucide-react';

const SearchBar = ({ onLocationRequest, location, locationLoading, userAddress }) => {
  const [activeFilter, setActiveFilter] = useState('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);


  useEffect(() => {
  if (searchQuery.trim().length < 2) {
    setSuggestions([]);
    setShowSuggestions(false);
    return;
  }
 async function fetchsuggestions() {
  setSuggestionsLoading(true);
  try {
    /*encodeURIComponent(searchQuery) — without it, queries containing spaces or
     special characters could break the URL. */
     const trimmedQuery = searchQuery.trim();
    const result = await fetch(`/api/search/suggestions?query=${encodeURIComponent(trimmedQuery)}`);
    const res = await result.json();
    console.log(res)
    setSuggestions(res.suggestions || []);
    setShowSuggestions(true);
  } catch (err) {
    console.error("Suggestions fetch error:", err);
    setSuggestions([]);
  } finally {
    setSuggestionsLoading(false);
  }
}

  const timer=setTimeout(()=>{
    fetchsuggestions();
  },300);
return () => clearTimeout(timer);  // ← add this
}, [searchQuery]);


  const handleSearch = () => {
    console.log('Search query:', searchQuery);
    console.log('Filter:', activeFilter);
  };

  return (
    <div className="w-full bg-dark-bg-secondary/95 shadow-dark-xl rounded-lg overflow-hidden mx-auto max-w-6xl -mt-8 relative z-20 border border-dark-border backdrop-blur-xs">
      <div className="flex items-center px-6 py-4 gap-4">
        
        {/* Filter Buttons */}
        <div className="flex gap-2 border-r border-dark-border pr-6">
          {[
            { id: 'buy', label: 'Buy' },
            { id: 'rent', label: 'Rent' },
            { id: 'Both', label: 'Both' },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                activeFilter === filter.id
                  ? 'bg-accent-primary text-white shadow-dark-md'
                  : 'bg-dark-bg-tertiary text-dark-text-secondary hover:bg-dark-bg-hover'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex-1">
          <input
            type="text"
            placeholder={
              userAddress
                ? `${userAddress.suburb || userAddress.city || 'Your area'}`
                : "Search by locality, project, or landmark"
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-transparent focus:outline-none placeholder:text-dark-text-muted text-dark-text"
          />
        </div>

        {/* Location Button */}
        <button
          onClick={onLocationRequest}
          disabled={locationLoading}
          className={`p-2 hover:bg-dark-bg-hover rounded-lg transition ${
            location ? 'text-green-400' : 'text-accent-primary'
          } disabled:opacity-50`}
        >
          <MapPin size={22} />
        </button>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="p-2 bg-accent-primary hover:bg-accent-dark text-white rounded-lg transition shadow-dark-md"
        >
          <Search size={22} />
        </button>
      </div>

      {/* Address display when location is detected */}
      {userAddress && (
        <div className="px-6 pb-2 text-xs text-green-400">
          📍 {userAddress.suburb || userAddress.neighbourhood} {userAddress.city || userAddress.village}, {userAddress.state}, {userAddress.country}
        </div>
      )}
    </div>
  );
};

export default SearchBar;