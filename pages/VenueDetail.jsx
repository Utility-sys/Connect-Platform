import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Clock, Star, Share, Heart, Check, Wifi, Car, Coffee,
  Shield, X, CreditCard, Sparkles, ChevronLeft, AlertCircle, ArrowRight,
  CheckCircle, AlertTriangle, ChevronRight, ZoomIn
} from 'lucide-react';
import { generateTimeSlots } from '../data/mockData';
import { useConnect } from '../context/ConnectContext';

const API_BASE = 'http://localhost:5000';

// ── Helpers ───────────────────────────────────────────────────────────────────
const validate = {
  phone:      (v) => /^\+94\s\d{2}\s\d{3}\s\d{4}$/.test(v.trim()),
  email:      (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  cardNumber: (v) => /^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(v.trim()),
  expiry:     (v) => {
    if (!/^\d{2}\/\d{2}$/.test(v.trim())) return false;
    const [mm, yy] = v.split('/').map(Number);
    if (mm < 1 || mm > 12) return false;
    return new Date(2000 + yy, mm - 1) >= new Date(new Date().getFullYear(), new Date().getMonth());
  },
  cvv:  (v, net) => net === 'Mastercard' ? /^\d{4}$/.test(v) : /^\d{3}$/.test(v),
  name: (v) => v.trim().length >= 2,
};

const ERR = {
  phone:     'Format: +94 XX XXX XXXX (e.g. +94 77 123 4567)',
  email:     'Enter a valid email address',
  cardNumber:'Must be 16 digits — XXXX XXXX XXXX XXXX',
  expiry:    'Invalid expiry (MM/YY, future date)',
  cvvVisa:   'CVV must be 3 digits',
  cvvMaster: 'CVV must be 4 digits for Mastercard',
  name:      'Please enter a valid name',
};

const fmtCard   = (raw) => raw.replace(/\D/g,'').slice(0,16).replace(/(\d{4})(?=\d)/g,'$1 ').trim();
const fmtExpiry = (raw) => { const d=raw.replace(/\D/g,'').slice(0,4); return d.length>=3?`${d.slice(0,2)}/${d.slice(2)}`:d; };

const typeColour = (type) => {
  const m = { Cricket:'bg-green-100 text-green-700', Futsal:'bg-blue-100 text-blue-700',
    Football:'bg-emerald-100 text-emerald-700', Basketball:'bg-orange-100 text-orange-700',
    Badminton:'bg-yellow-100 text-yellow-700', Swimming:'bg-cyan-100 text-cyan-700',
    'Music Studio':'bg-purple-100 text-purple-700', 'Music Practice':'bg-pink-100 text-pink-700' };
  return m[type] || 'bg-gray-100 text-gray-700';
};

// Resolve image src: if starts with / treat as backend static, else full URL
const imgSrc = (path) => {
  if (!path) return 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&q=80';
  if (path.startsWith('/')) return `${API_BASE}${path}`;
  return path;
};

const InlineError = ({ msg }) => msg ? (
  <div className="flex items-start gap-1.5 mt-1.5 text-red-600 dark:text-red-400 text-xs animate-fade-in">
    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{msg}</span>
  </div>
) : null;

const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>
    {children}
    <InlineError msg={error} />
  </div>
);

const getSameTypeVenues = (v, all, n=3) =>
  all.filter(x => x.type === v.type && x.id !== v.id).sort((a,b) => b.rating-a.rating).slice(0,n);

