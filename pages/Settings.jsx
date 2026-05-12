import React, { useState } from 'react';
import { useConnect } from '../context/ConnectContext';
import { User as UserIcon, Lock, Trash2, Mail, CheckCircle, ShieldAlert, ShieldCheck, Smartphone, KeyRound, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { currentUser, updateProfile, updatePassword, deleteAccount, logoutUser, setup2FA, verify2FA } = useConnect();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile state
  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName]   = useState(currentUser?.lastName || '');
  const [profileMsg, setProfileMsg] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg]                 = useState('');
  const [passError, setPassError]             = useState('');

  // 2FA State
  const [twoFAStep, setTwoFAStep]     = useState('idle'); // 'idle' | 'scanning' | 'verifying' | 'done'
  const [qrCode, setQrCode]           = useState('');
  const [secret2FA, setSecret2FA]     = useState('');
  const [totpInput, setTotpInput]     = useState('');
  const [twoFAMsg, setTwoFAMsg]       = useState('');
  const [twoFAError, setTwoFAError]   = useState('');
  const [copied, setCopied]           = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);

  if (!currentUser) return <div className="p-10 text-center">Please log in to access settings.</div>;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    const res = await updateProfile({ firstName, lastName });
    if (res) setProfileMsg('Profile updated successfully!');
    else setProfileMsg('Failed to update profile.');
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPassMsg(''); setPassError('');
    if (newPassword !== confirmPassword) return setPassError("New passwords don't match.");
    const success = await updatePassword({ currentPassword, newPassword });
    if (success) {
      setPassMsg('Password successfully changed.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } else {
      setPassError('Failed to change password. Check your current password.');
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm("Are you absolutely sure? This action cannot be reversed.");
    if (confirm) {
      const success = await deleteAccount();
      if (success) navigate('/');
    }
  };

  const handleSetup2FA = async () => {
    setTwoFALoading(true);
    setTwoFAError('');
    const result = await setup2FA();
    setTwoFALoading(false);
    if (result) {
      setQrCode(result.qrCode);
      setSecret2FA(result.secret);
      setTwoFAStep('scanning');
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setTwoFALoading(true);
    setTwoFAError('');
    const result = await verify2FA(totpInput);
    setTwoFALoading(false);
    if (result) {
      setTwoFAMsg('Two-Factor Authentication is now enabled!');
      setTwoFAStep('done');
    } else {
      setTwoFAError('Invalid code. Please check your authenticator app and try again.');
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret2FA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navBtn = (tab, Icon, label, danger = false) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition ${
        activeTab === tab
          ? danger ? 'bg-red-500 text-white shadow-md' : 'bg-primary text-white shadow-md'
          : danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-textSecondary hover:bg-gray-200 dark:hover:bg-slate-800 dark:text-slate-400'
      }`}
    >
      <Icon className="w-5 h-5" /> {label}
    </button>
  );

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen py-10 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">

        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2">
          <h2 className="text-2xl font-black text-textPrimary dark:text-white mb-6">Settings</h2>
          {navBtn('profile', UserIcon, 'Profile Details')}
          {navBtn('security', Lock, 'Security & Password')}
          {navBtn('2fa', ShieldCheck, 'Two-Factor Auth')}
          {navBtn('danger', ShieldAlert, 'Danger Zone', true)}

          <div className="pt-6 mt-6 border-t border-gray-100 dark:border-slate-800">
            <button
              onClick={() => { logoutUser(); navigate('/'); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition"
            >
              <Lock className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-slate-700">

          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <div className="animate-fade-in">
              <h3 className="text-xl font-black text-textPrimary dark:text-white mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">Personal Information</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-md">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-500 flex items-center gap-2"><Mail className="w-4 h-4"/> Account Email</label>
                  <input type="email" disabled value={currentUser.email} className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-900 text-gray-500 rounded-xl cursor-not-allowed" />
                  <p className="text-xs text-gray-400">Email addresses cannot be changed directly.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-textPrimary dark:text-gray-300">First Name</label>
                    <input required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white focus:border-accent outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-textPrimary dark:text-gray-300">Last Name</label>
                    <input required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white focus:border-accent outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-1 group">
                    <label className="text-sm font-bold text-gray-400 group-hover:text-primary transition-colors">Account Type</label>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center">
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full ${currentUser.role === 'owner' ? 'bg-orange-500 text-white' : 'bg-primary text-white'}`}>
                        {currentUser.role === 'owner' ? 'Venue Owner' : 'Customer'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-500">Member Since</label>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 text-sm font-medium text-textSecondary dark:text-slate-400">
                      {new Date(currentUser.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {profileMsg && <p className="text-sm text-green-500 font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4"/>{profileMsg}</p>}
                <button type="submit" className="mt-6 px-6 py-3 bg-primary text-white font-black rounded-xl hover:bg-opacity-90 transition">Save Changes</button>
              </form>
            </div>
          )}

          {/* ── Security Tab ── */}
          {activeTab === 'security' && (
            <div className="animate-fade-in">
              <h3 className="text-xl font-black text-textPrimary dark:text-white mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">Security Settings</h3>
              <form onSubmit={handleUpdatePassword} className="space-y-5 max-w-md">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-textPrimary dark:text-gray-300">Current Password</label>
                  <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white focus:border-accent outline-none" />
                </div>
                <div className="pt-4 space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-textPrimary dark:text-gray-300">New Password</label>
                    <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white focus:border-accent outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-textPrimary dark:text-gray-300">Confirm New Password</label>
                    <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white focus:border-accent outline-none" />
                  </div>
                </div>
                {passMsg && <p className="text-sm text-green-500 font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4"/>{passMsg}</p>}
                {passError && <p className="text-sm text-red-500 font-bold">{passError}</p>}
                <button type="submit" className="mt-6 px-6 py-3 bg-primary text-white font-black rounded-xl hover:bg-opacity-90 transition">Update Password</button>
              </form>
            </div>
          )}

          {/* ── 2FA Tab ── */}
          {activeTab === '2fa' && (
            <div className="animate-fade-in">
              <h3 className="text-xl font-black text-textPrimary dark:text-white mb-2 border-b border-gray-100 dark:border-slate-700 pb-4 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-green-500" /> Two-Factor Authentication
              </h3>
              <p className="text-sm text-textSecondary dark:text-slate-400 mb-8">
                Add an extra layer of security to your account. Once enabled, you'll need to enter a 6-digit code from your authenticator app every time you log in.
              </p>

              {/* Already Enabled */}
              {(currentUser.isTwoFactorEnabled || twoFAStep === 'done') && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-green-700 dark:text-green-400 text-lg">2FA is Active</h4>
                    <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                      {twoFAMsg || 'Your account is protected with Google Authenticator. Every login will require a verification code.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Not Enabled — Idle */}
              {!currentUser.isTwoFactorEnabled && twoFAStep === 'idle' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { icon: Smartphone, title: 'Install App', desc: 'Download Google Authenticator or Authy on your phone.' },
                      { icon: KeyRound,   title: 'Scan QR Code', desc: 'Use the app to scan the QR code we generate for you.' },
                      { icon: ShieldCheck, title: 'Enter Code',  desc: 'Confirm with a 6-digit code to activate 2FA.' },
                    ].map(({ icon: Icon, title, desc }) => (
                      <div key={title} className="bg-gray-50 dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 text-center">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <p className="font-black text-textPrimary dark:text-white text-sm mb-1">{title}</p>
                        <p className="text-xs text-textSecondary dark:text-slate-400">{desc}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSetup2FA}
                    disabled={twoFALoading}
                    className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-2xl hover:opacity-90 transition shadow-lg shadow-green-500/30 disabled:opacity-60"
                  >
                    {twoFALoading ? (
                      <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating...</>
                    ) : (
                      <><ShieldCheck className="w-5 h-5" /> Set Up Two-Factor Authentication</>
                    )}
                  </button>
                </div>
              )}

              {/* Step: Scanning QR Code */}
              {twoFAStep === 'scanning' && (
                <div className="space-y-6 max-w-sm">
                  <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
                    <p className="text-sm font-bold text-textPrimary dark:text-white mb-4 text-center">
                      Step 1: Scan this QR Code with Google Authenticator
                    </p>
                    {qrCode && (
                      <div className="flex justify-center">
                        <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 rounded-xl border-4 border-white shadow-lg" />
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl p-4 border border-gray-200 dark:border-slate-700">
                    <p className="text-xs text-gray-500 mb-2 font-bold">Can't scan? Enter this code manually:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 break-all text-textPrimary dark:text-white">
                        {secret2FA}
                      </code>
                      <button onClick={handleCopySecret} className="flex-shrink-0 p-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setTwoFAStep('verifying')}
                    className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-opacity-90 transition"
                  >
                    I've Scanned the Code → Enter Verification Code
                  </button>
                </div>
              )}

              {/* Step: Verifying TOTP */}
              {twoFAStep === 'verifying' && (
                <form onSubmit={handleVerify2FA} className="space-y-6 max-w-sm">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-sm text-blue-700 dark:text-blue-300">
                    Open <strong>Google Authenticator</strong> on your phone and enter the 6-digit code for <strong>Connect Platform</strong>.
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-black text-textPrimary dark:text-white">Verification Code</label>
                    <input
                      type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                      value={totpInput} onChange={e => setTotpInput(e.target.value)}
                      placeholder="000000" required
                      className="w-full text-center text-4xl font-mono tracking-[0.4em] py-5 px-4 border-2 border-gray-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-700 text-textPrimary dark:text-white focus:border-primary outline-none transition"
                    />
                  </div>

                  {twoFAError && <p className="text-sm text-red-500 font-bold">{twoFAError}</p>}

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setTwoFAStep('scanning')} className="flex-1 py-3 border-2 border-gray-200 dark:border-slate-600 text-textPrimary dark:text-white font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                      ← Back
                    </button>
                    <button type="submit" disabled={twoFALoading || totpInput.length < 6} className="flex-1 py-3 bg-green-500 text-white font-black rounded-xl hover:bg-green-600 transition disabled:opacity-50">
                      {twoFALoading ? 'Verifying...' : 'Activate 2FA'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── Danger Tab ── */}
          {activeTab === 'danger' && (
            <div className="animate-fade-in">
              <h3 className="text-xl font-black text-red-500 mb-6 border-b border-red-100 dark:border-red-900/30 pb-4">Danger Zone</h3>
              <p className="text-textSecondary dark:text-slate-400 mb-6 w-3/4">
                Once you delete your account, there is no going back. All of your bookings, venues, and reviews will be permanently wiped from our servers immediately. Please be certain.
              </p>
              <button onClick={handleDelete} className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition shadow-lg shadow-red-500/30">
                <Trash2 className="w-5 h-5" /> Delete My Account Permanently
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
