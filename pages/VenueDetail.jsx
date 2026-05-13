import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Clock, Star, Share, Heart, Check, Wifi, Car, Coffee,
  Shield, X, CreditCard, Sparkles, ChevronLeft, AlertCircle, ArrowRight,
  CheckCircle, AlertTriangle, ChevronRight, ZoomIn, Users
} from 'lucide-react';
import { generateTimeSlots } from '../data/mockData';
import { useConnect } from '../context/ConnectContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { imgSrc } from '../utils/api';

// Fix for default Leaflet icon paths in React/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


// ── Helpers ───────────────────────────────────────────────────────────────────
const validate = {
  phone:      (v) => /^\(\+94\)\s\d{2}\s\d{3}\s\d{4}$/.test(v.trim()),
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
  phone:     'Format: (+94) XX XXX XXXX (e.g. (+94) 77 123 4567)',
  email:     'Enter a valid email address',
  cardNumber:'Must be 16 digits — XXXX XXXX XXXX XXXX',
  expiry:    'Invalid expiry (MM/YY, future date)',
  cvvVisa:   'CVV must be 3 digits',
  cvvMaster: 'CVV must be 4 digits for Mastercard',
  name:      'Please enter a valid name',
};

const fmtPhone    = (raw) => {
  const d = raw.replace(/\D/g, '').slice(2); // Remove non-digits and skip initial 94 if present
  const digits = raw.startsWith('(') ? raw.replace(/\D/g, '').slice(2) : raw.replace(/\D/g, '');
  // Clean logic: always assume +94 is handled by prefix
  const clean = raw.replace(/\D/g, '').startsWith('94') ? raw.replace(/\D/g, '').slice(2) : raw.replace(/\D/g, '');
  const f = clean.slice(0, 9);
  let res = '(+94)';
  if (f.length > 0) res += ' ' + f.slice(0, 2);
  if (f.length > 2) res += ' ' + f.slice(2, 5);
  if (f.length > 5) res += ' ' + f.slice(5, 9);
  return res;
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

const mapLocation = (locStr) => {
  const m = {
    'Colombo 02': [6.920, 79.851], 'Colombo 03': [6.903, 79.853], 'Colombo 04': [6.887, 79.855],
    'Colombo 05': [6.883, 79.866], 'Colombo 07': [6.908, 79.863], 'Dehiwala':   [6.836, 79.871],
    'Mount Lavinia': [6.833, 79.864], 'Rajagiriya': [6.907, 79.897], 'Nugegoda':   [6.868, 79.899]
  };
  return m[locStr] || [6.927, 79.861];
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

const StarRating = ({ rating, max=5, size=4 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <Star key={i} className={`w-${size} h-${size} ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-slate-600'}`} />
    ))}
  </div>
);

const getSameTypeVenues = (v, all, n=3) => {
  if (!v || !all || !Array.isArray(all)) return [];
  return all
    .filter(x => x.type === v.type && x.id !== v.id && x.status === 'Approved')
    .sort((a,b) => (b.rating || 0) - (a.rating || 0))
    .slice(0,n);
};



