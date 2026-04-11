import { useState, useMemo, useEffect } from 'react';
import {
  Activity, Plus, TrendingUp, Users, X, AlertTriangle, CheckCircle,
  Edit2, Eye, Clock, ToggleLeft, ToggleRight, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConnect } from '../context/ConnectContext';

// ── Helpers ───────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    Confirmed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    Cancelled: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
    Edited:    'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  };
  return (
    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${styles[status] || styles.Confirmed}`}>
      {status}
    </span>
  );
};

const timeLabel = (slots) => {
  if (!slots) return '—';
  const arr = Array.isArray(slots) ? slots : [slots];
  return arr.sort().map(h => `${h}:00`).join(', ');
};

// ── ALL_TYPES from mockData for edit modal dropdown ───────────────────────────
const ALL_TYPES = ['Cricket','Football','Futsal','Basketball','Badminton','Swimming','Music Studio','Music Practice'];

function OwnerDashboard() {
  const navigate = useNavigate();
  const { venues, bookings, currentUser, cancelBooking, deleteVenue, updateVenue, refreshVenues, refreshBookings } = useConnect();

  // ── Local state ────────────────────────────────────────────────────────────
  const [activeTab,         setActiveTab]         = useState('daily');
  const [expandedBooking,   setExpandedBooking]   = useState(null);

  // Cancel booking modal
  const [cancelModalOpen,   setCancelModalOpen]   = useState(false);
  const [selectedBooking,   setSelectedBooking]   = useState(null);
  const [cancelReason,      setCancelReason]      = useState('');

  // Edit venue modal
  const [editVenue,         setEditVenue]         = useState(null); // the venue being edited
  const [editFields,        setEditFields]        = useState({});
  const [editSaving,        setEditSaving]        = useState(false);

  // ── Data filters ───────────────────────────────────────────────────────────
  const myVenues   = useMemo(() => venues.filter(v => v.ownerId === currentUser?.id), [venues, currentUser]);
  const myBookings = useMemo(() => bookings.filter(b => b.ownerId === currentUser?.id || myVenues.some(v => v.id === b.venueId)), [bookings, myVenues, currentUser]);

  const todayStr   = new Date().toISOString().split('T')[0];
  const dailyBookings   = useMemo(() => myBookings.filter(b => b.date === todayStr && b.status !== 'Cancelled'), [myBookings, todayStr]);
  const historyBookings = useMemo(() => myBookings.filter(b => b.date < todayStr || b.status === 'Cancelled'), [myBookings, todayStr]);
  const upcomingBookings = useMemo(() => myBookings.filter(b => b.date >= todayStr && b.status === 'Confirmed'), [myBookings, todayStr]);

  const stats = useMemo(() => ({
    revenue: myBookings.filter(b => b.status === 'Confirmed').reduce((s, b) => s + (b.totalPrice || 0), 0),
    active:  upcomingBookings.length,
    views:   myVenues.reduce((s, v) => s + (v.views || 0), 0),
  }), [myBookings, myVenues, upcomingBookings]);

  // ── Cancel booking ─────────────────────────────────────────────────────────
  const openCancelModal = (booking) => {
    setSelectedBooking(booking);
    setCancelReason('');
    setCancelModalOpen(true);
  };
  const confirmCancel = async () => {
    if (cancelReason.trim().length < 5) return;
    await cancelBooking(selectedBooking.id, cancelReason);
    setCancelModalOpen(false);
    setSelectedBooking(null);
    setCancelReason('');
  };

  // ── Edit venue ─────────────────────────────────────────────────────────────
  const openEditVenue = (venue) => {
    setEditVenue(venue);
    setEditFields({
      name:          venue.name,
      type:          venue.type,
      description:   venue.description || '',
      price:         venue.priceNum || '',
      location:      venue.location,
      isClosed:      venue.isClosed || false,
      closureReason: venue.closureReason || '',
    });
  };
  const saveVenue = async () => {
    setEditSaving(true);
    await updateVenue(editVenue.id, {
      name:          editFields.name,
      type:          editFields.type,
      description:   editFields.description,
      priceNum:      parseFloat(editFields.price) || 0,
      price:         `LKR ${editFields.price}/hr`,
      location:      editFields.location,
      isClosed:      editFields.isClosed,
      closureReason: editFields.closureReason,
    });
    setEditSaving(false);
    setEditVenue(null);
    await refreshVenues();
  };

  // ── Which bookings to show ─────────────────────────────────────────────────
  const displayedBookings = activeTab === 'daily' ? dailyBookings : historyBookings;

  // ── Booking row component ──────────────────────────────────────────────────
  const BookingRow = ({ b }) => {
    const isExpanded = expandedBooking === b.id;
    const customerDisplay = b.customerName || (b.User ? `${b.User.firstName} ${b.User.lastName}` : b.userId);
    return (
      <div className="border-b border-border dark:border-slate-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-slate-900/40 transition">
        <div
          className="p-5 flex items-center gap-4 cursor-pointer"
          onClick={() => setExpandedBooking(isExpanded ? null : b.id)}
        >
          {/* Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">
            {(customerDisplay[0] || 'U').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-textPrimary dark:text-white truncate">{customerDisplay}</p>
            <p className="text-xs text-textSecondary dark:text-slate-400 truncate">
              {b.venueName || b.Venue?.name} · {b.date} · <span className="text-accent font-bold">{timeLabel(b.timeSlots)}</span>
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-black text-primary dark:text-white text-sm">LKR {(b.totalPrice || 0).toLocaleString()}</p>
            <StatusBadge status={b.status} />
          </div>
          <span className="text-textSecondary dark:text-slate-500 ml-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="px-5 pb-5 pt-0 animate-fade-in">
            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">Booking ID</span><span className="font-mono text-xs dark:text-white">#{b.id}</span></div>
              <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">Venue</span><span className="font-medium dark:text-white">{b.venueName || b.Venue?.name}</span></div>
              <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">Date</span><span className="font-medium dark:text-white">{b.date}</span></div>
              <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">Time Slots</span><span className="font-medium dark:text-white">{timeLabel(b.timeSlots)}</span></div>
              <div className="flex justify-between"><span className="text-textSecondary dark:text-slate-400">Amount</span><span className="font-black text-primary dark:text-accent">LKR {(b.totalPrice || 0).toLocaleString()}.00</span></div>
              {b.cancellationReason && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-3 mt-2">
                  <p className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase mb-1">Cancellation Reason</p>
                  <p className="text-xs italic text-textSecondary dark:text-slate-300">"{b.cancellationReason}"</p>
                </div>
              )}
            </div>
            {b.status === 'Confirmed' && (
              <button
                onClick={() => openCancelModal(b)}
                className="mt-3 text-xs text-error font-bold flex items-center gap-1 hover:underline"
              >
                <X className="w-3 h-3" /> Emergency Cancellation
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-6 sm:px-10 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4 animate-fade-in">
          <div>
            <span className="bg-primary/10 text-primary dark:text-blue-400 text-xs font-bold px-2 py-1 rounded tracking-wider uppercase">Owner Mode</span>
            <h1 className="text-4xl font-black text-textPrimary dark:text-white mt-2 mb-1 animate-fade-in-up">Venue Portal</h1>
            <p className="text-textSecondary dark:text-slate-400">Welcome back, {currentUser?.firstName || 'Owner'}.</p>
          </div>
          <button
            onClick={() => navigate('/add-venue')}
            className="bg-accent text-white px-6 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2 hover:bg-opacity-90 transform active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" /> Add New Venue
          </button>
        </div>

          {/* ── Stats ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { icon: <TrendingUp className="w-8 h-8 text-primary dark:text-blue-400" />, bg: 'bg-primary/10', label: 'Total Revenue', value: `LKR ${stats.revenue.toLocaleString()}` },
            { icon: <Activity className="w-8 h-8 text-accent" />, bg: 'bg-accent/10', label: 'Upcoming Bookings', value: stats.active },
            { icon: <Users className="w-8 h-8 text-green-500" />, bg: 'bg-green-500/10', label: 'Profile Views', value: stats.views.toLocaleString() },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-border dark:border-slate-700 shadow-sm flex items-center gap-6 group hover:shadow-md transition animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`p-4 ${s.bg} rounded-2xl group-hover:scale-110 transition`}>{s.icon}</div>
              <div>
                <p className="text-xs text-textSecondary dark:text-slate-400 font-black uppercase tracking-widest mb-1">{s.label}</p>
                <h3 className="text-3xl font-black text-textPrimary dark:text-white">{s.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* ── Venue Listings ─────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 shadow-sm overflow-hidden h-fit">
            <div className="p-6 border-b border-border dark:border-slate-700">
              <h2 className="text-xl font-black text-textPrimary dark:text-white">Your Listed Venues</h2>
            </div>
            <div className="overflow-x-auto">
              {myVenues.length === 0 ? (
                <div className="p-10 text-center text-textSecondary dark:text-slate-500 italic">No venues listed yet.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-slate-900 border-b border-border dark:border-slate-700 text-xs font-black text-textSecondary dark:text-slate-400 uppercase tracking-tighter">
                      <th className="p-4">Venue</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myVenues.map(v => (
                      <tr key={v.id} className="border-b border-border dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-900/40 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={v.img || 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&q=80'}
                              className="w-12 h-12 rounded-xl object-cover shadow-sm"
                              alt={v.name}
                            />
                            <div>
                              <div className="text-sm font-bold dark:text-white">{v.name}</div>
                              <div className="text-[10px] uppercase font-black text-accent">{v.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-bold dark:text-slate-300">{v.price}</td>
                        <td className="p-4">
                          {v.isClosed ? (
                            <span className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                              Closed
                            </span>
                          ) : (
                            <span className="bg-success text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                              Open
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEditVenue(v)}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-xs font-black mr-3 uppercase transition flex items-center gap-1 inline-flex"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={async () => { if (window.confirm(`Delete ${v.name}?`)) await deleteVenue(v.id); }}
                            className="text-error hover:text-red-700 dark:text-red-400 text-xs font-black uppercase transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Bookings Panel ─────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 shadow-sm overflow-hidden h-fit">
            <div className="flex border-b border-border dark:border-slate-700">
              {[
                { key: 'daily',   label: `Today (${dailyBookings.length})` },
                { key: 'history', label: 'History' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 p-5 text-sm font-black whitespace-nowrap transition-all ${activeTab === t.key ? 'text-primary dark:text-accent border-b-2 border-primary dark:border-accent bg-gray-50/50 dark:bg-slate-900/40' : 'text-textSecondary dark:text-slate-400 hover:bg-gray-50/30'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div>
              {displayedBookings.length === 0 ? (
                <div className="p-10 text-center text-textSecondary dark:text-slate-500 italic">
                  {activeTab === 'daily' ? 'No bookings for today.' : 'No booking history yet.'}
                </div>
              ) : (
                <div>
                  {displayedBookings.map(b => <BookingRow key={b.id} b={b} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════ EDIT VENUE MODAL ══════════ */}
      {editVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-5 text-white flex justify-between items-center sticky top-0 z-10" style={{ background: 'var(--grad-nav)' }}>
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                <span className="font-bold">Edit Venue</span>
              </div>
              <button onClick={() => setEditVenue(null)} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Venue Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-slate-400 mb-1.5">Venue Name</label>
                <input
                  value={editFields.name}
                  onChange={e => setEditFields(p => ({ ...p, name: e.target.value }))}
                  className="form-field"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-slate-400 mb-1.5">Activity Type</label>
                <select
                  value={editFields.type}
                  onChange={e => setEditFields(p => ({ ...p, type: e.target.value }))}
                  className="form-field appearance-none"
                >
                  {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-slate-400 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={editFields.description}
                  onChange={e => setEditFields(p => ({ ...p, description: e.target.value }))}
                  className="form-field resize-none"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-slate-400 mb-1.5">Price per Hour (LKR)</label>
                <input
                  type="number"
                  value={editFields.price}
                  onChange={e => setEditFields(p => ({ ...p, price: e.target.value }))}
                  className="form-field"
                />
              </div>

              {/* Availability toggle */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-textPrimary dark:text-white text-sm">Venue Availability</p>
                    <p className="text-xs text-textSecondary dark:text-slate-400 mt-0.5">Toggle to temporarily close your venue to new bookings.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditFields(p => ({ ...p, isClosed: !p.isClosed, closureReason: p.isClosed ? '' : p.closureReason }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition ${editFields.isClosed ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'}`}
                  >
                    {editFields.isClosed ? <><ToggleRight className="w-5 h-5" /> Closed</> : <><ToggleLeft className="w-5 h-5" /> Open</>}
                  </button>
                </div>

                {editFields.isClosed && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-slate-400 mb-1.5">Closure Reason (shown to searchers)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Closed for maintenance, Reopening 15th April"
                      value={editFields.closureReason}
                      onChange={e => setEditFields(p => ({ ...p, closureReason: e.target.value }))}
                      className="form-field resize-none"
                    />
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditVenue(null)} className="flex-1 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                  Cancel
                </button>
                <button
                  onClick={saveVenue}
                  disabled={editSaving}
                  className="flex-1 bg-accent disabled:opacity-60 text-white py-3 rounded-xl text-sm font-bold transition active:scale-95 flex items-center gap-2 justify-center"
                >
                  {editSaving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : <><CheckCircle className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════ EMERGENCY CANCEL BOOKING MODAL ═══ */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-border dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-border dark:border-slate-700 bg-error/10 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-error" />
              <h3 className="text-xl font-black text-error">Emergency Cancellation</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-textSecondary dark:text-slate-400 mb-4 leading-relaxed">
                You are cancelling the booking for{' '}
                <span className="font-bold text-textPrimary dark:text-white">{selectedBooking?.customerName || selectedBooking?.userId}</span>.
                This reason will be sent to the customer.
              </p>
              <label className="block text-xs font-black uppercase text-gray-400 mb-2">Reason (required)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                autoFocus rows={3}
                className="w-full p-4 rounded-xl border-2 border-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-textPrimary dark:text-white focus:border-error focus:outline-none transition resize-none text-sm"
                placeholder="e.g. Venue maintenance required due to sudden lighting failure…"
              />
              <div className="mt-5 flex gap-3">
                <button
                  onClick={confirmCancel}
                  disabled={cancelReason.trim().length < 5}
                  className={`flex-1 bg-error text-white py-3 rounded-xl font-black transition-all transform active:scale-95 ${cancelReason.trim().length < 5 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}
                >
                  Confirm Cancellation
                </button>
                <button
                  onClick={() => setCancelModalOpen(false)}
                  className="px-6 py-3 rounded-xl border border-border dark:border-slate-700 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition shadow-sm dark:text-white"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerDashboard;
