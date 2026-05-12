import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Sparkles, ArrowRight, Clock, Shield, Zap } from 'lucide-react';
import { useConnect } from '../context/ConnectContext';
import { imgSrc } from '../utils/api';

// ── Category config ──────────────────────────────────────────────────────────
const ACTIVITY_CATEGORIES = [
  {
    label: 'Cricket',
    type: 'Cricket',
    img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80',
    color: 'from-green-900/80 to-green-700/60',
    badge: 'bg-green-500/90',
  },
  {
    label: 'Futsal',
    type: 'Futsal',
    img: '/futsal-uploaded.jpg',
    color: 'from-sky-900/80 to-sky-700/60',
    badge: 'bg-sky-500/90',
  },
  {
    label: 'Football',
    type: 'Football',
    img: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&q=80',
    color: 'from-blue-900/80 to-blue-700/60',
    badge: 'bg-blue-500/90',
  },
  {
    label: 'Basketball',
    type: 'Basketball',
    img: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80',
    color: 'from-orange-900/80 to-orange-700/60',
    badge: 'bg-orange-500/90',
  },
  {
    label: 'Badminton',
    type: 'Badminton',
    img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80',
    color: 'from-yellow-900/80 to-yellow-700/60',
    badge: 'bg-yellow-500/90',
  },
  {
    label: 'Swimming',
    type: 'Swimming',
    img: 'https://images.unsplash.com/photo-1600965962361-9035dbfd1c50?auto=format&fit=crop&q=80',
    color: 'from-cyan-900/80 to-cyan-700/60',
    badge: 'bg-cyan-500/90',
  },
  {
    label: 'Music Studios',
    type: 'Music Studio',
    img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80',
    color: 'from-purple-900/80 to-purple-700/60',
    badge: 'bg-purple-500/90',
  },
  {
    label: 'Practice Rooms',
    type: 'Music Practice',
    img: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80',
    color: 'from-pink-900/80 to-pink-700/60',
    badge: 'bg-pink-500/90',
  },
];

const COLOMBO_LOCATIONS = [
  '', 'Colombo 01', 'Colombo 15', 'Nugegoda', 'Mount Lavinia', 'Dehiwala', 'Battaramulla', 'Rajagiriya',
];

// ── Features config ──────────────────────────────────────────────────────────
const FEATURES = [
  { icon: <Shield className="w-6 h-6 text-accent" />, title: 'Secure Payments', desc: 'Enterprise-grade encryption for all transactions.' },
  { icon: <Zap className="w-6 h-6 text-accent" />, title: 'Instant Confirmation', desc: 'Real-time booking validation and digital receipts.' },
  { icon: <Star className="w-6 h-6 text-accent" />, title: 'Verified Venues', desc: 'Vetted owners and premium quality standards.' },
  { icon: <Clock className="w-6 h-6 text-accent" />, title: 'Flexible Access', desc: 'Easy modification and 24/7 digital support.' },
];