// ═══════════════════════════════════════════════════════════════════════════════
export default function VenueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { venues, bookings, createBooking, currentUser, incrementVenueViews } = useConnect();

  const venue = useMemo(() => venues.find(v => String(v.id) === String(id)), [venues, id]);

  // ── Increment view count on mount ─────────────────────────────────────────
  useEffect(() => {
    if (id) incrementVenueViews(id);
  }, [id, incrementVenueViews]);

  // ── All raw timeslots (6 AM – 10 PM) ─────────────────────────────────────
  const allTimeSlots = useMemo(() => generateTimeSlots(), []);

  // ── Real-time: filter past slots when viewing TODAY ───────────────────────
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const availableTimeSlots = useMemo(() => {
    if (selectedDate !== todayStr) return allTimeSlots; // future day — all visible
    const nowHour = new Date().getHours(); // e.g. 13 at 1 PM
    return allTimeSlots.filter(s => parseInt(s.value, 10) > nowHour);
  }, [selectedDate, todayStr, allTimeSlots]);

  // ── Gallery state ─────────────────────────────────────────────────────────
  const gallery = useMemo(() => {
    const imgs = [];
    if (venue?.img) imgs.push(venue.img);
    if (Array.isArray(venue?.gallery)) {
      venue.gallery.forEach(g => { if (g && !imgs.includes(g)) imgs.push(g); });
    }
    return imgs.length > 0 ? imgs : ['https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&q=80'];
  }, [venue]);

  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Reset active image when venue changes
  useEffect(() => { setActiveImg(0); }, [venue?.id]);

  // ── Booking state ─────────────────────────────────────────────────────────
  const [bookingMode,   setBookingMode]   = useState('practice');
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [isLiked,       setIsLiked]       = useState(false);

  // Payment modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentStep,    setPaymentStep]    = useState(1);
  const [isConfirmed,    setIsConfirmed]    = useState(false);
  const [confirmationId, setConfirmationId] = useState('');

  // Step 1
  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName,  setLastName]  = useState(currentUser?.lastName  || '');
  const [email,     setEmail]     = useState(currentUser?.email     || '');
  const [phone,     setPhone]     = useState('');
  const [errors1,   setErrors1]   = useState({});

  // Step 2
  const [cardType,    setCardType]    = useState('Credit');
  const [cardNetwork, setCardNetwork] = useState('Visa');
  const [cardNumber,  setCardNumber]  = useState('');
  const [expiry,      setExpiry]      = useState('');
  const [cvv,         setCvv]         = useState('');
  const [cardName,    setCardName]    = useState('');
  const [errors2,     setErrors2]     = useState({});

  // Step 3 OTP
  const [otp,      setOtp]      = useState('');
  const [otpError, setOtpError] = useState('');

  if (!venue) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-slate-900">
      <div className="text-center">
        <p className="text-textSecondary dark:text-slate-400 text-lg mb-4">Venue not found.</p>
        <button onClick={() => navigate(-1)} className="btn-primary px-6 py-3 rounded-xl">Go Back</button>
      </div>
    </div>
  );

  const isCricketGround   = venue.type === 'Cricket'  && venue.facilityType === 'Ground with all facilities';
  const isFootballOrFutsal = venue.type === 'Football' || venue.type === 'Futsal';
  const hasMatchMode       = isCricketGround || isFootballOrFutsal;

  const isSlotBooked = (date, time) =>
    bookings.some(b =>
      String(b.venueId) === String(venue.id) &&
      b.date === date &&
      (b.timeSlots?.includes(time) || b.timeSlot === time) &&
      b.status !== 'Cancelled'
    );

  // ── Pricing ────────────────────────────────────────────────────────────────
  const subtotal   = (venue.priceNum || 0) * selectedSlots.length;
  const serviceFee = Math.round(subtotal * 0.1);
  const totalPrice = subtotal + serviceFee;

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!validate.name(firstName))    e.firstName = ERR.name;
    if (!validate.name(lastName))     e.lastName  = ERR.name;
    if (!validate.email(email))       e.email     = ERR.email;
    if (!validate.phone(phone))       e.phone     = ERR.phone;
    setErrors1(e);
    return !Object.keys(e).length;
  };
  const validateStep2 = () => {
    const e = {};
    if (!validate.name(cardName))         e.cardName   = ERR.name;
    if (!validate.cardNumber(cardNumber)) e.cardNumber = ERR.cardNumber;
    if (!validate.expiry(expiry))         e.expiry     = ERR.expiry;
    if (!validate.cvv(cvv, cardNetwork))  e.cvv = cardNetwork === 'Mastercard' ? ERR.cvvMaster : ERR.cvvVisa;
    setErrors2(e);
    return !Object.keys(e).length;
  };

  const handleStep1 = (e) => { e.preventDefault(); if (validateStep1()) setPaymentStep(2); };
  const handleStep2 = (e) => { e.preventDefault(); if (validateStep2()) setPaymentStep(3); };

  const handleStep3 = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) { setOtpError('Enter the 6-digit OTP'); return; }

    const booking = await createBooking({
      venueId:      venue.id,
      venueName:    venue.name,
      ownerId:      venue.ownerId,
      customerName: `${firstName} ${lastName}`,
      date:         selectedDate,
      timeSlots:    selectedSlots,
      totalPrice,
      img:          venue.img,
    });
    if (booking) {
      setConfirmationId(String(booking.id).split('-').pop().toUpperCase());
      setIsPayModalOpen(false);
      setIsConfirmed(true);
    } else {
      setOtpError('Booking failed. Please try again.');
    }
  };

  const resetModal = () => {
    setIsPayModalOpen(false); setPaymentStep(1);
    setErrors1({}); setErrors2({}); setOtpError('');
    setFirstName(currentUser?.firstName || ''); setLastName(currentUser?.lastName || '');
    setEmail(currentUser?.email || ''); setPhone('');
    setCardNumber(''); setExpiry(''); setCvv(''); setCardName('');
    setOtp('');
  };

  // ── Calendar helpers ────────────────────────────────────────────────────────
  const [calYear, setCalYear]   = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth()); // 0-indexed
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay(); // 0=Sun

  const monthNames = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y=>y-1); } else setCalMonth(m=>m-1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y=>y+1); } else setCalMonth(m=>m+1); };

  const altVenues = getSameTypeVenues(venue, venues);

  // ── Closed venue banner ─────────────────────────────────────────────────────
  const IsClosed = venue.isClosed;

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen pb-20 transition-colors duration-300 animate-fade-in">

      {/* ── Photo Gallery ──────────────────────────────────────────────────── */}
      <div className="h-[55vh] min-h-[420px] flex gap-2 p-2 animate-fade-in-up">

        {/* Main image */}
        <div className="w-2/3 h-full relative overflow-hidden rounded-2xl cursor-pointer group" onClick={() => setLightboxOpen(true)}>
          <img src={imgSrc(gallery[activeImg])} alt="Main" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          <button onClick={(e) => { e.stopPropagation(); navigate(-1); }}
            className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow hover:bg-white transition">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur-sm">
            <ZoomIn className="w-3.5 h-3.5" /> {gallery.length} photo{gallery.length !== 1 ? 's' : ''}
          </div>
          {IsClosed && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="bg-red-600 text-white px-6 py-3 rounded-2xl text-center">
                <p className="font-black text-xl mb-1">Temporarily Closed</p>
                {venue.closureReason && <p className="text-sm opacity-90">{venue.closureReason}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        <div className="w-1/3 flex flex-col gap-2 h-full">
          {gallery.slice(0, 2).map((img, i) => (
            <div key={i}
              className={`flex-1 overflow-hidden rounded-2xl cursor-pointer group relative ${activeImg === i ? 'ring-2 ring-accent' : ''}`}
              onClick={() => setActiveImg(i)}
            >
              <img src={imgSrc(img)} alt={`thumb-${i}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-700 opacity-90" />
              {gallery.length > 2 && i === 1 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <span className="text-white font-bold text-sm border-2 border-white px-4 py-2 rounded-xl backdrop-blur-sm">
                    +{gallery.length - 2} more
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Lightbox ────────────────────────────────────────────────────────── */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setLightboxOpen(false)}>
            <X className="w-8 h-8" />
          </button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); setActiveImg(i => (i - 1 + gallery.length) % gallery.length); }}>
            <ChevronLeft className="w-10 h-10" />
          </button>
          <img src={imgSrc(gallery[activeImg])} alt="" className="max-w-4xl max-h-[85vh] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); setActiveImg(i => (i + 1) % gallery.length); }}>
            <ChevronRight className="w-10 h-10" />
          </button>
          <div className="absolute bottom-4 flex gap-2">
            {gallery.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setActiveImg(i); }}
                className={`w-2 h-2 rounded-full transition ${activeImg === i ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        </div>
      )}

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 mt-8 flex flex-col lg:flex-row gap-12">

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <div className="flex-1 space-y-10">

          {/* Closed banner */}
          {IsClosed && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-700 dark:text-red-400">This venue is temporarily closed</p>
                {venue.closureReason && <p className="text-sm text-red-600/80 dark:text-red-400/70 mt-0.5">{venue.closureReason}</p>}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <div className="flex justify-between items-start mb-4 gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`category-pill text-xs ${typeColour(venue.type)}`}>{venue.type}</span>
                  <span className="text-xs text-textSecondary dark:text-slate-400">{venue.category}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-textPrimary dark:text-white font-heading">{venue.name}</h1>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-textSecondary hover:border-gray-400 transition shadow-sm">
                  <Share className="w-5 h-5" />
                </button>
                <button onClick={() => setIsLiked(!isLiked)}
                  className={`p-2.5 rounded-xl border transition shadow-sm ${isLiked ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-textSecondary'}`}>
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-5 text-textSecondary dark:text-slate-400 text-sm items-center border-b border-gray-100 dark:border-slate-700 pb-6">
              <div className="flex items-center gap-1.5 font-semibold text-primary dark:text-white">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> {venue.rating}
                <span className="underline ml-1 font-normal cursor-pointer hover:text-accent transition">(128 Reviews)</span>
              </div>
              <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-accent" /> {venue.location}, Colombo</div>
              <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-accent" /> {venue.time}</div>
            </div>
          </div>

          {/* About */}
          <div>
            <h2 className="text-2xl font-bold text-textPrimary dark:text-white mb-3">About this venue</h2>
            <p className="text-textSecondary dark:text-slate-300 leading-relaxed text-base">{venue.description}</p>
          </div>

          {/* Amenities */}
          <div>
            <h2 className="text-2xl font-bold text-textPrimary dark:text-white mb-5">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <Wifi className="w-5 h-5 text-primary dark:text-accent" />, label: 'Free Wi-Fi' },
                { icon: <Car className="w-5 h-5 text-primary dark:text-accent" />, label: 'Free Parking' },
                { icon: <Coffee className="w-5 h-5 text-primary dark:text-accent" />, label: 'Cafe / Snacks' },
                { icon: <Shield className="w-5 h-5 text-primary dark:text-accent" />, label: 'Lockers' },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-3 shadow-sm">
                  {a.icon}<span className="text-sm font-medium text-textSecondary dark:text-slate-300">{a.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gallery thumbnail strip (if multiple) */}
          {gallery.length > 2 && (
            <div>
              <h2 className="text-2xl font-bold text-textPrimary dark:text-white mb-4">Gallery</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {gallery.map((img, i) => (
                  <button key={i} onClick={() => { setActiveImg(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`flex-shrink-0 w-28 h-20 rounded-xl overflow-hidden border-2 transition ${activeImg === i ? 'border-accent' : 'border-transparent'}`}>
                    <img src={imgSrc(img)} alt="" className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="pt-6 border-t border-gray-100 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-textPrimary dark:text-white flex items-center gap-2 mb-6">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" /> {venue.rating} · 128 Reviews
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { name:'Kamindu M.', date:'March 2026', title:'Excellent quality', body:'Best facility in Colombo right now. Well maintained and the lighting is great for night sessions.', stars:5 },
                { name:'Sarah P.',   date:'February 2026', title:'Great facilities', body:'Easy to book, ample parking, and clean changing rooms. Will definitely come back!', stars:5 },
              ].map((r, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                  <div className="flex gap-1 mb-2">{[...Array(r.stars)].map((_,j) => <Star key={j} className="w-4 h-4 text-yellow-500 fill-yellow-500" />)}</div>
                  <h4 className="font-bold text-textPrimary dark:text-white mb-1">{r.title}</h4>
                  <p className="text-sm text-textSecondary dark:text-slate-400 mb-3">"{r.body}"</p>
                  <div className="text-xs text-gray-400 font-medium">By {r.name} · {r.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Alternatives */}
          {altVenues.length > 0 && (
            <div className="pt-6 border-t border-gray-100 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-textPrimary dark:text-white flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-accent to-orange-400 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> AI
                </span>
                Alternative {venue.type} Venues
              </h2>
              <p className="text-sm text-textSecondary dark:text-slate-400 mb-5">
                If this venue isn't available at your preferred time, our AI recommends these similar {venue.type} venues nearby:
              </p>
              <div className="flex gap-4 overflow-x-auto pb-3">
                {altVenues.map(v => (
                  <Link key={v.id} to={`/venue/${v.id}`}
                    className="min-w-[260px] bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all group">
                    <div className="h-36 overflow-hidden relative">
                      <img src={imgSrc(v.img)} alt={v.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                      <div className="absolute top-2 right-2 bg-white/95 px-2 py-0.5 rounded-lg text-xs font-bold text-primary flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {v.rating}
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-textPrimary dark:text-white group-hover:text-accent transition text-sm mb-1 line-clamp-1">{v.name}</h4>
                      <div className="text-xs text-textSecondary dark:text-slate-400 flex items-center gap-1 mb-3">
                        <MapPin className="w-3 h-3" /> {v.location}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary dark:text-white text-sm">{v.price}</span>
                        <span className="text-xs text-accent font-semibold flex items-center gap-0.5">View <ArrowRight className="w-3 h-3" /></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Booking Sidebar ──────────────────────────────────────────────── */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="sticky top-24 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-2xl overflow-hidden">
            {isConfirmed ? (
              <div className="text-center py-8 animate-fade-in-up">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-black text-textPrimary dark:text-white mb-2">Booking Confirmed!</h3>
                <p className="text-textSecondary dark:text-slate-400 mb-5 text-sm">Details sent to your email. Manage in your Dashboard.</p>
                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-700 text-left mb-5">
                  <div className="text-xs text-textSecondary dark:text-slate-400 mb-1">Confirmation Number</div>
                  <div className="font-mono font-black text-lg dark:text-white">#{confirmationId}</div>
                </div>
                <Link to="/customer-dashboard?status=confirmed" className="btn-primary w-full inline-flex items-center justify-center gap-2">
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : IsClosed ? (
              /* CLOSED SIDEBAR */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-black text-red-700 dark:text-red-400 mb-2">Temporarily Closed</h3>
                <p className="text-textSecondary dark:text-slate-400 text-sm">
                  {venue.closureReason || 'This venue is currently not accepting bookings. Please check back soon.'}
                </p>
              </div>
            ) : (
              <>
                {/* Pricing header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-textSecondary dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Pricing</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-primary dark:text-white">{venue.price?.split('/')[0]}</span>
                      <span className="text-textSecondary dark:text-slate-400 text-sm font-medium">/ hr</span>
                    </div>
                  </div>
                  <div className={`p-2 rounded-xl text-center min-w-[80px] ${hasMatchMode ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'}`}>
                    <div className="text-[10px] font-black uppercase leading-none mb-1">Type</div>
                    <div className="text-xs font-bold leading-none">{venue.facilityType || venue.category}</div>
                  </div>
                </div>

                {/* Match/Practice Toggle */}
                {hasMatchMode && (
                  <div className="flex p-1 bg-gray-100 dark:bg-slate-900 rounded-2xl mb-6">
                    {['practice','match'].map(mode => (
                      <button key={mode}
                        onClick={() => { setBookingMode(mode); setSelectedSlots(mode==='match'&&isCricketGround ? ['06','07','08','09','10','11','12','13','14','15','16','17'] : []); }}
                        className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${bookingMode===mode ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-textSecondary'}`}
                      >
                        {mode === 'practice' ? 'PRACTICE' : `MATCH (${isCricketGround ? 'DAY' : '120 MINS'})`}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-6">
                  {/* ── Calendar ──────────────────────────────────────────── */}
                  <div>
                    <label className="block text-[10px] font-black text-textSecondary dark:text-slate-500 uppercase tracking-widest mb-3">
                      1. Select Your Date
                    </label>
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-black text-textPrimary dark:text-white">{monthNames[calMonth]} {calYear}</span>
                        <div className="flex gap-1">
                          <button onClick={prevMonth} className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-textSecondary">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button onClick={nextMonth} className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-textSecondary">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['S','M','T','W','T','F','S'].map((d,i) => (
                          <span key={i} className="text-[10px] font-bold text-gray-400 uppercase">{d}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {/* Empty cells before 1st */}
                        {Array.from({ length: firstDayOfMonth }).map((_,i) => <span key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }, (_,i) => {
                          const day = i + 1;
                          const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                          const isToday = dateStr === todayStr;
                          const isPast  = dateStr < todayStr;
                          const isSel   = selectedDate === dateStr;
                          return (
                            <button
                              key={day}
                              disabled={isPast}
                              onClick={() => { setSelectedDate(dateStr); setSelectedSlots([]); }}
                              className={`aspect-square rounded-full text-[10px] font-bold transition-all flex items-center justify-center
                                ${isPast ? 'text-gray-300 dark:text-slate-700 cursor-not-allowed' :
                                  isSel ? 'bg-primary text-white shadow-lg scale-110 z-10' :
                                  isToday ? 'border-2 border-primary/40 text-primary dark:text-accent' :
                                  'hover:bg-white dark:hover:bg-slate-800 text-textSecondary dark:text-slate-400'
                                }
                              `}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ── Time Slots ─────────────────────────────────────────── */}
                  <div>
                    <label className="block text-[10px] font-black text-textSecondary dark:text-slate-500 uppercase tracking-widest mb-3 flex justify-between">
                      <span>2. {bookingMode==='match'&&isCricketGround ? 'Full Ground Booked' : 'Select Time Slot(s)'}</span>
                      {selectedSlots.length > 0 && !(bookingMode==='match'&&isCricketGround) && (
                        <span className="text-primary font-black lowercase">{selectedSlots.length} hr{selectedSlots.length>1?'s':''}</span>
                      )}
                    </label>

                    {bookingMode==='match'&&isCricketGround ? (
                      <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                        <div className="flex items-center gap-3 mb-2">
                          <CheckCircle className="w-5 h-5 text-orange-600" />
                          <span className="text-sm font-bold text-orange-800 dark:text-orange-400">Match Booking Active</span>
                        </div>
                        <p className="text-[10px] text-orange-700/70 dark:text-orange-400/60 leading-tight">
                          Includes exclusive ground access, pitch prep, and pavilion use from 8:00 AM to 6:00 PM.
                        </p>
                      </div>
                    ) : availableTimeSlots.length === 0 && selectedDate === todayStr ? (
                      <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl text-center text-sm text-textSecondary dark:text-slate-400">
                        No more available slots for today. Please select a future date.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availableTimeSlots.map(s => {
                          const booked = isSlotBooked(selectedDate, s.value);
                          const active = selectedSlots.includes(s.value);
                          return (
                            <button
                              key={s.value}
                              disabled={booked}
                              onClick={() => {
                                if (bookingMode==='match'&&isFootballOrFutsal) {
                                  if (active) { setSelectedSlots([]); return; }
                                  const idx = availableTimeSlots.findIndex(t => t.value === s.value);
                                  if (idx >= availableTimeSlots.length - 1) { alert('Cannot start a 120-min match at the final slot.'); return; }
                                  const next = availableTimeSlots[idx+1].value;
                                  if (isSlotBooked(selectedDate, next)) { alert('The next slot is taken. 120-min matches need 2 consecutive free slots.'); return; }
                                  setSelectedSlots([s.value, next]);
                                } else {
                                  setSelectedSlots(prev => active ? prev.filter(t=>t!==s.value) : [...prev, s.value]);
                                }
                              }}
                              className={`py-3 px-1 flex items-center justify-center flex-wrap rounded-xl border-2 text-[10.5px] font-black transition-all tracking-tight leading-loose
                                ${booked ? 'bg-gray-100 dark:bg-slate-800 border-transparent text-gray-300 dark:text-slate-600 cursor-not-allowed line-through' :
                                  active ? 'border-accent bg-accent text-white shadow-md scale-105 shadow-orange-500/30' :
                                  'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-textSecondary dark:text-slate-400 hover:border-accent/50'}
                              `}
                            >
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing Summary */}
                {selectedSlots.length > 0 && (
                  <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl mt-6 space-y-2 border border-gray-100 dark:border-slate-700 animate-fade-in">
                    <div className="flex justify-between text-xs text-textSecondary dark:text-slate-400">
                      <span>{venue.price?.split('/')[0]} × {selectedSlots.length} hrs</span>
                      <span className="font-bold dark:text-white">LKR {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-textSecondary dark:text-slate-400">
                      <span className="underline cursor-pointer">Platform Service Fee</span>
                      <span className="font-bold dark:text-white">LKR {serviceFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-black text-lg text-textPrimary dark:text-white pt-3 border-t border-gray-200 dark:border-slate-700">
                      <span>Total Price</span>
                      <span className="text-primary dark:text-accent">LKR {totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <button
                  onClick={() => {
                    if (!currentUser) { navigate('/login'); return; }
                    if (selectedDate && selectedSlots.length > 0) setIsPayModalOpen(true);
                  }}
                  className={`w-full py-4 mt-6 rounded-2xl font-black text-sm transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 ${
                    !currentUser || (selectedDate && selectedSlots.length > 0)
                      ? 'text-white shadow-fire'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                  style={!currentUser || (selectedDate && selectedSlots.length > 0) ? { background: 'var(--grad-fire)' } : {}}
                >
                  {!currentUser ? 'Sign in to Book' : !selectedDate ? 'Select a Date' : selectedSlots.length===0 ? 'Pick Your Time' : 'Reserve Fast Track →'}
                </button>
                <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-textSecondary dark:text-slate-500 font-medium">
                  <Shield className="w-3.5 h-3.5 text-success" /> Trusted Secure Checkout
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══ PAYMENT MODAL ══════════════════════════════════════════════════════ */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden relative max-h-[95vh] overflow-y-auto">

            {/* Header */}
            <div className="p-4 text-white flex justify-between items-center sticky top-0 z-10" style={{ background: 'var(--grad-nav)' }}>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm">Secure Checkout</h3>
                  <p className="text-xs text-gray-300">Step {paymentStep} of 3</p>
                </div>
              </div>
              <button onClick={resetModal} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="flex">
              {[1,2,3].map(s => (
                <div key={s} className={`flex-1 h-1 ${s<=paymentStep?'bg-accent':'bg-gray-200 dark:bg-slate-700'} transition-all duration-500`} />
              ))}
            </div>

            <div className="p-6">
              {/* Amount */}
              <div className="text-center mb-5">
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Amount Due</p>
                <p className="text-3xl font-black text-gray-800 dark:text-white">LKR {totalPrice.toLocaleString()}.00</p>
                <p className="text-xs text-textSecondary dark:text-slate-400 mt-1">
                  {venue.name} · {selectedDate} · {selectedSlots.length} hr{selectedSlots.length>1?'s':''}
                </p>
              </div>

              {/* ── STEP 1 ─ Contact ───────────────────────────────────────── */}
              {paymentStep === 1 && (
                <form className="space-y-4 animate-fade-in-up" onSubmit={handleStep1} noValidate>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First Name" error={errors1.firstName}>
                      <input type="text" className={`form-field ${errors1.firstName?'form-field-error':''}`} value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Kasun" />
                    </Field>
                    <Field label="Last Name" error={errors1.lastName}>
                      <input type="text" className={`form-field ${errors1.lastName?'form-field-error':''}`} value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Perera" />
                    </Field>
                  </div>
                  <Field label="Email Address" error={errors1.email}>
                    <input type="email" className={`form-field ${errors1.email?'form-field-error':''}`} value={email} onChange={e=>setEmail(e.target.value)} placeholder="kasun@email.com" />
                  </Field>
                  <Field label="Phone Number (+94 XX XXX XXXX)" error={errors1.phone}>
                    <input type="tel" className={`form-field ${errors1.phone?'form-field-error':''}`} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+94 77 123 4567" maxLength={16} />
                  </Field>
                  <button type="submit" className="btn-fire w-full mt-2 py-3.5 rounded-xl">Continue to Payment →</button>
                </form>
              )}

              {/* ── STEP 2 ─ Card ──────────────────────────────────────────── */}
              {paymentStep === 2 && (
                <form className="space-y-4 animate-fade-in-up" onSubmit={handleStep2} noValidate>
                  <div>
                    <p className="text-xs font-bold text-gray-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Card Type</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['Credit','Debit'].map(ct => (
                        <button key={ct} type="button" onClick={()=>setCardType(ct)}
                          className={`py-2.5 rounded-xl text-sm font-bold border-2 transition ${cardType===ct?'border-accent bg-accent/5 text-accent':'border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-300 hover:border-gray-300'}`}>
                          {ct} Card
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Card Network</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['Visa','Mastercard'].map(cn => (
                        <button key={cn} type="button" onClick={()=>{setCardNetwork(cn);setCvv('');}}
                          className={`py-3 px-4 rounded-xl text-sm font-bold border-2 transition flex items-center justify-center gap-2 ${cardNetwork===cn?'border-accent bg-accent/5':'border-gray-200 dark:border-slate-600 hover:border-gray-300'}`}>
                          {cn==='Visa' ? <span className="font-black italic text-blue-700 text-base tracking-tight">VISA</span> : (
                            <span className="flex items-center gap-0.5">
                              <span className="w-5 h-5 bg-red-500 rounded-full inline-block opacity-90" />
                              <span className="w-5 h-5 bg-yellow-400 rounded-full inline-block -ml-2 opacity-90" />
                            </span>
                          )}
                          {cn}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label="Name on Card" error={errors2.cardName}>
                    <input type="text" className={`form-field ${errors2.cardName?'form-field-error':''}`} value={cardName} onChange={e=>setCardName(e.target.value)} placeholder="Kasun Perera" />
                  </Field>
                  <Field label="Card Number (16 digits)" error={errors2.cardNumber}>
                    <input type="text" className={`form-field font-mono ${errors2.cardNumber?'form-field-error':''}`} value={cardNumber} onChange={e=>setCardNumber(fmtCard(e.target.value))} placeholder="0000 0000 0000 0000" maxLength={19} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Expiry (MM/YY)" error={errors2.expiry}>
                      <input type="text" className={`form-field font-mono ${errors2.expiry?'form-field-error':''}`} value={expiry} onChange={e=>setExpiry(fmtExpiry(e.target.value))} placeholder="MM/YY" maxLength={5} />
                    </Field>
                    <Field label={`CVV (${cardNetwork==='Mastercard'?'4 digits':'3 digits'})`} error={errors2.cvv}>
                      <input type="password" className={`form-field font-mono ${errors2.cvv?'form-field-error':''}`} value={cvv} onChange={e=>setCvv(e.target.value.replace(/\D/g,'').slice(0,cardNetwork==='Mastercard'?4:3))} placeholder={cardNetwork==='Mastercard'?'0000':'000'} maxLength={cardNetwork==='Mastercard'?4:3} />
                    </Field>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 text-xs p-3 rounded-xl">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    <span>256-bit SSL encryption. Your card details are never stored.</span>
                  </div>
                  <button type="submit" className="btn-fire w-full py-3.5 rounded-xl flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" /> Secure Payment
                  </button>
                  <button type="button" onClick={()=>setPaymentStep(1)} className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 hover:underline transition">← Back to details</button>
                </form>
              )}

              {/* ── STEP 3 ─ OTP ───────────────────────────────────────────── */}
              {paymentStep === 3 && (
                <form className="space-y-5 animate-fade-in-up text-center" onSubmit={handleStep3} noValidate>
                  <div>
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-black text-gray-800 dark:text-white text-lg">Bank Verification</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                      A 6-digit OTP has been sent to your registered mobile ending in ****{phone.slice(-2)}.
                    </p>
                  </div>
                  <div>
                    <input
                      type="text" inputMode="numeric" placeholder="------" maxLength={6} value={otp}
                      onChange={e=>{setOtp(e.target.value.replace(/\D/g,'').slice(0,6));setOtpError('');}}
                      className="w-36 text-center text-3xl tracking-widest font-mono border-2 border-gray-300 dark:border-slate-600 rounded-xl p-3 bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-accent/50 focus:border-accent focus:outline-none mx-auto block transition"
                    />
                    <InlineError msg={otpError} />
                    <button type="button" className="text-xs text-accent hover:underline mt-2 block mx-auto" onClick={()=>{}}>Resend OTP</button>
                  </div>
                  <button type="submit" className="btn-fire w-full py-3.5 rounded-xl flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Verify &amp; Pay
                  </button>
                  <button type="button" onClick={()=>setPaymentStep(2)} className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 hover:underline transition">← Back</button>
                </form>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700 p-3 text-center text-xs text-gray-400 dark:text-slate-500 flex items-center justify-center gap-2">
              <Shield className="w-3.5 h-3.5" /> Secured by PayHere Innovation · PCI DSS Compliant
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
