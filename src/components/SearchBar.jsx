'use client';
import { useState, useEffect } from 'react';
import { MapPin, Search } from 'lucide-react';
import { useRef } from 'react';
import { useRouter } from "next/navigation";
import { X } from 'lucide-react';
const SearchBar = ({ onLocationRequest, location, locationLoading, userAddress }) => {
  const [activeFilter, setActiveFilter] = useState('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const searchContainerRef = useRef(null);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const router = useRouter();

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

    const timer = setTimeout(() => {
      fetchsuggestions();
    }, 300);
    return () => clearTimeout(timer);  // ← add this
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleSearch = async () => {
    if (selectedLocations.length === 0) {
      console.log('No locations selected');
      return;
    }

    try {
      const res = await fetch('/api/search/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations: selectedLocations }),
      });
      const data = await res.json();
      console.log("Search results: ", data);
      // Store results so the results page can read them
      //sessionStorage.setItem('searchResults', JSON.stringify(data.properties));
      // router.push('/search/results');
    } catch (err) {
      console.error('Search failed:', err);
    }
  };
  const handlesuggestionClick = (suggestion) => {
    if (suggestion.type == "property") {
      setShowSuggestions(false);
      router.push(`/property/${suggestion.apn}`);
    }
    if (suggestion.type == "city") {
      //Will do it later
      const city = {
        "city": suggestion.label,
        "state": suggestion.subtitle
      }
      if (selectedLocations.some((ele) => {
        return ((ele.city == city.city) && (city.state == ele.state));
      }) == false) {
        setSelectedLocations([...selectedLocations, city])
        setSearchQuery('');
        setShowSuggestions(false);
      }
    }
  }
  useEffect(() => {
    console.log("check:", selectedLocations)
  }, [selectedLocations])
  return (
    <div className="w-full bg-dark-bg-secondary/95 shadow-dark-xl rounded-lg overflow-visible mx-auto max-w-6xl -mt-8 relative z-20 border border-dark-border backdrop-blur-xs">
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
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${activeFilter === filter.id
                  ? 'bg-accent-primary text-white shadow-dark-md'
                  : 'bg-dark-bg-tertiary text-dark-text-secondary hover:bg-dark-bg-hover'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex-1 relative" ref={searchContainerRef}>
          {selectedLocations.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
              {selectedLocations.map((loc, idx) => (
                <span
                  key={`${loc.city}-${idx}`}
                  className="flex items-center gap-1.5 px-3 py-1 bg-accent-primary/10 text-accent-primary text-sm rounded-full border border-accent-primary/30"
                >
                  {loc.city}
                  <button onClick={() => {
                    setSelectedLocations(selectedLocations.filter((ele) => {
                      return ele.city !== loc.city;
                    }))
                  }}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            type="text"
            placeholder={
              userAddress
                ? `${userAddress.suburb || userAddress.city || 'Search based on City or title of Property'}`
                : "Search by locality, project, or landmark"
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-transparent focus:outline-none placeholder:text-dark-text-muted text-dark-text"
          />
          {/* dropdown goes here, absolutely positioned */}
          {showSuggestions && (
            <div className="absolute top-full left-0 mt-2 w-full bg-dark-bg-tertiary rounded-lg shadow-dark-xl border border-dark-border max-h-72 overflow-y-auto z-50">
              {suggestionsLoading ? (
                <p className="text-dark-text-muted text-sm text-center py-4">Searching...</p>
              ) : suggestions.length > 0 ? (
                <div className="py-2">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={`${suggestion.type}-${suggestion.label}-${idx}`}
                      onClick={() => {
                        handlesuggestionClick(suggestion);
                        console.log(suggestion)
                      }}
                      className="w-full flex items-center justify-between gap-3 text-left px-4 py-2.5 hover:bg-dark-bg-hover transition"
                    >
                      <div>
                        <span className="block text-dark-text font-medium text-sm">
                          {suggestion.label}
                        </span>
                        <span className="block text-dark-text-muted text-xs">
                          {suggestion.subtitle}
                        </span>
                      </div>
                      <span
                        className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${suggestion.type === 'property'
                            ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30'
                            : 'bg-dark-bg-secondary text-dark-text-secondary border-dark-border'
                          }`}
                      >
                        {suggestion.type === 'property' ? 'Property' : 'City'}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-dark-text-muted text-sm text-center py-4">No results found</p>
              )}
            </div>
          )}
        </div>

        {/* Location Button */}
        <button
          onClick={onLocationRequest}
          disabled={locationLoading}
          className={`p-2 hover:bg-dark-bg-hover rounded-lg transition ${location ? 'text-green-400' : 'text-accent-primary'
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