// ═══════════════════════════════════════════════════════════════════════════════
export default function VenueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    venues, 
    bookings, 
    createBooking, 
    currentUser, 
    incrementVenueViews, 
    fetchVenueById,
    fetchVenueReviews,
    addReview
  } = useConnect();

  const [detailedVenue, setDetailedVenue] = useState(null);
  const [fetchingDetail, setFetchingDetail] = useState(true);

  // Initial find from context list (summary data)
  const venueFromContext = useMemo(() => venues.find(v => String(v.id) === String(id)), [venues, id]);
  
  // High-privilege venue data (fullAddress etc)
  useEffect(() => {
    const loadDetail = async () => {
      setFetchingDetail(true);
      const data = await fetchVenueById(id);
      if (data) setDetailedVenue(data);
      setFetchingDetail(false);
    };
    if (id) loadDetail();
  }, [id, fetchVenueById]);

  // Combined venue object: Merge global list data with high-privilege detail data
  const venue = useMemo(() => {
    if (!detailedVenue && !venueFromContext) return null;
    return {
      ...(venueFromContext || {}), // Priority base (updates in real-time via context)
      ...(detailedVenue || {}),     // Add detailed fields (fullAddress, etc)
      // Override with context data for live fields if context is available
      ...(venueFromContext ? { 
        amenities: venueFromContext.amenities, 
        capacity: venueFromContext.capacity,
        price: venueFromContext.price,
        priceNum: venueFromContext.priceNum,
        name: venueFromContext.name,
        type: venueFromContext.type,
        location: venueFromContext.location,
        img: venueFromContext.img,
        gallery: venueFromContext.gallery,
        matchPrice: venueFromContext.matchPrice
      } : {})
    };
  }, [detailedVenue, venueFromContext]);


  // ── Approval Check ────────────────────────────────────────────────────────
  useEffect(() => {
    if (venue && venue.status && venue.status !== 'Approved') {
      const isOwner = currentUser && String(venue.ownerId) === String(currentUser.id);
      const isAdmin = currentUser && currentUser.role === 'admin';
      
      // If guest or unrelated customer tries to access a pending venue
      if (!isOwner && !isAdmin) {
        // Redirection logic: If it's not approved, customers can't be here.
        // We'll show the special 'Under Review' screen instead of redirecting immediately 
        // to avoid "blank page" feel, but practically they shouldn't reach here from search.
      }
    }
  }, [venue, currentUser]);


  if (fetchingDetail && !venueFromContext) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-medium animate-pulse">Syncing venue data...</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Venue Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs">The venue you're looking for might have been removed or the link is incorrect.</p>
        <button onClick={() => navigate('/')} className="btn-primary px-8 py-3 rounded-xl">Back to Marketplace</button>
      </div>
    );
  }


  // Final visibility check for unapproved venues
  const isOwner = currentUser && String(venue.ownerId) === String(currentUser.id);
  const isAdmin = currentUser && currentUser.role === 'admin';
  if (venue.status !== 'Approved' && !isOwner && !isAdmin) {
     return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6 animate-scale-in">
          <div className="w-24 h-24 bg-yellow-50 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Clock className="w-12 h-12 text-yellow-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Under Review</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">This venue is currently being verified by our team. Please check back later!</p>
          </div>
          <button onClick={() => navigate('/')} 
            className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:shadow-xl transition-all active:scale-95">
            Back to Home
          </button>
        </div>
      </div>
    );
  }



  // ── Increment view count on mount ─────────────────────────────────────────
  useEffect(() => {
    if (id) incrementVenueViews(id);
  }, [id, incrementVenueViews]);

  // ── All raw timeslots (24 Hours) ──────────────────────────────────────────
  const allTimeSlots = useMemo(() => generateTimeSlots(), []);

  // ── Real-time: filter past slots when viewing TODAY ───────────────────────
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const availableTimeSlots = useMemo(() => {
    if (Array.isArray(venue?.blockedDates) && venue.blockedDates.includes(selectedDate)) {
      return [];
    }
    
    let baseSlots = [...allTimeSlots];

    if (venue?.time && venue.time.toLowerCase() !== '24 hours') {
      try {
        const parts = venue.time.toLowerCase().split('-');
        if (parts.length === 2) {
          const parseHour = (str) => {
            const match = str.trim().match(/(\d+)\s*(am|pm)/i);
            if (match) {
              let num = parseInt(match[1], 10);
              const meridiem = match[2].toLowerCase();
              if (meridiem === 'pm' && num !== 12) num += 12;
              if (meridiem === 'am' && num === 12) num = 0;
              return num;
            }
            return 0;
          };
          
          const startHr = parseHour(parts[0]);
          let endHr = parseHour(parts[1]);
          if (endHr === 0) endHr = 24; // Treat 12 AM as the end of the day mathematically

          baseSlots = baseSlots.filter(s => {
            const val = parseInt(s.value, 10);
            if (startHr < endHr) {
              return val >= startHr && val < endHr;
            } else {
              // Handles overnight bookings (e.g., 10 PM - 2 AM)
              return val >= startHr || val < endHr;
            }
          });
        }
      } catch(e) { console.error('Time parse error:', e); }
    }

    if (selectedDate !== todayStr) return baseSlots; 
    const nowHour = new Date().getHours(); 
    return baseSlots.filter(s => parseInt(s.value, 10) > nowHour);
  }, [selectedDate, todayStr, allTimeSlots, venue]);

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
  const [bookingMode,   setBookingMode]   = useState('practice'); // 'practice' | 'match'
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [isLiked,       setIsLiked]       = useState(false);

  // ── Reviews state ───────────────────────────────────────────────────────
  const [reviews, setReviews] = useState([]);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [hasReviewed, setHasReviewed] = useState(false);
  
  // Fetch reviews on mount
  useEffect(() => {
    if (venue) {
      fetchVenueReviews(venue.id).then(data => {
        setReviews(data);
        if (currentUser) {
          setHasReviewed(data.some(r => String(r.userId) === String(currentUser.id)));
        }
      });
    }
  }, [venue, currentUser]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) return navigate('/login');
    const newReview = await addReview(venue.id, reviewData);
    if (newReview) {
      setReviews(prev => [newReview, ...prev]);
      setHasReviewed(true);
      setReviewFormOpen(false);
    }
  };

  // Payment modal

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [suggesterModalSlot, setSuggesterModalSlot] = useState(null);
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
  const [isProcessing, setIsProcessing] = useState(false);

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
  const hasMatchMode       = !!venue.matchPrice && (isCricketGround || isFootballOrFutsal || venue.type === 'Tennis' || venue.type === 'Badminton');

  const isSlotBooked = (date, time) =>
    bookings?.some(b =>
      String(b.venueId) === String(venue?.id) &&
      b.date === date &&
      (b.timeSlots?.includes(time) || b.timeSlot === time) &&
      b.status !== 'Cancelled'
    );


  // ── Pricing ────────────────────────────────────────────────────────────────
  const subtotal   = bookingMode === 'match' 
    ? (venue.matchPrice || 0) 
    : (venue.priceNum || 0) * selectedSlots.length;
    
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
    if (isProcessing) return;
    if (!/^\d{6}$/.test(otp.trim())) { setOtpError('Enter the 6-digit OTP'); return; }

    setIsProcessing(true);
    const booking = await createBooking({
      venueId:      venue.id,
      venueName:    venue.name,
      userId:       currentUser.id,
      ownerId:      venue.ownerId,
      customerName: `${firstName} ${lastName}`,
      customerEmail: email, // Captured from Step 1 form
      customerPhone: phone, // Captured from Step 1 form
      date:         selectedDate,
      timeSlots:    selectedSlots,
      totalPrice,
      img:          venue.img,
    });
    if (booking) {
      setConfirmationId(String(booking.id).split('-').pop().toUpperCase());
      setIsPayModalOpen(false);
      setIsConfirmed(true);
      setIsProcessing(false);
    } else {
      setOtpError('Booking failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setIsPayModalOpen(false); setPaymentStep(1);
    setErrors1({}); setErrors2({}); setOtpError('');
    setFirstName(currentUser?.firstName || ''); setLastName(currentUser?.lastName || '');
    setEmail(currentUser?.email || ''); setPhone('');
    setIsProcessing(false);
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

  const altVenues = useMemo(() => getSameTypeVenues(venue, venues), [venue, venues]);

  // ── Closed venue banner ─────────────────────────────────────────────────────
  const IsClosed = venue?.isClosed;


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
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> {venue.rating || 'N/A'}
                <button 
                  onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="underline ml-1 font-normal cursor-pointer hover:text-accent transition"
                >
                  ({reviews.length} Reviews)
                </button>
              </div>
              <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-accent" /> {venue.fullAddress || `${venue.location}, Colombo`}</div>
              <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-accent" /> {venue.time}</div>
              <div className="flex items-center gap-1.5 font-semibold"><Users className="w-4 h-4 text-accent" /> Max Capacity: {venue.capacity || 10} People</div>
            </div>
          </div>

          {/* About */}
          <div>
            <h2 className="text-2xl font-bold text-textPrimary dark:text-white mb-3">About this venue</h2>
            <p className="text-textSecondary dark:text-slate-300 leading-relaxed text-base">{venue.description}</p>
          </div>
          {/* ── Venue Location Map ────────────────────────────────────────────── */}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-textPrimary dark:text-white mb-5 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-accent" /> Venue Location & Directions
            </h2>
            
            <div className="bg-white dark:bg-slate-800 p-2 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden group">
              <div className="relative h-[350px] w-full rounded-2xl overflow-hidden">
                <iframe
                  title="Venue Map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(venue.fullAddress || venue.location + " Sri Lanka")}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  className="filter contrast-[1.1] grayscale-[0.2] transition-all duration-700 group-hover:grayscale-0"
                ></iframe>
              </div>
              
              <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-black text-accent uppercase tracking-widest mb-1 italic">Verified Address</p>
                  <p className="text-sm font-semibold text-textPrimary dark:text-white leading-relaxed">
                    {venue.fullAddress || `${venue.location}, Colombo, Sri Lanka`}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.fullAddress || venue.location + " Sri Lanka")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <MapPin className="w-4 h-4" /> Open in Google Maps
                </a>
              </div>
            </div>
          </div>


          {/* ── Community Reviews ────────────────────────────────────────────── */}
          <div id="reviews-section" className="pt-10 border-t border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-textPrimary dark:text-white">Community Experiences</h2>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <StarRating rating={venue.rating || 0} size={5} />
                    <span className="text-lg font-black dark:text-white ml-1">{venue.rating || '0.0'}</span>
                  </div>
                  <span className="text-sm text-textSecondary dark:text-slate-400 font-medium">Based on {reviews.length} verified experiences</span>
                </div>
              </div>
              
              {!hasReviewed && currentUser?.role === 'user' && (
                <button 
                  onClick={() => setReviewFormOpen(true)}
                  className="btn-primary py-3 px-6 rounded-2xl flex items-center gap-2 group shadow-lg shadow-primary/20"
                >
                  <Sparkles className="w-4 h-4 group-hover:animate-pulse" /> Write a Review
                </button>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="bg-gray-50 dark:bg-slate-800/40 border-2 border-dashed border-gray-100 dark:border-slate-700 p-12 rounded-3xl text-center">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Star className="w-8 h-8 text-gray-200" />
                </div>
                <h3 className="font-bold text-textPrimary dark:text-white mb-1">No reviews yet</h3>
                <p className="text-sm text-textSecondary dark:text-slate-400">Be the first to share your experience with this venue!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 overflow-x-auto">
                {reviews.map((r, idx) => (
                  <div key={r.id || idx} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-black text-xs">
                          {(r.reviewerName || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-textPrimary dark:text-white">{r.reviewerName || 'Anonymous'}</p>
                          <p className="text-[10px] text-textSecondary dark:text-slate-500 uppercase tracking-widest font-black">Verified Customer</p>
                        </div>
                      </div>
                      <StarRating rating={r.rating} size={3} />
                    </div>
                    {r.title && <h4 className="font-bold text-textPrimary dark:text-white mb-2">{r.title}</h4>}
                    <p className="text-sm text-textSecondary dark:text-slate-300 leading-relaxed italic">"{r.comment}"</p>
                    <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      <Clock className="w-3 h-3" /> {new Date(r.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                {/* Booking Mode Selector */}
              {hasMatchMode && (
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 p-4 rounded-2xl mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 mb-3 text-center">Select Purpose</p>
                  <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-inner relative z-0">
                    <button onClick={() => setBookingMode('practice')}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${bookingMode === 'practice' ? 'bg-accent text-white shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}>
                      Practice / Fun
                    </button>
                    <button onClick={() => setBookingMode('match')}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${bookingMode === 'match' ? 'bg-accent text-white shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}>
                      Tournament / Match
                    </button>
                  </div>
                  <p className="text-[9px] text-orange-600/70 dark:text-orange-400/70 mt-2 text-center italic font-medium">
                    {bookingMode === 'match' ? `Match mode uses a flat fee of LKR ${venue.matchPrice?.toLocaleString()} per session.` : `Hourly rates starting from LKR ${venue.priceNum?.toLocaleString()}.`}
                  </p>
                </div>
              )}

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
                          const isBlockedDate = Array.isArray(venue?.blockedDates) && venue.blockedDates.includes(dateStr);
                          const isSel   = selectedDate === dateStr;
                          return (
                            <button
                              key={day}
                              disabled={isPast || isBlockedDate}
                              onClick={() => { setSelectedDate(dateStr); setSelectedSlots([]); }}
                              className={`aspect-square rounded-full text-[10px] font-bold transition-all flex items-center justify-center relative overflow-hidden
                                ${isPast || isBlockedDate ? 'text-gray-300 dark:text-slate-700 cursor-not-allowed' :
                                  isSel ? 'bg-primary text-white shadow-lg scale-110 z-10' :
                                  isToday ? 'border-2 border-primary/40 text-primary dark:text-accent' :
                                  'hover:bg-white dark:hover:bg-slate-800 text-textSecondary dark:text-slate-400'
                                }
                              `}
                            >
                              {isBlockedDate && <div className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20" />}
                              {isBlockedDate && <div className="absolute w-full h-[1px] bg-red-400/50 -rotate-45" />}
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
                              onClick={() => {
                                if (!currentUser || currentUser.role !== 'user') return; // Only users can select slots
                                if (booked) {
                                  setSuggesterModalSlot({ time: s, label: s.label });
                                  return;
                                }
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
                                ${booked ? 'bg-gray-100 dark:bg-slate-800 border-transparent text-gray-400 dark:text-slate-500 cursor-pointer line-through hover:border-accent hover:text-accent' :
                                  active ? 'border-accent bg-accent text-white shadow-md scale-105 shadow-orange-500/30' :
                                  (!currentUser || currentUser.role !== 'user') ? 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700 text-gray-400 dark:text-slate-600 cursor-default' :
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
                    if (currentUser.role !== 'user') return; // Restriction
                    if (selectedDate && selectedSlots.length > 0) setIsPayModalOpen(true);
                  }}
                  disabled={currentUser && currentUser.role !== 'user'}
                  className={`w-full py-4 mt-6 rounded-2xl font-black text-sm transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 ${
                    (!currentUser || currentUser.role === 'user') && (selectedDate && selectedSlots.length > 0)
                      ? 'text-white shadow-fire'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                  style={(!currentUser || currentUser.role === 'user') && (selectedDate && selectedSlots.length > 0) ? { background: 'var(--grad-fire)' } : {}}
                >
                  {!currentUser ? 'Sign in to Book' : 
                   currentUser.role === 'owner' ? 'Viewing as Owner' :
                   currentUser.role === 'admin' ? 'Viewing as Admin' :
                   !selectedDate ? 'Select a Date' : 
                   selectedSlots.length===0 ? 'Pick Your Time' : 'Reserve Fast Track →'}
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
                  <Field label="Phone Number" error={errors1.phone}>
                    <input 
                      type="tel" 
                      className={`form-field ${errors1.phone?'form-field-error':''}`} 
                      value={phone || '(+94) '} 
                      onChange={e=>setPhone(fmtPhone(e.target.value))} 
                      placeholder="(+94) 77 123 4567" 
                      maxLength={17} 
                    />
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
                  <button type="submit" disabled={isProcessing} className="btn-fire w-full py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    {isProcessing ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                    {isProcessing ? 'Processing...' : 'Verify & Pay'}
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
      {/* ══════════════════════════════════ INTELLIGENT SUGGESTER MODAL ══════════ */}
      {suggesterModalSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden relative">
            <button onClick={() => setSuggesterModalSlot(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 dark:hover:text-white bg-gray-100 dark:bg-slate-800 p-2 rounded-full transition z-10"><X className="w-5 h-5" /></button>
            
            <div className="p-8">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-5">
                <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-2xl font-black text-textPrimary dark:text-white mb-2">Slot {suggesterModalSlot.label} is Unavailable</h3>
              <p className="text-textSecondary dark:text-slate-400 mb-6 text-sm leading-relaxed">
                Someone else has already reserved this slot. But don't worry! Our AI found {altVenues.length} alternative {venue.type} venues nearby that are highly rated.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {altVenues.map(v => (
                  <Link key={v.id} to={`/venue/${v.id}`} onClick={() => setSuggesterModalSlot(null)}
                    className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3 rounded-2xl group hover:border-accent hover:shadow-md transition">
                    <img src={imgSrc(v.img)} alt={v.name} className="w-16 h-16 object-cover rounded-xl" />
                    <div>
                      <h4 className="font-bold text-textPrimary dark:text-white text-sm group-hover:text-accent transition line-clamp-1">{v.name}</h4>
                      <div className="text-xs text-textSecondary dark:text-slate-400 mt-1 mb-1">{v.location}</div>
                      <div className="text-xs font-bold text-primary dark:text-white flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {v.rating} <span className="opacity-50 ml-1">· {v.price}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {altVenues.length === 0 && (
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-center text-sm text-textSecondary dark:text-slate-400">
                  We couldn't find any close matches right now. Please select another time slot.
                </div>
              )}
            </div>
            <div className="bg-gradient-to-r from-accent to-orange-400 p-4 text-center">
              <span className="text-white text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-1.5"><Sparkles className="w-4 h-4" /> AI Powered Suggestion</span>
            </div>
          </div>
        </div>
      )}

      {/* ══ REVIEW FORM MODAL ══════════════════════════════════════════════════ */}
      {reviewFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden relative">
            <div className="p-6 text-white flex justify-between items-center" style={{ background: 'var(--grad-nav)' }}>
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6" />
                <h3 className="text-xl font-black">Share Your Experience</h3>
              </div>
              <button onClick={() => setReviewFormOpen(false)} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={submitReview} className="p-8 space-y-6">
              <div className="text-center">
                <p className="text-xs font-black uppercase text-textSecondary dark:text-slate-500 tracking-widest mb-4">How was your session at {venue.name}?</p>
                <div className="flex justify-center gap-3">
                  {[1,2,3,4,5].map(s => (
                    <button 
                      key={s} type="button" 
                      onClick={() => setReviewData(p => ({ ...p, rating: s }))}
                      className="group transition transform active:scale-90"
                    >
                      <Star 
                        className={`w-12 h-12 transition-all duration-300 ${s <= reviewData.rating ? 'text-yellow-400 fill-yellow-400 drop-shadow-lg scale-110' : 'text-gray-200 dark:text-slate-700 hover:text-yellow-200'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-textSecondary mb-2">Headline (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Briefly describe your highlight..."
                    value={reviewData.title}
                    onChange={e => setReviewData(p => ({ ...p, title: e.target.value }))}
                    className="form-field"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-textSecondary mb-2">Detailed Comments</label>
                  <textarea 
                    rows={4} 
                    required
                    placeholder="Tell other players about the pitch quality, facilities, or atmosphere..."
                    value={reviewData.comment}
                    onChange={e => setReviewData(p => ({ ...p, comment: e.target.value }))}
                    className="form-field resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button" onClick={() => setReviewFormOpen(false)}
                  className="flex-1 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 text-textSecondary dark:text-slate-400 font-bold hover:bg-gray-100 transition"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="btn-fire flex-1 py-4 rounded-2xl font-black text-sm transition-all"
                >
                  Publish Experience →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
