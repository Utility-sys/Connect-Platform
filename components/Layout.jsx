import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, MessageSquare, X, Send, ChevronDown, Activity, Music, Menu } from 'lucide-react';
import Logo from './Logo';
import { venues, CATEGORIES } from '../data/mockData';

// ── Category navigation config ──────────────────────────────────────────────
const NAV_SPORTS = [
  { label: 'Cricket',       type: 'Cricket' },
  { label: 'Futsal',        type: 'Futsal' },
  { label: 'Basketball',    type: 'Basketball' },
  { label: 'Badminton',     type: 'Badminton' },
  { label: 'Swimming Pools',type: 'Swimming' },
];
const NAV_ENTERTAINMENT = [
  { label: 'Music Studios',       type: 'Music Studio' },
  { label: 'Music Practice Areas',type: 'Music Practice' },
];

// ── NLP Chatbot helpers ─────────────────────────────────────────────────────
const detectCategory = (text) => {
  const t = text.toLowerCase();
  if (/cricket|bat|pitch|wicket|net/i.test(t)) return 'Cricket';
  if (/futsal|football|soccer/i.test(t)) return 'Futsal';
  if (/basketball|hoop|dunk/i.test(t)) return 'Basketball';
  if (/badminton|shuttle|smash|racket/i.test(t)) return 'Badminton';
  if (/swim|pool|lap|aqua/i.test(t)) return 'Swimming';
  if (/studio|record|mixing|track|song/i.test(t)) return 'Music Studio';
  if (/practice|rehearsal|band room|soundproof/i.test(t)) return 'Music Practice';
  return null;
};

const parseIntent = (msg) => {
  const text = msg.toLowerCase();
  const category = detectCategory(text);
  let intent = 'unknown';
  if (/(price|cost|how much|fee|charge)/i.test(text)) intent = 'get_price';
  else if (/(where|location|address|find|directions)/i.test(text)) intent = 'get_location';
  else if (/(book|available|reserve|timeslot)/i.test(text)) intent = 'book_venue';
  else if (/(recommend|suggest|best|good place|alternative)/i.test(text)) intent = 'recommendation';
  else if (/(cancel|edit|change|reschedule)/i.test(text)) intent = 'manage_booking';
  else if (/(help|support|contact|issue)/i.test(text)) intent = 'support';
  else if (/(hello|hi|hey|greet|good morning|good afternoon)/i.test(text)) intent = 'greeting';
  return { intent, text, category };
};

const generateResponse = (nlu) => {
  const { intent, text, category } = nlu;

  if (intent === 'greeting') return "Hello! I'm Connect AI. Tell me what sport you want to play or what entertainment venue you're looking for!";
  if (intent === 'support') return "For human support, visit our Help Center in the footer or email support@connect.lk";
  if (intent === 'manage_booking') return "You can edit or cancel your bookings from your Customer Dashboard. Note: cancellations must be made at least 3 hours before the booking time.";

  if (intent === 'get_price') {
    if (category) {
      const catVenues = venues.filter(v => v.type === category);
      if (catVenues.length) {
        const min = Math.min(...catVenues.map(v => v.priceNum));
        const max = Math.max(...catVenues.map(v => v.priceNum));
        return `${category} venues in Colombo range from LKR ${min.toLocaleString()} to LKR ${max.toLocaleString()} per hour. Use filters on the search page to narrow down by budget.`;
      }
    }
    return "Prices vary by venue type and location. You can view real-time pricing and availability by visiting our Search page and selecting your desired category.";
  }

  if (intent === 'book_venue') return "To book: search for your sport → click a venue card → select date & time → proceed to payment. All bookings are confirmed instantly!";

  if (intent === 'recommendation' || category) {
    const cat = category;
    if (cat) {
      const catVenues = venues.filter(v => v.type === cat).sort((a, b) => b.rating - a.rating).slice(0, 2);
      if (catVenues.length) {
        const list = catVenues.map(v => `• **${v.name}** (${v.location}) — ${v.price}, Rating: ${v.rating}`).join('\n');
        return `Here are top-rated ${cat} venues in Colombo:\n${list}\n\nSearch for more on our Venues page!`;
      }
    }
    return "I can give personalized recommendations! Tell me which sport or activity you're interested in — Cricket, Futsal, Badminton, Basketball, Swimming, or Music?";
  }

  return "I'm not sure about that. Try asking about venue prices, booking steps, or recommendations for a sport! Type 'cricket' or 'music studio' to get started.";
};

