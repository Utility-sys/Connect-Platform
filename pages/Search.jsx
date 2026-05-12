import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, MapPin, Clock, Star, Filter, ChevronDown, List, Grid, X, Sparkles, ArrowRight } from 'lucide-react';
import { COLOMBO_LOCATIONS, CATEGORIES } from '../data/mockData';
import { useConnect } from '../context/ConnectContext';
import { imgSrc } from '../utils/api';

// ── fuzzy helper ─────────────────────────────────────────────────────────────
const levenshtein = (a, b) => {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = b[i - 1] === a[j - 1]
        ? m[i - 1][j - 1]
        : 1 + Math.min(m[i - 1][j - 1], m[i][j - 1], m[i - 1][j]);
    }
  }
  return m[b.length][a.length];
};

// ── type pill colour ─────────────────────────────────────────────────────────
const typeColour = (type) => {
  const map = {
    Cricket:       'bg-green-100   dark:bg-green-900/30  text-green-700   dark:text-green-400',
    Futsal:        'bg-blue-100    dark:bg-blue-900/30   text-blue-700    dark:text-blue-400',
    Basketball:    'bg-orange-100  dark:bg-orange-900/30 text-orange-700  dark:text-orange-400',
    Badminton:     'bg-yellow-100  dark:bg-yellow-900/30 text-yellow-700  dark:text-yellow-600',
    Swimming:      'bg-cyan-100    dark:bg-cyan-900/30   text-cyan-700    dark:text-cyan-400',
    'Music Studio':'bg-purple-100  dark:bg-purple-900/30 text-purple-700  dark:text-purple-400',
    'Music Practice':'bg-pink-100  dark:bg-pink-900/30   text-pink-700    dark:text-pink-400',
  };
  return map[type] || 'bg-gray-100 text-gray-700';
};

