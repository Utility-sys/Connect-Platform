import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  MapPin, 
  User, 
  Search,
  Filter,
  ExternalLink,
  Loader2
} from 'lucide-react';

const VenueModeration = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchVenues();
    const interval = setInterval(fetchVenues, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchVenues = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/admin/venues');
      setVenues(data);
    } catch (e) {
      console.error('Failed to fetch venues:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (id, status) => {
    setProcessingId(id);
    try {
      await axios.put(`http://localhost:5000/api/admin/venues/${id}/moderate`, { status });
      setVenues(prev => prev.map(v => v.id === id ? { ...v, status } : v));
    } catch (e) {
      alert('Failed to update venue status.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredVenues = venues.filter(v => filter === 'All' || v.status === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-white mb-1">Venue Moderation</h2>
          <p className="text-slate-400 font-medium max-w-lg">
            High-precision audit system. Review automated trust scores and business documents.
          </p>
        </div>

        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
          {['All', 'Pending', 'Approved', 'Rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-widest transition-all duration-500 ${
                filter === f ? 'bg-fire text-white shadow-lg shadow-fire/20' : 'text-slate-500 hover:text-white'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="premium-card h-80 animate-pulse"></div>
          ))
        ) : filteredVenues.length === 0 ? (
          <div className="xl:col-span-2 py-32 text-center premium-card border-dashed">
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm">Clear Horizons — No Pending Audits</p>
          </div>
        ) : (
          filteredVenues.map((venue) => (
            <div key={venue.id} className="premium-card group overflow-hidden flex flex-col sm:flex-row h-full">
              {/* Image Section */}
              <div className="w-full sm:w-56 h-56 sm:h-auto relative">
                <img 
                  src={venue.img ? `http://localhost:5000${venue.img}` : 'https://images.unsplash.com/photo-1545118531-158a1fa98d25?q=80&w=600&auto=format&fit=crop'} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                  alt={venue.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-transparent to-transparent opacity-60" />
                
                {/* Status Badge */}
                <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-md border ${
                  venue.status === 'Approved' ? 'bg-success/20 text-success border-success/30' : 
                  venue.status === 'Rejected' ? 'bg-danger/20 text-danger border-danger/30' : 
                  'bg-warning/20 text-warning border-warning/30'
                }`}>
                  {venue.status}
                </div>

                {/* Trust Engine Score */}
                <div className="absolute bottom-4 left-4 right-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="glass p-3 rounded-2xl border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase text-white/50 tracking-widest">Trust Score</p>
                      <p className={`text-sm font-black ${venue.confidenceScore > 80 ? 'text-success' : 'text-warning'}`}>
                        {venue.confidenceScore || 0}% Confidence
                      </p>
                    </div>
                    {venue.confidenceScore > 75 && (
                      <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-success" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 p-8 flex flex-col">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-white leading-none tracking-tight mb-2">{venue.name}</h3>
                      <p className="text-sm text-slate-400 font-medium flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-fire" /> {venue.location}
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-white/40 border border-white/5 bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">
                      {venue.type}
                    </span>
                  </div>

                  {/* Owner Badge */}
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-fire/20 flex items-center justify-center text-xs font-black text-fire">
                      {venue.User?.firstName?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Authorized Submitter</p>
                      <p className="text-sm font-bold text-white leading-none mt-1">{venue.User?.firstName} {venue.User?.lastName}</p>
                    </div>
                    {venue.verificationDoc && (
                      <a 
                        href={`http://localhost:5000${venue.verificationDoc}`} 
                        target="_blank" rel="noreferrer"
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 text-slate-400 hover:text-white"
                        title="View Identification Document"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  {venue.status === 'Pending' ? (
                    <>
                      <button
                        onClick={() => handleModerate(venue.id, 'Approved')}
                        disabled={processingId === venue.id}
                        className="flex-1 bg-success/10 hover:bg-success/20 text-success text-[11px] font-black py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 border border-success/20 active:scale-95"
                      >
                        {processingId === venue.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                        APPROVE LISTING
                      </button>
                      <button
                        onClick={() => handleModerate(venue.id, 'Rejected')}
                        disabled={processingId === venue.id}
                        className="flex-1 bg-danger/10 hover:bg-danger/20 text-danger text-[11px] font-black py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 border border-danger/20 active:scale-95"
                      >
                        {processingId === venue.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-5 h-5" />}
                        REJECT
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleModerate(venue.id, 'Pending')}
                      disabled={processingId === venue.id}
                      className="w-full bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white text-[11px] font-black py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 border border-white/5 active:scale-95"
                    >
                      <Loader2 className={`w-4 h-4 ${processingId === venue.id ? 'animate-spin' : ''}`} />
                      REVERT MODERATION STATUS
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VenueModeration;