// ── Main Layout Component ───────────────────────────────────────────────────
function Layout() {
  const navigate = useNavigate();

  // theme
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // hamburger / mobile menu
  const [mobileOpen, setMobileOpen] = useState(false);

  // desktop mega-dropdown
  const [activeDropdown, setActiveDropdown] = useState(null); // 'sports' | 'entertainment' | null
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // chatbot
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Hi! I'm Connect AI. Ask me about venues, prices, or get recommendations!" }
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setTimeout(() => {
      const nlu = parseIntent(userMsg);
      const aiResponse = generateResponse(nlu);
      setChatMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
    }, 650);
  };

  const handleNavCategory = (type) => {
    setActiveDropdown(null);
    setMobileOpen(false);
    navigate(`/search?type=${encodeURIComponent(type)}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background dark:bg-slate-900 text-textPrimary dark:text-slate-200 font-body transition-colors duration-300">

      {/* ═══ NAVBAR ═══════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 nav-bg shadow-2xl border-b border-white/8" style={{background: 'var(--grad-nav)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between" ref={dropdownRef}>

          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0" onClick={() => { setActiveDropdown(null); setMobileOpen(false); }}>
            <Logo className="h-8 drop-shadow-md" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">

            {/* Home */}
            <Link to="/" className="nav-link px-3 py-2" onClick={() => setActiveDropdown(null)}>Home</Link>

            {/* Sports Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(prev => prev === 'sports' ? null : 'sports')}
                className={`nav-link px-3 py-2 flex items-center gap-1 rounded-lg transition ${activeDropdown === 'sports' ? 'bg-white/10 text-white' : ''}`}
              >
                Sports
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'sports' ? 'rotate-180' : ''}`} />
              </button>
              {activeDropdown === 'sports' && (
                <div className="absolute top-full left-0 mt-2 w-60 bg-white dark:bg-[#0F1E2B] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/8 overflow-hidden animate-slide-down">
                  <div className="p-2">
                    <div className="px-3 pt-2 pb-1 flex items-center gap-1.5">
                      <div className="fire-divider w-4" />
                      <p className="text-xs font-black uppercase tracking-widest" style={{color:'var(--fire-core)'}}>Sports Venues</p>
                    </div>
                    {NAV_SPORTS.map(item => (
                      <button
                        key={item.type}
                        onClick={() => handleNavCategory(item.type)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-orange-50 dark:hover:bg-white/5 text-textPrimary dark:text-white transition group"
                      >
                        <span className="font-semibold group-hover:text-[#D4550F] dark:group-hover:text-[#C4920A] transition text-sm">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Entertainment Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(prev => prev === 'entertainment' ? null : 'entertainment')}
                className={`nav-link px-3 py-2 flex items-center gap-1 rounded-lg transition ${activeDropdown === 'entertainment' ? 'bg-white/10 text-white' : ''}`}
              >
                Entertainment
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'entertainment' ? 'rotate-180' : ''}`} />
              </button>
              {activeDropdown === 'entertainment' && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#0F1E2B] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/8 overflow-hidden animate-slide-down">
                  <div className="p-2">
                    <div className="px-3 pt-2 pb-1 flex items-center gap-1.5">
                      <div className="w-4 h-0.5 rounded-full bg-purple-500" />
                      <p className="text-xs font-black uppercase tracking-widest text-purple-500">Entertainment</p>
                    </div>
                    {NAV_ENTERTAINMENT.map(item => (
                      <button
                        key={item.type}
                        onClick={() => handleNavCategory(item.type)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/10 text-textPrimary dark:text-white transition group"
                      >
                        <span className="font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition text-sm">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Venues */}
            <Link to="/search" className="nav-link px-3 py-2" onClick={() => setActiveDropdown(null)}>All Venues</Link>

            <div className="w-px h-6 bg-white/20 mx-2" />

            {/* Dark mode */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Link to="/customer-dashboard" className="nav-link px-3 py-2" onClick={() => setActiveDropdown(null)}>Dashboard</Link>
            <Link to="/login" className="nav-link px-3 py-2" onClick={() => setActiveDropdown(null)}>Log In</Link>
            <Link
              to="/register"
              onClick={() => setActiveDropdown(null)}
              className="ml-2 btn-fire px-5 py-2 text-sm"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile: dark-mode + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileOpen(prev => !prev)}
              aria-label="Toggle menu"
              className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Drawer ─────────────────────────────────────────────── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/8 animate-slide-down" style={{background:'var(--navy-800)'}}>
            <div className="px-4 py-4 space-y-1">
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-200 hover:bg-white/10 hover:text-white transition font-medium">Home</Link>
              <Link to="/search" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-200 hover:bg-white/10 hover:text-white transition font-medium">All Venues</Link>

              {/* Sports Section */}
              <div className="pt-2">
                <p className="px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Activity className="w-3 h-3" /> Sports</p>
                {NAV_SPORTS.map(item => (
                  <button key={item.type} onClick={() => handleNavCategory(item.type)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-200 hover:bg-accent/20 hover:text-white transition text-left">
                    <span>{item.icon}</span><span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Entertainment Section */}
              <div className="pt-2">
                <p className="px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Music className="w-3 h-3" /> Entertainment</p>
                {NAV_ENTERTAINMENT.map(item => (
                  <button key={item.type} onClick={() => handleNavCategory(item.type)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-200 hover:bg-purple-500/20 hover:text-white transition text-left">
                    <span>{item.icon}</span><span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1">
                <Link to="/customer-dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-200 hover:bg-white/10 transition font-medium">Dashboard</Link>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-200 hover:bg-white/10 transition font-medium">Log In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-white font-bold transition" style={{background:'var(--grad-fire)'}}>Sign Up</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ═══ MAIN CONTENT ══════════════════════════════════════════════════ */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* ═══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer className="text-white py-14 px-8 border-t-4" style={{background:'var(--grad-footer)', borderColor:'var(--fire-core)'}}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="inline-flex items-center mb-5">
              <Logo className="h-10 drop-shadow-md" />
            </Link>
            <p className="text-gray-300 max-w-xs leading-relaxed text-sm">
              The premier smart venue booking platform in Sri Lanka. Connecting sports enthusiasts and entertainers with the perfect spaces, effortlessly.
            </p>
            <div className="flex gap-3 mt-5">
              {/* Social icons would go here, emojis removed */}
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4 tracking-wide uppercase text-xs text-accent">Platform</h4>
            <ul className="space-y-2.5 text-gray-300 text-sm">
              <li><Link to="/search" className="hover:text-white transition animated-underline">Find Venues</Link></li>
              <li><Link to="/search?type=Cricket" className="hover:text-white transition animated-underline">Cricket</Link></li>
              <li><Link to="/search?type=Futsal" className="hover:text-white transition animated-underline">Futsal</Link></li>
              <li><Link to="/search?type=Music Studio" className="hover:text-white transition animated-underline">Music Studios</Link></li>
              <li><Link to="/owner-dashboard" className="hover:text-white transition animated-underline">For Venue Owners</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 tracking-wide uppercase text-xs text-accent">Support</h4>
            <ul className="space-y-2.5 text-gray-300 text-sm">
              <li><Link to="/help-center" className="hover:text-white transition animated-underline">Help Center</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-white transition animated-underline">Terms of Service</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-white transition animated-underline">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/10 text-center text-gray-400 text-sm">
          © 2026 Connect Platform. All rights reserved. · Built for Sri Lanka
        </div>
      </footer>

      {/* ═══ AI CHATBOT WIDGET ══════════════════════════════════════════════ */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isChatOpen && (
          <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl w-80 sm:w-96 mb-4 overflow-hidden border border-gray-200 dark:border-slate-700 flex flex-col animate-scale-in origin-bottom-right">
            {/* Chat Header */}
            <div className="p-4 text-white flex justify-between items-center" style={{background:'var(--grad-nav)'}}>
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-sm">
                    <MessageSquare className="w-4 h-4 text-accent" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-primary"></div>
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">Connect AI</h4>
                  <p className="text-xs text-gray-300">Venue Recommendation Engine</p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-72 p-4 overflow-y-auto bg-gray-50 dark:bg-slate-900/60 flex flex-col gap-3">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`text-sm p-3 rounded-xl shadow-sm max-w-[88%] whitespace-pre-line ${
                  msg.sender === 'ai'
                    ? 'bg-white dark:bg-slate-700 text-textPrimary dark:text-gray-200 rounded-tl-none self-start border border-gray-100 dark:border-slate-600'
                    : 'bg-accent text-white rounded-tr-none self-end'
                }`}>
                  {msg.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick suggestions */}
            <div className="px-3 py-2 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex gap-1.5 overflow-x-auto">
              {['Cricket venue', 'Music studio', 'Book a court', 'Cancel booking'].map(s => (
                <button key={s} onClick={() => { setChatInput(s); }}
                  className="flex-shrink-0 text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2.5 py-1.5 rounded-full hover:bg-accent/10 hover:text-accent transition">
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex gap-2">
              <input
                type="text"
                placeholder="Ask about venues..."
                className="flex-1 bg-gray-100 dark:bg-slate-900 border-none outline-none px-3 py-2 rounded-xl text-sm dark:text-white placeholder-gray-400"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                className="text-white p-2.5 rounded-xl transition active:scale-95" style={{background:'var(--grad-fire)'}}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Chat Toggle Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="relative text-white p-4 rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95 border-4 border-white dark:border-[#0D1B2A] animate-pulse-ring"
          style={{background: 'var(--grad-fire)', boxShadow: '0 4px 24px rgba(212,85,15,0.5)'}}
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          {!isChatOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full text-xs flex items-center justify-center animate-pulse border-2 border-white"></span>
          )}
        </button>
      </div>
    </div>
  );
}

export default Layout;