export default function SearchPage() {
  const { venues: allVenues } = useConnect();
  const location = useLocation();
  const sp = new URLSearchParams(location.search);
  const initialQuery = sp.get('query') || '';
  const initialLoc   = sp.get('loc') || '';
  const initialType  = sp.get('type') || '';

  const [viewMode, setViewMode]               = useState('grid');
  const [searchQuery, setSearchQuery]         = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery]   = useState(initialQuery);
  const [selectedLocations, setSelectedLocations] = useState(initialLoc ? [initialLoc] : []);
  const [selectedTypes, setSelectedTypes]     = useState(initialType ? [initialType] : []);
  const [priceRange, setPriceRange]           = useState(50000);
  const [sortBy, setSortBy]                   = useState('Recommended');
  const [filterOpen, setFilterOpen]           = useState(false);

  // Update filters if URL changes (e.g. from nav)
  useEffect(() => {
    const t = new URLSearchParams(location.search).get('type') || '';
    setSelectedTypes(t ? [t] : []);
    const q = new URLSearchParams(location.search).get('query') || '';
    setSearchQuery(q);
    setDebouncedQuery(q);
    setSelectedLocations([]);
  }, [location.search]);

  // ── Debounce the search input to save performance ──
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Unique values derived from data
  const uniqueLocations = useMemo(() => COLOMBO_LOCATIONS, []);
  const allTypes = useMemo(() => [...CATEGORIES.sports, ...CATEGORIES.entertainment], []);

  const filteredVenues = useMemo(() => {
    let result = (allVenues || []).filter(v => {
      // Visibility Filter: Hide pending/rejected venues from customers
      if (v.status !== 'Approved') return false;

      const q = debouncedQuery.toLowerCase().trim();
      const n = (v.name || "").toLowerCase();
      let matchQuery = true;
      if (q) {
        matchQuery = n.includes(q) || (v.type || "").toLowerCase().includes(q) ||
          q.split(' ').some(token =>
            n.split(' ').some(word => levenshtein(word, token) <= 2)
          );
      }
      
      const matchLoc  = selectedLocations.length === 0 || selectedLocations.includes(v.location);
      const matchType = selectedTypes.length === 0 || (v.type && selectedTypes.includes(v.type));
      const matchPx   = v.priceNum <= priceRange;
      const isApproved = v.status === 'Approved';
      return isApproved && matchQuery && matchLoc && matchType && matchPx;
    });
    if (sortBy === 'Price (Low to High)') result.sort((a, b) => a.priceNum - b.priceNum);
    else if (sortBy === 'Price (High to Low)') result.sort((a, b) => b.priceNum - a.priceNum);
    else if (sortBy === 'Highest Rated') result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [debouncedQuery, selectedLocations, selectedTypes, priceRange, sortBy]);

  // AI suggestions (same selected type, fallback to top rated)
  const aiSuggestions = useMemo(() => {
    if (filteredVenues.length > 0) return [];
    const baseType = selectedTypes[0] || null;
    const pool = baseType
      ? (allVenues || []).filter(v => v.type === baseType && v.status === 'Approved')
      : (allVenues || []).filter(v => v.status === 'Approved');
    return [...pool].sort((a, b) => b.rating - a.rating).slice(0, 3);
  }, [filteredVenues, selectedTypes, allVenues]);

  const toggleLocation = (loc) =>
    setSelectedLocations(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]);

  const toggleType = (t) =>
    setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const clearFilters = () => {
    setSelectedLocations([]);
    setSelectedTypes([]);
    setPriceRange(50000);
    setSearchQuery('');
    setSortBy('Recommended');
  };

  const activeFilterCount = selectedLocations.length + selectedTypes.length + (priceRange < 50000 ? 1 : 0);

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen pb-16">
      {/* ── Sticky Search Header ─────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 py-5 px-6 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for venues, sports, studios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-accent/40 outline-none transition dark:text-white text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-2 px-4 py-3 border rounded-xl font-medium transition ${
                filterOpen || activeFilterCount > 0
                  ? 'text-white border-transparent'
                  : 'border-gray-200 dark:border-slate-600 text-textPrimary dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
              style={filterOpen || activeFilterCount > 0 ? {background:'var(--grad-fire)'} : {}}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white text-accent text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
            <div className="hidden md:flex border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-3 transition ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-3 border-l border-gray-200 dark:border-slate-600 transition ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Active type pills */}
        {selectedTypes.length > 0 && (
          <div className="max-w-7xl mx-auto flex flex-wrap gap-2 mt-3">
            {selectedTypes.map(t => (
              <span key={t} className="flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full">
                {t}
                <button onClick={() => toggleType(t)} className="hover:text-red-500 transition"><X className="w-3 h-3" /></button>
              </span>
            ))}
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-500 transition underline">Clear all</button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 flex flex-col lg:flex-row gap-8">

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <aside className={`w-full lg:w-72 shrink-0 space-y-5 ${filterOpen ? 'block' : 'hidden lg:block'}`}>

          {/* Category Filter — Sports */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-base mb-4 text-textPrimary dark:text-white flex items-center gap-2">
              Sports
            </h3>
            <div className="space-y-2.5">
              {CATEGORIES.sports.map(type => (
                <label key={type} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="text-textSecondary dark:text-slate-300 group-hover:text-primary dark:group-hover:text-white transition flex items-center gap-1.5">
                    {type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Category Filter — Entertainment */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-base mb-4 text-textPrimary dark:text-white flex items-center gap-2">
              Entertainment
            </h3>
            <div className="space-y-2.5">
              {CATEGORIES.entertainment.map(type => (
                <label key={type} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="text-textSecondary dark:text-slate-300 group-hover:text-primary dark:group-hover:text-white transition flex items-center gap-1.5">
                    {type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Location Filter */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-base mb-4 text-textPrimary dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> Location</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </h3>
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {uniqueLocations.map(loc => (
                <label key={loc} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedLocations.includes(loc)}
                    onChange={() => toggleLocation(loc)}
                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="text-textSecondary dark:text-slate-300 group-hover:text-primary dark:group-hover:text-white transition text-sm">{loc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-base mb-4 text-textPrimary dark:text-white">
              Max Price: <span className="text-accent">LKR {priceRange.toLocaleString()}</span>
            </h3>
            <input
              type="range"
              className="w-full accent-accent"
              min={0} max={50000} step={500}
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500 mt-2">
              <span>LKR 0</span><span>LKR 50K+</span>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="w-full py-2.5 border-2 border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 transition">
              Clear All Filters
            </button>
          )}
        </aside>

        {/* ── Results ──────────────────────────────────────────── */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-textPrimary dark:text-white">
              {filteredVenues.length > 0
                ? <>{filteredVenues.length} <span className="text-textSecondary dark:text-slate-400 font-normal">venues found</span></>
                : <span className="text-textSecondary dark:text-slate-400">No venues found</span>
              }
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-textSecondary dark:text-slate-400 hidden sm:inline">Sort:</span>
              <select
                className="bg-transparent font-semibold text-primary dark:text-white outline-none cursor-pointer text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option className="dark:bg-slate-800">Recommended</option>
                <option className="dark:bg-slate-800">Price (Low to High)</option>
                <option className="dark:bg-slate-800">Price (High to Low)</option>
                <option className="dark:bg-slate-800">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* No results → AI Suggestions */}
          {filteredVenues.length === 0 && (
            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 text-center shadow-sm border border-gray-100 dark:border-slate-700">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2 dark:text-white">No venues found</h3>
                <p className="text-textSecondary dark:text-slate-400 mb-1">Try adjusting your filters or search query.</p>
                <button onClick={clearFilters} className="mt-4 btn-outline text-sm">Clear Filters</button>
              </div>

              {aiSuggestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-accent to-orange-400 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      <Sparkles className="w-3 h-3" /> AI Suggestions
                    </span>
                    <span className="text-textSecondary dark:text-slate-400 text-sm">
                      {selectedTypes[0] ? `Similar ${selectedTypes[0]} venues you might like:` : 'Top-rated venues for you:'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {aiSuggestions.map(v => (
                      <Link key={v.id} to={`/venue/${v.id}`}
                        className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group">
                        <div className="h-36 overflow-hidden relative">
                          <img src={imgSrc(v.img)} alt={v.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-textPrimary dark:text-white group-hover:text-accent transition text-sm mb-1 line-clamp-1">{v.name}</h4>
                          <div className="text-xs text-textSecondary dark:text-slate-400 flex items-center gap-1 mb-2"><MapPin className="w-3 h-3" /> {v.location}</div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-primary dark:text-white text-sm">{v.price}</span>
                            <div className="flex items-center gap-1 text-xs text-yellow-600"><Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> {v.rating}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results grid/list */}
          {filteredVenues.length > 0 ? (
            <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
              {filteredVenues.map((venue, idx) => (
                <Link
                  key={venue.id}
                  to={`/venue/${venue.id}`}
                  className={`bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex card-glow animate-fade-in-up ${viewMode === 'grid' ? 'flex-col' : 'flex-row'}`}
                  style={{ animationDelay: `${(idx % 6) * 100}ms` }}
                >
                  {/* Image */}
                  <div className={`${viewMode === 'grid' ? 'h-48' : 'w-56 shrink-0'} relative overflow-hidden`}>
                    <img src={imgSrc(venue.img)} alt={venue.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl text-xs font-bold text-primary flex items-center gap-1 shadow">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> {venue.rating}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-base font-bold text-textPrimary dark:text-white group-hover:text-accent transition line-clamp-1">{venue.name}</h3>
                      {viewMode === 'list' && <span className="text-primary dark:text-white font-bold text-sm ml-3 shrink-0">{venue.price}</span>}
                    </div>
                    {viewMode === 'grid' && <div className="text-primary dark:text-accent font-bold text-sm mb-2">{venue.price}</div>}
                    <div className="flex items-center text-textSecondary dark:text-slate-400 text-sm gap-1.5 mb-2">
                      <MapPin className="w-4 h-4" /> {venue.location}
                    </div>
                    {viewMode === 'list' && (
                      <p className="text-sm text-textSecondary dark:text-slate-400 line-clamp-2 mb-3">{venue.description}</p>
                    )}
                    <div className="mt-auto flex justify-between items-center border-t border-gray-100 dark:border-slate-700 pt-3">
                      <span className="flex items-center gap-1.5 text-xs text-textSecondary dark:text-slate-400"><Clock className="w-3.5 h-3.5" /> {venue.time}</span>
                      <span className={`category-pill text-xs ${typeColour(venue.type)}`}>{venue.type}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-16 text-center border-2 border-dashed border-gray-100 dark:border-slate-700 animate-fade-in-up">
              <div className="w-20 h-20 bg-gray-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-2xl font-black text-textPrimary dark:text-white mb-2">No venues listed yet</h3>
              <p className="text-textSecondary dark:text-slate-400 mb-8 max-w-sm mx-auto">We are currently verifying new spaces. Check back soon or list your own venue to get started.</p>
              <Link to="/register" className="bg-accent text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-accent/20 hover:scale-105 transition active:scale-95 inline-block">
                Register as an Owner
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