export default function Home() {
  const navigate = useNavigate();
  const { venues } = useConnect();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  const featuredVenues = useMemo(() => 
    [...(venues || [])].filter(v => v.status === 'Approved').sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3)
  , [venues]);


  const handleSearch = () => {
    navigate(`/search?query=${encodeURIComponent(searchQuery)}&loc=${encodeURIComponent(searchLocation)}`);
  };

  return (
    <>
      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative min-h-[95vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="/hero-bg.jpg"
            alt="Venue Stadium Background"
            className="w-full h-full object-cover scale-105 animate-slow-zoom origin-center"
            style={{ filter: 'brightness(0.5) contrast(1.1)' }}
          />
          {/* Professional Overlay: Deep blue to transparent for text clarity */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-slate-900/40" />
          {/* Visible Motion Blends */}
          <div className="absolute inset-0 bg-accent/40 mix-blend-overlay animate-pulse" style={{ animationDuration: '1.5s' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 text-white w-full py-24">
          <div className="max-w-3xl">
            {/* Professional Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-8 animate-fade-in-up overflow-hidden group" 
                 style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', backdropFilter:'blur(20px)'}}>      
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <span className="text-gray-200 tracking-widest uppercase">Sri Lanka's Premier Venue Network</span>
            </div>

            {/* Headline */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[1.1] mb-8 animate-fade-in-up delay-100 tracking-tight">
              Elevate your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-orange-400">
                Experience
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-xl leading-relaxed animate-fade-in-up delay-200 font-light">
              Discover and book premium sports arenas and entertainment spaces across Colombo with instant confirmation.
            </p>

            {/* Glassmorphic Search Bar */}
            <div className="rounded-2xl p-1.5 flex flex-col md:flex-row gap-2 shadow-3xl animate-fade-in-up delay-300 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]" 
                 style={{background:'rgba(255,255,255,0.03)', backdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.1)'}}>      
              
              <div className="flex-1 flex items-center px-5 bg-white/5 rounded-xl focus-within:bg-white/10 transition-colors border border-transparent focus-within:border-white/20">
                <Search className="text-accent w-5 h-5 mr-4 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="w-full bg-transparent py-4.5 text-white outline-none font-medium placeholder-gray-400 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex items-center px-5 bg-white/5 rounded-xl focus-within:bg-white/10 transition-colors border border-transparent focus-within:border-white/20 min-w-[180px]">
                <MapPin className="text-accent w-5 h-5 mr-3 flex-shrink-0" />
                <select
                  className="w-full bg-transparent py-4 text-white outline-none font-medium appearance-none cursor-pointer text-sm"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                >
                  <option value="" className="bg-slate-900 text-white">All Locations</option>
                  {COLOMBO_LOCATIONS.filter(l => l).map(loc => (
                    <option key={loc} value={loc} className="bg-slate-900 text-white">{loc}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSearch}
                className="bg-accent hover:bg-orange-600 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-accent/20 flex items-center justify-center"
              >
                Find Venues
              </button>
            </div>

            {/* Popular searches */}
            <div className="flex flex-wrap gap-3 mt-8 animate-fade-in-up delay-400">
              <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest self-center mr-2">Top Interests</span>
              {['Football', 'Cricket', 'Futsal', 'Music Studio'].map(tag => (
                <button
                  key={tag}
                  onClick={() => navigate(`/search?type=${encodeURIComponent(tag)}`)}
                  className="text-[10px] font-bold bg-white/5 border border-white/10 text-gray-300 px-4 py-2 rounded-full hover:bg-accent hover:border-accent hover:text-white transition-all duration-300"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES BAR
      ══════════════════════════════════════════ */}
      <section className="bg-white dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800 py-16 px-6 sm:px-10 shadow-sm relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex flex-col items-center text-center animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <h4 className="text-lg font-black text-textPrimary dark:text-white mb-2">{f.title}</h4>
              <p className="text-sm text-textSecondary dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          EXPLORE ACTIVITIES
      ══════════════════════════════════════════ */}
      <section className="py-20 px-6 sm:px-10 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="section-badge mb-4">
            <Zap className="w-3 h-3" /> Browse By Activity
          </div>
          <h2 className="text-4xl font-black text-textPrimary dark:text-white mb-3">Explore Activities</h2>
          <p className="text-textSecondary dark:text-slate-400 max-w-xl mx-auto">From cricket pitches to recording studios — find the perfect space for your passion in Colombo</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {ACTIVITY_CATEGORIES.map((cat, i) => {
            const count = (venues || []).filter(v => v.type === cat.type && v.status === 'Approved').length;
            return (
              <Link
                key={cat.type}
                to={`/search?type=${encodeURIComponent(cat.type)}`}
                className="group relative rounded-2xl overflow-hidden shadow-md cursor-pointer hover:shadow-xl transition-all duration-500 animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms`, height: '260px' }}
              >
                <img
                  src={cat.img}
                  alt={cat.label}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} group-hover:opacity-90 transition-opacity duration-500`} />

                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  <div className="text-white">
                    <h3 className="text-xl font-extrabold text-shadow">{cat.label}</h3>
                    <p className="text-sm text-white/80 mt-0.5">{count} venues</p>
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 border border-white/30">
                    Explore <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURED VENUES
      ══════════════════════════════════════════ */}
      <section className="py-24 px-6 sm:px-10 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <div className="section-badge mb-4">
                <Star className="w-3 h-3 fill-current" /> Premium Selection
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-textPrimary dark:text-white tracking-tight uppercase">Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-orange-500">Venues</span></h2>
              <p className="text-textSecondary dark:text-slate-400 mt-3 font-medium text-lg">The most prestigious spaces across Colombo</p>
            </div>
            <Link
              to="/search"
              className="hidden md:flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-accent hover:gap-4 transition-all duration-300 group"
            >
              Discover all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {featuredVenues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {featuredVenues.map((venue, i) => (
                <Link
                  key={venue.id}
                  to={`/venue/${venue.id}`}
                  className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col card-glow animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="h-64 relative overflow-hidden">
                    <img src={imgSrc(venue.img)} alt={venue.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-2xl text-[10px] font-black text-primary flex items-center gap-1 shadow-xl">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> {venue.rating}
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/20">
                        {venue.type}
                      </span>
                    </div>
                  </div>
                  <div className="p-8 flex-grow flex flex-col">
                    <h3 className="text-2xl font-black text-textPrimary dark:text-white group-hover:text-accent transition duration-300 mb-2 truncate">{venue.name}</h3>
                    <div className="flex items-center text-textSecondary dark:text-slate-400 text-sm gap-2 mb-8">
                      <MapPin className="w-4 h-4 text-accent" /> {venue.location}
                    </div>
                    <div className="mt-auto flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 -mx-8 -mb-8 p-6 border-t border-gray-100 dark:border-slate-800/50 group-hover:bg-accent/[0.03] transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Starting at</span>
                        <span className="text-xl font-black text-primary dark:text-white tracking-tight">{venue.price}</span>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-accent/20">
                        <ArrowRight className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 opacity-60">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 animate-pulse overflow-hidden">
                  <div className="h-64 bg-gray-100 dark:bg-slate-900" />
                  <div className="p-8 space-y-4 text-center py-20">
                    <div className="h-5 bg-gray-100 dark:bg-slate-900 rounded w-3/4 mx-auto" />
                    <div className="h-5 bg-gray-100 dark:bg-slate-900 rounded w-1/2 mx-auto" />
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 py-6 italic">Verified spaces arriving soon</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WHY CONNECT — FEATURES 
      ══════════════════════════════════════════ */}
      <section className="py-24 px-6 sm:px-10 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-5xl font-black text-textPrimary dark:text-white mb-5 uppercase tracking-tight">The Connect <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-orange-500">Standard</span></h2>
          <p className="text-textSecondary dark:text-slate-400 text-lg max-w-2xl mx-auto">Elevating the venue experience through security, intelligence, and speed.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              icon: <Zap className="w-8 h-8 text-accent" />,
              title: 'Speed & Efficiency',
              desc: 'Reserve a premium space in under 60 seconds with our streamlined digital matching engine.',
              bg: 'bg-accent/5 dark:bg-accent/10',
            },
            {
              icon: <Shield className="w-8 h-8 text-blue-500" />,
              title: 'Verified Security',
              desc: 'State-of-the-art encryption and OTP-based verification for every financial transaction.',
              bg: 'bg-blue-50 dark:bg-blue-900/10',
            },
            {
              icon: <Sparkles className="w-8 h-8 text-purple-500" />,
              title: 'AI Intelligence',
              desc: 'Advanced NLP assistant to help you discover the perfect atmosphere for your sports or events.',
              bg: 'bg-purple-50 dark:bg-purple-900/10',
            },
          ].map((feat, i) => (
            <div
              key={i}
              className={`${feat.bg} rounded-3xl p-10 border border-gray-100 dark:border-slate-700 hover:shadow-2xl transition-all duration-500 animate-fade-in-up flex flex-col items-center text-center`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center mb-6 shadow-sm">
                {feat.icon}
              </div>
              <h3 className="text-2xl font-black text-textPrimary dark:text-white mb-3">{feat.title}</h3>
              <p className="text-textSecondary dark:text-slate-400 leading-relaxed text-lg">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="py-24 px-6 sm:px-10">
        <div className="max-w-5xl mx-auto rounded-[2rem] px-10 py-20 text-white text-center relative overflow-hidden shadow-3xl bg-slate-900 border border-white/5">
          {/* Animated Background Gradients */}
          <div className="absolute inset-0">
             <img src="/hero-bg.jpg" className="w-full h-full object-cover opacity-20" alt="CTA BG" />
             <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-900/80 to-accent/20" />
          </div>
          <div className="relative z-10">
            <h2 className="text-5xl lg:text-6xl font-black mb-6 tracking-tight uppercase">Scale your<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-orange-400">Potential</span></h2>
            <p className="text-gray-400 mb-12 max-w-xl mx-auto text-lg leading-relaxed font-medium italic">Join the elite community of athletes and entertainers redefining venue booking in Sri Lanka.</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/search" className="bg-accent text-white px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-accent/40 hover:bg-orange-600 transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-3">
                Explore The Network <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/register" className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all inline-flex items-center gap-2">
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
