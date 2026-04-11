import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnect } from '../context/ConnectContext';
import { ArrowLeft, Upload, MapPin, DollarSign, Tag, FileText, X, ImagePlus, CheckCircle } from 'lucide-react';
import { COLOMBO_LOCATIONS, ALL_TYPES } from '../data/mockData';

const FACILITY_MAP = {
  Cricket:          ['Indoor Net', 'Outdoor Net', 'Ground with all facilities'],
  Football:         ['Ground with all facilities', 'Practice Pitch'],
  Futsal:           ['Indoor Court', 'Outdoor Court'],
  Basketball:       ['Indoor Court', 'Outdoor Court'],
  Badminton:        ['Indoor Court'],
  Swimming:         ['Indoor Pool', 'Outdoor Pool'],
  'Music Studio':   ['Studio Room', 'Hall'],
  'Music Practice': ['Studio Room', 'Hall'],
};

// ── Icon helper ────────────────────────────────────────────────────────────────
function Activity({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" className={className}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export default function AddVenue() {
  const navigate  = useNavigate();
  const { addVenue, currentUser } = useConnect();
  const fileInputRef = useRef(null);

  const [fields, setFields] = useState({
    name: '', type: '', facilityType: '', location: '', price: '', description: '',
  });
  const [previewFiles, setPreviewFiles] = useState([]); // [{ url, file }]
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
  };

  // ── File selection & preview ────────────────────────────────────────────────
  const handleFilesChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (previewFiles.length + newFiles.length > 8) {
      setError('Maximum 8 photos allowed.');
      return;
    }
    const previews = newFiles.map(f => ({ url: URL.createObjectURL(f), file: f }));
    setPreviewFiles(prev => [...prev, ...previews]);
    setError('');
  };

  const removePhoto = (index) => {
    setPreviewFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (previewFiles.length === 0) { setError('Please upload at least one venue photo.'); return; }
    setLoading(true);
    setError('');

    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
    previewFiles.forEach(p => fd.append('images', p.file));
    fd.append('ownerId', currentUser?.id);

    const result = await addVenue(fd);
    setLoading(false);
    if (result) {
      setSuccess(true);
      setTimeout(() => navigate('/owner-dashboard'), 1500);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-textPrimary dark:text-white mb-2">Venue Listed!</h2>
          <p className="text-textSecondary dark:text-slate-400">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-6 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/owner-dashboard')}
          className="flex items-center gap-2 text-textSecondary dark:text-slate-400 hover:text-primary dark:hover:text-white transition mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-border dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="bg-primary p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl font-black mb-2">Add New Venue</h1>
              <p className="text-blue-100 opacity-90">Fill in the details to list your venue on Connect.</p>
            </div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-7">

            {/* ── Photo Gallery Upload ─────────────────────────────────────────── */}
            <div>
              <label className="text-sm font-bold text-textPrimary dark:text-slate-200 flex items-center gap-2 mb-3">
                <ImagePlus className="w-4 h-4 text-accent" /> Venue Photos (up to 8)
              </label>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl p-8 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition group"
              >
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-accent mx-auto mb-2 transition" />
                <p className="text-sm font-medium text-textSecondary dark:text-slate-400 group-hover:text-accent transition">
                  Click to select photos
                </p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — max 10 MB each, up to 8 photos</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFilesChange}
                />
              </div>

              {/* Thumbnail Grid */}
              {previewFiles.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {previewFiles.map((p, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600 shadow-sm">
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <div className="absolute top-1 left-1 bg-accent text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                          COVER
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {previewFiles.length < 8 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center hover:border-accent hover:bg-accent/5 transition"
                    >
                      <ImagePlus className="w-6 h-6 text-gray-400" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Text Fields ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-textPrimary dark:text-slate-200 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-accent" /> Venue Name
                </label>
                <input
                  required name="name" value={fields.name} onChange={handleChange}
                  placeholder="e.g. Smashers Badminton Club"
                  className="w-full px-4 py-3 rounded-xl border border-border dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white focus:ring-2 focus:ring-accent outline-none transition"
                />
              </div>

              {/* Activity Type */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-textPrimary dark:text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent" /> Activity Type
                </label>
                <select
                  required name="type" value={fields.type}
                  onChange={(e) => setFields(prev => ({ ...prev, type: e.target.value, facilityType: '' }))}
                  className="w-full px-4 py-3 rounded-xl border border-border dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white focus:ring-2 focus:ring-accent outline-none transition appearance-none"
                >
                  <option value="">Select Type</option>
                  {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Facility Scope */}
              {fields.type && (FACILITY_MAP[fields.type] || []).length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-textPrimary dark:text-slate-200 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" /> Facility Scope
                  </label>
                  <select
                    required name="facilityType" value={fields.facilityType} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white focus:ring-2 focus:ring-accent outline-none transition appearance-none"
                  >
                    <option value="">Select Layout</option>
                    {(FACILITY_MAP[fields.type] || []).map(ft => <option key={ft} value={ft}>{ft}</option>)}
                  </select>
                </div>
              )}

              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-textPrimary dark:text-slate-200 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" /> Location (Colombo)
                </label>
                <select
                  required name="location" value={fields.location} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-border dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white focus:ring-2 focus:ring-accent outline-none transition appearance-none"
                >
                  <option value="">Select Area</option>
                  {COLOMBO_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-textPrimary dark:text-slate-200 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-accent" /> Price per Hour (LKR)
                </label>
                <input
                  required type="number" name="price" value={fields.price} onChange={handleChange}
                  placeholder="e.g. 2500"
                  className="w-full px-4 py-3 rounded-xl border border-border dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white focus:ring-2 focus:ring-accent outline-none transition"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-textPrimary dark:text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" /> Description
              </label>
              <textarea
                required name="description" value={fields.description} onChange={handleChange}
                rows="4"
                placeholder="Describe your venue — facilities, equipment, lighting…"
                className="w-full px-4 py-3 rounded-xl border border-border dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white focus:ring-2 focus:ring-accent outline-none transition resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-error font-semibold flex items-center gap-1">
                <X className="w-4 h-4" /> {error}
              </p>
            )}

            {/* CTA */}
            <div className="pt-2 flex gap-4">
              <button
                type="submit" disabled={loading}
                className={`flex-1 bg-accent text-white py-4 rounded-xl font-black text-lg shadow-lg hover:bg-opacity-90 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Publishing…
                  </>
                ) : <>Publish Venue Listing</>}
              </button>
              <button
                type="button" onClick={() => navigate('/owner-dashboard')}
                className="px-6 py-4 rounded-xl border border-border dark:border-slate-600 font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition dark:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
