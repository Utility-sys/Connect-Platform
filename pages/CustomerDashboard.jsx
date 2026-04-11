import { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar, CreditCard, MapPin, CheckCircle, Clock,
  Edit2, X, AlertCircle, Check, Shield, User, Star
} from 'lucide-react';
import { generateTimeSlots } from '../data/mockData';
import { useConnect } from '../context/ConnectContext';

const API_BASE = 'http://localhost:5000';
const imgSrc = (path) => {
  if (!path) return 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&q=80';
  if (path.startsWith('/')) return `${API_BASE}${path}`;
  return path;
};

// ── 3-hour modification window ────────────────────────────────────────────────
const canModify = (dateStr, slots) => {
  const hour = Array.isArray(slots) ? slots[0] : slots;
  if (!hour) return false;
  const dt = new Date(`${dateStr}T${String(hour).padStart(2,'0')}:00:00`);
  return dt - new Date() > 3 * 60 * 60 * 1000;
};

const timeSlotsList = generateTimeSlots();

const statusBadge = {
  Confirmed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  Cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  Edited:    'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
};

const timeLabel = (slots) => {
  const arr = Array.isArray(slots) ? slots : (slots ? [slots] : []);
  return arr.sort().map(h => timeSlotsList.find(s => s.value === h)?.label || `${h}:00`).join(', ') || '—';
};

