/**
 * AdminDashboard.jsx
 * Standalone admin console — has its own login form.
 * Does NOT depend on the main platform Layout or ConnectContext session.
 */
import { useState, useEffect } from 'react';
import { adminApi } from '../utils/api';
import {
  Users, Building2, BookOpen, TrendingUp, CheckCircle, XCircle,
  Clock, Shield, Eye, AlertTriangle, BarChart3, LogOut,
  ChevronDown, ChevronUp, Search, RefreshCw, Lock, Mail, KeyRound, Settings,
  Activity, FileText, X, Sun, Moon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from 'recharts';

// ── Helper components ─────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    Pending:   'bg-yellow-100 text-yellow-700',
    Approved:  'bg-green-100  text-green-700',
    Rejected:  'bg-red-100    text-red-700',
    Confirmed: 'bg-blue-100   text-blue-700',
    Cancelled: 'bg-gray-100   text-gray-500',
    Edited:    'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

const CHART_COLORS = ['#f97316', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.15em]">{label}</div>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{value ?? '—'}</div>
    {sub && <div className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 font-medium">{sub}</div>}
  </div>
);

const ChartCard = ({ title, children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm ${className}`}>
    <h3 className="text-sm font-black text-gray-700 dark:text-slate-200 uppercase tracking-widest mb-5">{title}</h3>
    {children}
  </div>
);


// ── Standalone Admin Login Screen (with mandatory 2FA enforcement) ───────────
function AdminLogin({ setAdminUser, setAdminToken }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Stage: 'credentials' | 'setup2fa' | 'verify2fa'
  const [stage, setStage]       = useState('credentials');
  const [qrCode, setQrCode]     = useState('');
  const [secret, setSecret]     = useState('');
  const [setupToken, setSetupToken] = useState(''); // temp token for 2FA setup only
  const [totpCode, setTotpCode] = useState('');
  const [copied, setCopied]     = useState(false);
  const [requires2FA, setRequires2FA] = useState(false); // existing 2FA on next login

  const handleCredentials = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await adminApi.post(`/auth/login`, {
        email, password,
        ...(requires2FA && totpCode ? { totpToken: totpCode } : {})
      });

      if (data.user?.role !== 'admin') {
        setError('Access denied. This portal is restricted to administrators.');
        setLoading(false); return;
      }

      // Admin logged in successfully with 2FA already verified
      setAdminUser(data.user);
      setAdminToken(data.token);
      sessionStorage.setItem('admin_token', data.token);
      sessionStorage.setItem('admin_user', JSON.stringify(data.user));

    } catch (err) {
      const d = err.response?.data;

      if (d?.requiresAdminTwoFASetup) {
        // Admin has no 2FA yet — force setup
        setSetupToken(d.setupToken);
        // Use the setup token to call the setup endpoint
        try {
          const setupRes = await adminApi.post(`/auth/2fa/setup`, {}, {
            headers: { Authorization: `Bearer ${d.setupToken}` }
          });
          setQrCode(setupRes.data.qrCode);
          setSecret(setupRes.data.secret);
          setStage('setup2fa');
        } catch {
          setError('Failed to initialize 2FA setup. Please try again.');
        }
      } else if (d?.requires2FA) {
        // Admin has 2FA, just needs to enter the code
        setRequires2FA(true);
        setStage('verify2fa');
      } else {
        setError(d?.message || 'Login failed. Check your credentials.');
      }
    }
    setLoading(false);
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await adminApi.post(`/auth/login`, { email, password, totpToken: totpCode });
      if (data.user?.role !== 'admin') { setError('Access denied.'); setLoading(false); return; }
      setAdminUser(data.user);
      setAdminToken(data.token);
      sessionStorage.setItem('admin_token', data.token);
      sessionStorage.setItem('admin_user', JSON.stringify(data.user));
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid 2FA code.');
    }
    setLoading(false);
  };

  const handleActivate2FA = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await adminApi.post(`/auth/2fa/verify`, { token: totpCode }, {
        headers: { Authorization: `Bearer ${setupToken}` }
      });
      // 2FA is now active, re-login normally to get full token
      const { data } = await adminApi.post(`/auth/login`, { email, password, totpToken: totpCode });
      if (data.user?.role !== 'admin') { setError('Access denied.'); setLoading(false); return; }
      setAdminUser(data.user);
      setAdminToken(data.token);
      sessionStorage.setItem('admin_token', data.token);
      sessionStorage.setItem('admin_user', JSON.stringify(data.user));
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code. Check your authenticator app.');
    }
    setLoading(false);
  };

  const copySecret = () => { navigator.clipboard.writeText(secret); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const wrapperCls = "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4";
  const cardCls    = "bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-white/5";
  const inputCls   = "w-full py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition text-sm";
  const btnCls     = "w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2 shadow-lg";

  return (
    <div className={wrapperCls}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img src="/logo.png" alt="Connect" className="h-14 mx-auto mb-6 object-contain" />
          <h1 className="text-3xl font-black text-white">Admin Console</h1>
          <p className="text-slate-400 mt-1 text-sm">Connect Platform — Superuser Access</p>
        </div>

        <div className={cardCls}>

          {/* ── STAGE 1: Credentials ── */}
          {stage === 'credentials' && (
            <>
              <h2 className="text-xl font-black text-gray-800 dark:text-white mb-1">Sign In</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Use your admin credentials to continue.</p>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-5 flex items-start gap-2 text-red-700 dark:text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
                </div>
              )}

              <form onSubmit={handleCredentials} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@connect.lk" className={`${inputCls} pl-10 pr-4`} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={`${inputCls} pl-10 pr-4`} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className={btnCls}>
                  {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Signing in…</> : <><KeyRound className="w-4 h-4" /> Sign In to Admin Console</>}
                </button>
              </form>
              <p className="text-center text-xs text-gray-400 mt-6">This portal is restricted to authorized administrators only.</p>
            </>
          )}

          {/* ── STAGE 2: Mandatory 2FA Setup (first-time admin) ── */}
          {stage === 'setup2fa' && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800 dark:text-white leading-tight">Security Setup Required</h2>
                  <p className="text-xs text-orange-500 font-bold">Mandatory for all administrators</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
                Scan this QR code with <strong>Google Authenticator</strong> or <strong>Authy</strong>, then enter the 6-digit code to activate your account.
              </p>

              {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4 text-red-700 dark:text-red-400 text-sm">{error}</div>}

              {qrCode && (
                <div className="flex justify-center mb-4">
                  <img src={qrCode} alt="2FA QR Code" className="w-44 h-44 rounded-xl border-4 border-orange-100 shadow-lg" />
                </div>
              )}

              <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-3 mb-5 border border-gray-100 dark:border-slate-700">
                <p className="text-xs text-gray-400 mb-1 font-bold">Manual entry key:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-gray-700 dark:text-slate-300 break-all">{secret}</code>
                  <button type="button" onClick={copySecret} className="flex-shrink-0 px-2 py-1 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition">
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <form onSubmit={handleActivate2FA} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">6-Digit Code from App</label>
                  <input
                    type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} required
                    value={totpCode} onChange={e => setTotpCode(e.target.value)}
                    placeholder="000000"
                    className={`${inputCls} px-4 text-center text-2xl font-mono tracking-[0.3em]`}
                  />
                </div>
                <button type="submit" disabled={loading || totpCode.length < 6} className={btnCls}>
                  {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Activating…</> : <><Shield className="w-4 h-4" /> Activate 2FA & Enter Console</>}
                </button>
              </form>
            </>
          )}

          {/* ── STAGE 3: Verify existing 2FA ── */}
          {stage === 'verify2fa' && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800 dark:text-white leading-tight">Two-Factor Verification</h2>
                  <p className="text-xs text-green-500 font-bold">Account protected by 2FA</p>
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                Open <strong>Google Authenticator</strong> and enter the 6-digit code for Connect Platform.
              </p>

              {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4 text-red-700 dark:text-red-400 text-sm">{error}</div>}

              <form onSubmit={handleVerify2FA} className="space-y-4">
                <input
                  type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} required
                  value={totpCode} onChange={e => setTotpCode(e.target.value)}
                  placeholder="000000"
                  className={`${inputCls} px-4 text-center text-3xl font-mono tracking-[0.4em]`}
                />
                <button type="submit" disabled={loading || totpCode.length < 6} className={btnCls}>
                  {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Verifying…</> : <><KeyRound className="w-4 h-4" /> Verify & Enter Console</>}
                </button>
              </form>
              <button onClick={() => { setStage('credentials'); setTotpCode(''); setError(''); }} className="w-full text-center text-xs text-gray-400 mt-4 hover:text-gray-600 transition">← Back to login</button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  // Own state — fully independent from ConnectContext
  const [adminUser, setAdminUser]   = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('admin_user')); } catch { return null; }
  });
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('admin_token'));

  const [tab, setTab]               = useState('overview');
  const [stats, setStats]           = useState(null);
  const [analytics, setAnalytics]   = useState(null);
  const [users, setUsers]           = useState([]);
  const [venues, setVenues]         = useState([]);
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [venueSearch, setVenueSearch] = useState('');
  const [error, setError]           = useState('');
  const [moderating, setModerating] = useState(null);
  const [venueExpanded, setVenueExpanded] = useState(null);

  // Credentials state
  const [credForm, setCredForm]     = useState({ currentPassword: '', newEmail: '', newPassword: '', confirmPassword: '' });
  const [credLoading, setCredLoading] = useState(false);
  const [credMsg, setCredMsg]       = useState(null); // { type: 'success'|'error', text }

  // Theme support
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);


  // NOTE: Authorization headers are now managed automatically by Axios Interceptors in src/utils/api.js
  useEffect(() => {
    if (adminUser && adminToken) {
      sessionStorage.setItem('admin_user',  JSON.stringify(adminUser));
      sessionStorage.setItem('admin_token', adminToken);
    } else {
      sessionStorage.removeItem('admin_user');
      sessionStorage.removeItem('admin_token');
    }
  }, [adminUser, adminToken]);


  useEffect(() => {
    if (adminUser) {
      fetchAll();
      // Polling for true real-time feel (5 seconds)
      const interval = setInterval(fetchAll, 5000); 
      return () => clearInterval(interval);
    }
  }, [adminUser]); // eslint-disable-line

  const handleLogin = (user, token) => {
    setAdminUser(user);
    setAdminToken(token);
  };

  const handleLogout = () => {
    setAdminUser(null);
    setAdminToken(null);
    setStats(null); setUsers([]); setVenues([]); setBookings([]);
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setCredMsg(null);
    if (credForm.newPassword && credForm.newPassword !== credForm.confirmPassword) {
      setCredMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (!credForm.newEmail && !credForm.newPassword) {
      setCredMsg({ type: 'error', text: 'Provide a new email or a new password to update.' });
      return;
    }
    setCredLoading(true);
    try {
      const { data } = await adminApi.put(`/admin/credentials`, {
        currentPassword:  credForm.currentPassword,
        newEmail:         credForm.newEmail  || undefined,
        newPassword:      credForm.newPassword || undefined,
      });
      setAdminUser(data.user); // refresh stored user (email may have changed)
      setCredMsg({ type: 'success', text: data.message });
      setCredForm({ currentPassword: '', newEmail: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setCredMsg({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    }
    setCredLoading(false);
  };

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [sRes, uRes, vRes, bRes, aRes] = await Promise.all([
        adminApi.get(`/admin/stats`),
        adminApi.get(`/admin/users`),
        adminApi.get(`/admin/venues`),
        adminApi.get(`/bookings`),
        adminApi.get(`/admin/analytics`),
      ]);
      setStats(sRes.data);
      setUsers(uRes.data);
      setVenues(vRes.data);
      setBookings(bRes.data);
      setAnalytics(aRes.data);
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      setError(`Sync Error: ${msg}. If this persists, please re-login.`);
      console.error(e);
    }
    setLoading(false);
  };

  const handleModerate = async (venueId, status) => {
    setModerating(venueId);
    try {
      const { data } = await adminApi.put(`/admin/venues/${venueId}/moderate`, { status });
      setVenues(prev => prev.map(v => v.id === venueId ? { ...v, status: data.status } : v));
    } catch (e) {
      alert('Moderation failed: ' + (e.response?.data?.message || e.message));
    }
    setModerating(null);
  };

  // Not logged in → show standalone login
  if (!adminUser) return <AdminLogin setAdminUser={setAdminUser} setAdminToken={setAdminToken} />;

  const filteredUsers  = users.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredVenues = venues.filter(v =>
    `${v.name} ${v.location} ${v.type}`.toLowerCase().includes(venueSearch.toLowerCase())
  );
  const pendingVenues  = venues.filter(v => v.status === 'Pending');

  const TABS = [
    { id: 'overview',  label: 'Overview',     icon: BarChart3  },
    { id: 'venues',    label: 'Venues',        icon: Building2  },
    { id: 'users',     label: 'Users',         icon: Users      },
    { id: 'bookings',  label: 'Bookings',      icon: BookOpen   },
    { id: 'settings',  label: 'My Account',    icon: Settings   },
  ];

  const imgSrc = (path) => path?.startsWith('/') ? `http://localhost:5000${path}` : path;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">

      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Connect" className="h-9 object-contain" />
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <h1 className="text-base font-black text-gray-900 dark:text-white leading-tight">Admin Console</h1>
              <p className="text-xs text-gray-400 dark:text-slate-400">Signed in as {adminUser.firstName} {adminUser.lastName} · {adminUser.email}</p>
            </div>

          </div>
          <div className="flex items-center gap-3">
            {pendingVenues.length > 0 && (
              <span className="flex items-center gap-1.5 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                {pendingVenues.length} Pending
              </span>
            )}
            <button onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={fetchAll} disabled={loading}
              className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-200 transition text-sm font-semibold">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>

        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-100 dark:border-slate-700 mb-8 shadow-sm w-fit">

          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === t.id ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.id === 'venues' && pendingVenues.length > 0 && (
                <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {pendingVenues.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW ══════════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="space-y-8">

            {/* ── KPI Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard icon={Users}      label="Total Users"    value={stats?.users}    color="text-indigo-500" sub={`${users.filter(u=>u.role==='owner').length} owners · ${users.filter(u=>u.role==='user').length} customers`} />
              <StatCard icon={Building2}  label="Active Venues"  value={stats?.venues}   color="text-violet-500" sub={`${venues.filter(v=>v.status==='Pending').length} pending approval`} />
              <StatCard icon={BookOpen}   label="Total Bookings" value={stats?.bookings} color="text-emerald-500" sub={`${bookings.filter(b=>b.status==='Confirmed').length} confirmed`} />
              <StatCard icon={TrendingUp} label="Total Revenue"  value={`LKR ${(stats?.revenue || 0).toLocaleString()}`} color="text-orange-500" sub="From confirmed bookings" />
            </div>

            {/* ── Row 1: Monthly Bookings Bar + Revenue Area ────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Monthly Bookings (Last 6 Months)">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics?.monthlyData || []} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                    <Bar dataKey="bookings" fill="#6366f1" radius={[6, 6, 0, 0]} name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Monthly Revenue Trend (LKR)">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={analytics?.monthlyData || []}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => [`LKR ${v.toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                    <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: '#f97316' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ── Row 2: Three Pie Charts ───────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ChartCard title="Booking Status Breakdown">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={analytics?.bookingStatusData?.filter(d=>d.value>0) || []} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {(analytics?.bookingStatusData || []).map((_, i) => <Cell key={i} fill={['#10b981','#ef4444','#a78bfa'][i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Venue Status Distribution">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={analytics?.venueStatusData?.filter(d=>d.value>0) || []} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {(analytics?.venueStatusData || []).map((_, i) => <Cell key={i} fill={['#10b981','#f59e0b','#ef4444'][i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="User Role Distribution">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={analytics?.userRoleData?.filter(d=>d.value>0) || []} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {(analytics?.userRoleData || []).map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ── Row 3: Top Venues + User Growth ──────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Top 5 Venues by Bookings">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics?.topVenuesData || []} layout="vertical" barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                    <Bar dataKey="bookings" radius={[0, 6, 6, 0]} name="Bookings">
                      {(analytics?.topVenuesData || []).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="New User Registrations (Last 6 Months)">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={analytics?.userGrowthData || []}>
                    <defs>
                      <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                    <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2.5} fill="url(#userGrad)" dot={{ r: 4, fill: '#6366f1' }} name="New Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ── Pending Approvals ─────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                  <Clock className="w-5 h-5 text-yellow-500" /> Pending Venue Approvals
                </h2>
                <span className="text-sm text-gray-400">{pendingVenues.length} awaiting review</span>
              </div>
              {pendingVenues.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                  <p className="font-semibold">All venues have been reviewed.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-slate-700">
                  {pendingVenues.map(v => (
                    <div key={v.id} className="p-5 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        {v.img ? <img src={imgSrc(v.img)} alt="" className="w-full h-full object-cover" />
                          : <Building2 className="w-6 h-6 text-gray-300 mx-auto mt-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 truncate">{v.name}</div>
                        <div className="text-xs text-gray-500">{v.type} · {v.location} · {v.price}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Owner: {v.User?.firstName} {v.User?.lastName} · {v.User?.email}
                        </div>
                        
                        {/* AI Trust Results */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 ${
                            (v.confidenceScore || 0) >= 80 ? 'bg-green-100 text-green-700' : 
                            (v.confidenceScore || 0) >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            <Activity className="w-3 h-3" />
                            Trust Score: {v.confidenceScore || 0}%
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Type: {v.docType || 'NIC'}
                          </span>
                          {v.verificationAnalysis && (
                            <span className="text-[10px] text-gray-500 italic bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 italic">
                              "{v.verificationAnalysis}"
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 self-start mt-1">
                        <button onClick={() => handleModerate(v.id, 'Approved')} disabled={moderating === v.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-black rounded-xl hover:bg-green-700 transition disabled:opacity-50 shadow-md shadow-green-200">
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        {v.verificationDoc && (
                           <a href={imgSrc(v.verificationDoc)} target="_blank" rel="noreferrer"
                              className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-black rounded-xl hover:bg-gray-200 transition flex items-center gap-1.5">
                             <Eye className="w-3.5 h-3.5" /> View Doc
                           </a>
                        )}
                        <button onClick={() => handleModerate(v.id, 'Rejected')} disabled={moderating === v.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-600 border border-red-200 text-xs font-black rounded-xl hover:bg-red-50 transition disabled:opacity-50">
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-orange-500" /> Recent Bookings
                </h2>
              </div>
              {bookings.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No bookings yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs font-black uppercase tracking-widest text-gray-400">
                      <tr>
                        {['Ref', 'Customer', 'Venue', 'Date', 'Amount', 'Status'].map(h => (
                          <th key={h} className="px-4 py-3 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bookings.slice(0, 10).map(b => (
                        <tr key={b.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-mono text-xs text-gray-400">{String(b.id).slice(-8).toUpperCase()}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{b.customerName || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{b.venueName || b.Venue?.name || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{b.date}</td>
                          <td className="px-4 py-3 font-bold text-gray-800">LKR {Number(b.totalAmount || b.totalPrice || 0).toLocaleString()}</td>
                          <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ VENUES ════════════════════════════════════════════════════════ */}
        {tab === 'venues' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={venueSearch} onChange={e => setVenueSearch(e.target.value)}
                  placeholder="Search by name, type, or location…"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <span className="text-sm text-gray-400 font-medium">{filteredVenues.length} venues</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {filteredVenues.length === 0
                ? <div className="p-12 text-center text-gray-500">No venues found.</div>
                : (
                  <div className="divide-y divide-gray-50">
                    {filteredVenues.map(v => (
                      <div key={v.id}>
                        <div className="p-5 flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                            {v.img ? <img src={imgSrc(v.img)} alt="" className="w-full h-full object-cover" />
                              : <Building2 className="w-6 h-6 text-gray-300 mx-auto mt-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-gray-900 truncate">{v.name}</span>
                              <StatusBadge status={v.status} />
                            </div>
                            <div className="text-xs text-gray-500">{v.type} · {v.location} · {v.price}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              Owner: {v.User?.firstName} {v.User?.lastName} · {v.User?.email}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {v.status === 'Pending' && (
                              <>
                                <button onClick={() => handleModerate(v.id, 'Approved')} disabled={moderating === v.id}
                                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-black rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Approve
                                </button>
                                <button onClick={() => handleModerate(v.id, 'Rejected')} disabled={moderating === v.id}
                                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-black rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> Reject
                                </button>
                              </>
                            )}
                            {v.status === 'Approved' && (
                              <button onClick={() => handleModerate(v.id, 'Rejected')} disabled={moderating === v.id}
                                className="px-3 py-1.5 border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition">
                                Revoke
                              </button>
                            )}
                            {v.status === 'Rejected' && (
                              <button onClick={() => handleModerate(v.id, 'Approved')} disabled={moderating === v.id}
                                className="px-3 py-1.5 border border-green-200 text-green-600 text-xs font-bold rounded-lg hover:bg-green-50 transition">
                                Re-Approve
                              </button>
                            )}
                            <button onClick={() => setVenueExpanded(venueExpanded === v.id ? null : v.id)}
                              className="p-2 rounded-lg border border-gray-100 text-gray-400 hover:bg-gray-50 transition">
                              {venueExpanded === v.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        {venueExpanded === v.id && (
                          <div className="px-5 pb-5 bg-gray-50 border-t border-gray-100 text-sm">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                              <div><div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Capacity</div><div className="font-bold text-gray-800">{v.capacity || 10} people</div></div>
                              <div><div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Rating</div><div className="font-bold text-gray-800">⭐ {v.rating || 0}</div></div>
                              <div><div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Views</div><div className="font-bold text-gray-800">{v.views || 0}</div></div>
                              <div><div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Facility</div><div className="font-bold text-gray-800">{v.facilityType || '—'}</div></div>
                            </div>
                            {v.description && <p className="mt-4 text-gray-500 leading-relaxed">{v.description}</p>}
                            {v.verificationDoc && (
                              <a href={imgSrc(v.verificationDoc)} target="_blank" rel="noreferrer"
                                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:underline">
                                <Eye className="w-3.5 h-3.5" /> View Verification Document
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* ══ USERS ═════════════════════════════════════════════════════════ */}
        {tab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <span className="text-sm text-gray-400 font-medium">{filteredUsers.length} users</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {filteredUsers.length === 0
                ? <div className="p-12 text-center text-gray-500">No users found.</div>
                : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs font-black uppercase tracking-widest text-gray-400">
                        <tr>
                          {['Name', 'Email', 'Role', 'Joined'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-black">
                                  {(u.firstName?.[0] || '?').toUpperCase()}
                                </div>
                                <span className="font-semibold text-gray-800">{u.firstName} {u.lastName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">{u.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                u.role === 'admin' ? 'bg-red-100 text-red-700' :
                                u.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                                'bg-blue-100 text-blue-700'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* ══ BOOKINGS ══════════════════════════════════════════════════════ */}
        {tab === 'bookings' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {bookings.length === 0
              ? <div className="p-12 text-center text-gray-500">No bookings yet.</div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs font-black uppercase tracking-widest text-gray-400">
                      <tr>
                        {['Ref', 'Customer', 'Venue', 'Date', 'Slots', 'Amount', 'Status'].map(h => (
                          <th key={h} className="px-4 py-3 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bookings.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-mono text-xs text-gray-400">{String(b.id).slice(-8).toUpperCase()}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{b.customerName || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{b.venueName || b.Venue?.name || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{b.date}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {Array.isArray(b.timeSlots) ? b.timeSlots.join(', ') : b.timeSlots || '—'}
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-800">
                            LKR {Number(b.totalAmount || b.totalPrice || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

        {/* ══ MY ACCOUNT / CREDENTIALS ══════════════════════════════════════ */}
        {tab === 'settings' && (
          <div className="max-w-xl">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden text-gray-900 dark:text-white">
              <div className="p-6 border-b border-gray-50 dark:border-slate-700">
                <h2 className="text-lg font-black flex items-center gap-2">
                  <Settings className="w-5 h-5 text-orange-500" /> Update Admin Credentials
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  Change your login email or password. Current password is always required.
                </p>
              </div>

              <form onSubmit={handleCredentialsSubmit} className="p-6 space-y-5">
                {/* Current account info banner */}
                <div className="bg-gray-50 dark:bg-slate-900 rounded-xl px-4 py-3 flex items-center gap-3 border border-gray-100 dark:border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm">
                    {(adminUser.firstName?.[0] || 'A').toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 dark:text-white text-sm">{adminUser.firstName} {adminUser.lastName}</div>
                    <div className="text-xs text-gray-400 dark:text-slate-500">{adminUser.email} · Administrator</div>
                  </div>
                </div>

                {credMsg && (
                  <div className={`p-3 rounded-xl text-sm flex items-start gap-2 ${
                    credMsg.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                  }`}>
                    {credMsg.type === 'success'
                      ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    {credMsg.text}
                  </div>
                )}

                {/* Current password — always required */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password" required value={credForm.currentPassword}
                      onChange={e => setCredForm(p => ({ ...p, currentPassword: e.target.value }))}
                      placeholder="Your current password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 text-sm transition"
                    />
                  </div>
                </div>

                {/* New email */}
                <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-3">Change Email (optional)</p>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email" value={credForm.newEmail}
                      onChange={e => setCredForm(p => ({ ...p, newEmail: e.target.value }))}
                      placeholder={`Current: ${adminUser.email}`}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 text-sm transition"
                    />
                  </div>
                </div>

                {/* New password */}
                <div className="border-t border-gray-100 dark:border-slate-700 pt-4 space-y-3">
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-widest font-bold">Change Password (optional)</p>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password" value={credForm.newPassword}
                      onChange={e => setCredForm(p => ({ ...p, newPassword: e.target.value }))}
                      placeholder="New password (min 8 characters)"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 text-sm transition"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password" value={credForm.confirmPassword}
                      onChange={e => setCredForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 text-sm transition"
                    />
                  </div>
                </div>

                <button type="submit" disabled={credLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg mt-2">
                  {credLoading
                    ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Updating…</>
                    : <><KeyRound className="w-4 h-4" /> Save Credentials</>
                  }
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