export default function CustomerDashboard() {
  const { bookings: allBookings, currentUser, cancelBooking, updateBooking } = useConnect();
  const location = useLocation();
  const navigate  = useNavigate();
  const showConfirmed = new URLSearchParams(location.search).get('status') === 'confirmed';
  const today = new Date().toISOString().split('T')[0];

  // ── Filter to this user's bookings ────────────────────────────────────────
  const myBookings = useMemo(() =>
    allBookings.filter(b => b.customerId === currentUser?.id || b.userId === currentUser?.id)
  , [allBookings, currentUser]);

  const activeBookings    = useMemo(() => myBookings.filter(b => b.status !== 'Cancelled'), [myBookings]);
  const cancelledBookings = useMemo(() => myBookings.filter(b => b.status === 'Cancelled'), [myBookings]);

  const paymentHistory = useMemo(() =>
    myBookings.map(b => ({
      id:     b.id,
      amount: `LKR ${(b.totalPrice || 0).toLocaleString()}.00`,
      method: 'Visa ending in 4242',
      status: b.status === 'Cancelled' ? 'Refunded' : 'Successful',
      colour: b.status === 'Cancelled' ? 'text-gray-500' : 'text-green-600',
    }))
  , [myBookings]);

  // ── Edit modal state ──────────────────────────────────────────────────────
  const [editTarget, setEditTarget]   = useState(null);
  const [editDate,   setEditDate]     = useState('');
  const [editHour,   setEditHour]     = useState('');
  const [editError,  setEditError]    = useState('');
  const [editSaving, setEditSaving]   = useState(false);

  // ── Cancel confirm state ──────────────────────────────────────────────────
  const [cancelTarget,  setCancelTarget]   = useState(null);
  const [cancelSaving,  setCancelSaving]   = useState(false);

  // ── Inline modify-window errors (per booking id) ──────────────────────────
  const [modifyErrors, setModifyErrors] = useState({});

  const openEdit = (b) => {
    if (!canModify(b.date, b.timeSlots)) {
      setModifyErrors(prev => ({ ...prev, [b.id]: 'edit' }));
      return;
    }
    setModifyErrors(prev => { const n={...prev}; delete n[b.id]; return n; });
    setEditTarget(b);
    setEditDate(b.date);
    setEditHour(Array.isArray(b.timeSlots) ? b.timeSlots[0] : b.timeSlot || '');
    setEditError('');
  };

  const saveEdit = async () => {
    if (!editDate || !editHour) { setEditError('Please select a date and time.'); return; }
    setEditSaving(true);
    await updateBooking(editTarget.id, { date: editDate, timeSlots: [editHour], timeSlot: editHour, status: 'Edited' });
    setEditSaving(false);
    setEditTarget(null);
  };

  const openCancel = (b) => {
    if (!canModify(b.date, b.timeSlots)) {
      setModifyErrors(prev => ({ ...prev, [b.id]: 'cancel' }));
      return;
    }
    setModifyErrors(prev => { const n={...prev}; delete n[b.id]; return n; });
    setCancelTarget(b);
  };

  const confirmCancel = async () => {
    setCancelSaving(true);
    await cancelBooking(cancelTarget.id, 'Cancelled by customer');
    setCancelSaving(false);
    setCancelTarget(null);
  };

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen py-10 px-6 sm:px-10 transition-colors duration-300 animate-fade-in">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-black text-textPrimary dark:text-white">My Dashboard</h1>
            <p className="text-textSecondary dark:text-slate-400 mt-1">Manage your bookings, payments, and account.</p>
          </div>
          <Link to="/search" className="btn-fire px-5 py-2.5 text-sm rounded-xl inline-flex items-center gap-2">
            Book New Venue
          </Link>
        </div>

        {/* ── Booking confirmed banner ──────────────────────────────────────── */}
        {showConfirmed && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-fade-in-up">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-bold text-green-700 dark:text-green-400">Booking Confirmed!</h4>
              <p className="text-sm text-green-600/80 dark:text-green-500">Your payment was processed. Booking details are below.</p>
            </div>
          </div>
        )}

        {/* ── Policy banner ─────────────────────────────────────────────────── */}
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-3.5 rounded-2xl mb-8 flex items-start gap-3 text-sm">
          <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-blue-700 dark:text-blue-400">
            <strong>Cancellation & Edit Policy:</strong> You may edit or cancel any booking up to <strong>3 hours before</strong> the reserved time. After that, modifications are locked.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Bookings ──────────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Active */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-textPrimary dark:text-white mb-5 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" /> Active Bookings
                <span className="ml-auto text-sm font-normal text-textSecondary dark:text-slate-400">
                  {activeBookings.length} booking{activeBookings.length !== 1 ? 's' : ''}
                </span>
              </h2>

              {activeBookings.length === 0 ? (
                <div className="text-center py-10 text-textSecondary dark:text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No active bookings. <Link to="/search" className="text-accent hover:underline">Book a venue</Link></p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeBookings.map(b => {
                    const modErr = modifyErrors[b.id];
                    return (
                      <div key={b.id} className="border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 rounded-2xl overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start gap-4 p-4">
                          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                            <img src={imgSrc(b.img)} alt={b.venueName} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                              <h4 className="font-bold text-textPrimary dark:text-white">{b.venueName}</h4>
                              <span className={`category-pill text-xs ${statusBadge[b.status] || statusBadge.Confirmed}`}>{b.status}</span>
                            </div>
                            <div className="text-sm text-textSecondary dark:text-slate-400 flex items-center gap-1 mb-1">
                              <MapPin className="w-3.5 h-3.5" /> {b.location || b.Venue?.location || 'Colombo'}
                            </div>
                            <div className="text-sm text-textSecondary dark:text-slate-400 flex items-center gap-1 mb-1">
                              <Clock className="w-3.5 h-3.5" />
                              {b.date} · <span className="font-bold">{timeLabel(b.timeSlots || b.timeSlot)}</span>
                            </div>
                            <p className="text-xs text-gray-400 font-mono mt-1">#{b.id}</p>
                          </div>
                        </div>

                        {/* Action row */}
                        <div className="border-t border-gray-100 dark:border-slate-700 px-4 py-3 flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800">
                          <span className="font-bold text-primary dark:text-white text-sm">LKR {(b.totalPrice||0).toLocaleString()}</span>
                          <div className="ml-auto flex gap-2">
                            <button
                              onClick={() => openEdit(b)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white transition active:scale-95"
                              style={{ background: 'var(--grad-nav)' }}
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => openCancel(b)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 text-sm font-semibold hover:bg-red-600 hover:text-white hover:border-red-600 transition active:scale-95"
                            >
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </div>
                        </div>

                        {/* Modify-window error */}
                        {modErr && (
                          <div className="mx-4 mb-3 flex items-start gap-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-3 rounded-xl text-sm text-red-700 dark:text-red-400 animate-fade-in">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>
                              {modErr === 'edit' ? 'Edit' : 'Cancellation'} not allowed — the booking is within 3 hours of the reserved time.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cancelled */}
            {cancelledBookings.length > 0 && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h2 className="text-xl font-bold text-textPrimary dark:text-white mb-5 flex items-center gap-2">
                  <X className="w-5 h-5 text-red-500" /> Cancelled Bookings
                </h2>
                <div className="space-y-3">
                  {cancelledBookings.map(b => (
                    <div key={b.id} className="border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl flex flex-col gap-2 opacity-80 hover:opacity-100 transition">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={imgSrc(b.img)} alt={b.venueName} className="w-full h-full object-cover grayscale" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-textPrimary dark:text-white line-through text-sm">{b.venueName}</h4>
                          <div className="text-xs text-textSecondary dark:text-slate-400 mt-0.5">{b.date} · {timeLabel(b.timeSlots || b.timeSlot)}</div>
                        </div>
                        <span className={`category-pill text-xs ${statusBadge.Cancelled}`}>Cancelled</span>
                      </div>
                      {b.cancellationReason && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                          <p className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-wider mb-1">
                            {b.cancellationReason === 'Cancelled by customer' ? 'Cancelled by you' : 'Owner Message:'}
                          </p>
                          <p className="text-xs italic text-textSecondary dark:text-slate-300">"{b.cancellationReason}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Payment History */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-textPrimary dark:text-white mb-5 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-500" /> Payment History
              </h2>
              {paymentHistory.length === 0 ? (
                <p className="text-sm text-textSecondary dark:text-slate-400 italic">No transactions yet.</p>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.map((p, i) => (
                    <div key={i} className="flex justify-between items-start pb-4 border-b border-gray-100 dark:border-slate-700 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold text-textPrimary dark:text-white text-sm">{p.amount}</p>
                        <p className="text-xs text-textSecondary dark:text-slate-400 mt-0.5">{p.method}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">#{p.id}</p>
                      </div>
                      <span className={`text-xs font-bold ${p.colour}`}>{p.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account info */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-textPrimary dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-accent" /> My Account
              </h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-accent to-orange-400 rounded-full flex items-center justify-center text-white font-black text-lg">
                  {currentUser?.firstName?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-bold text-textPrimary dark:text-white text-sm">{currentUser?.firstName} {currentUser?.lastName}</p>
                  <p className="text-xs text-textSecondary dark:text-slate-400">{currentUser?.email}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-textSecondary dark:text-slate-400">
                  <span>Total bookings</span><span className="font-medium text-textPrimary dark:text-white">{myBookings.length}</span>
                </div>
                <div className="flex justify-between text-textSecondary dark:text-slate-400">
                  <span>Active</span><span className="font-medium text-textPrimary dark:text-white">{activeBookings.length}</span>
                </div>
              </div>
            </div>

            {/* Find venue CTA */}
            <div className="bg-gradient-to-br from-primary to-primary-lighter p-5 rounded-2xl text-white">
              <h4 className="font-bold mb-3">Looking for a venue?</h4>
              <p className="text-xs text-gray-300 mb-4">Browse premium Colombo venues — cricket, futsal, music studios and more.</p>
              <Link to="/search" className="text-white text-sm font-bold py-2.5 px-4 rounded-xl transition inline-block w-full text-center active:scale-95" style={{ background: 'var(--grad-fire)' }}>
                Find a Venue
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ══ EDIT MODAL ═══════════════════════════════════════════════════════ */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 text-white flex justify-between items-center" style={{ background: 'var(--grad-nav)' }}>
              <div className="flex items-center gap-2"><Edit2 className="w-4 h-4" /> <span className="font-bold">Edit Booking</span></div>
              <button onClick={() => setEditTarget(null)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-textSecondary dark:text-slate-400">Reschedule your booking. Changes are applied immediately.</p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-slate-400 mb-1.5">New Date</label>
                <input type="date" min={today} value={editDate} onChange={e=>setEditDate(e.target.value)} className="form-field" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-slate-400 mb-1.5">New Time Slot</label>
                <select value={editHour} onChange={e=>setEditHour(e.target.value)} className="form-field">
                  <option value="">Select a time slot</option>
                  {timeSlotsList.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              {editError && <p className="text-xs text-red-600">{editError}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditTarget(null)} className="flex-1 py-2.5 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition">Cancel</button>
                <button
                  onClick={saveEdit} disabled={editSaving || !editDate || !editHour}
                  className="flex-1 bg-accent disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-xl text-sm font-bold transition active:scale-95 flex items-center gap-1.5 justify-center"
                >
                  {editSaving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : <><Check className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ CANCEL CONFIRM MODAL ═════════════════════════════════════════════ */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-textPrimary dark:text-white mb-2">Cancel Booking?</h3>
              <p className="text-sm text-textSecondary dark:text-slate-400 mb-1">
                Are you sure you want to cancel your booking at <strong className="text-textPrimary dark:text-white">{cancelTarget.venueName}</strong>?
              </p>
              <p className="text-xs text-textSecondary dark:text-slate-500 mb-6">A refund will be processed within 3–5 business days.</p>
              <div className="flex gap-3">
                <button onClick={() => setCancelTarget(null)} className="flex-1 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition">Keep Booking</button>
                <button
                  onClick={confirmCancel} disabled={cancelSaving}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-bold transition active:scale-95 flex items-center justify-center gap-2"
                >
                  {cancelSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
