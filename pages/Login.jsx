import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConnect } from '../context/ConnectContext';
import { platformApi } from '../utils/api';
import { X } from 'lucide-react';

function Login() {
  const navigate = useNavigate();
  const { loginUser, currentUser, token } = useConnect();
  const [formData, setFormData] = useState({ email: '', password: '', totpToken: '' });
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);

  // ── Forgot Password State ──
  const [isForgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotData, setForgotData] = useState({ email: '', otp: '', newPassword: '' });
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── Auto-redirect if already logged in ─────────────────────────────────────
  useEffect(() => {
    if (token && currentUser?.id) {
      navigate('/', { replace: true });
    }
  }, [token, currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await loginUser(formData.email, formData.password, formData.totpToken || null);

      if (!result) {
        setError('Invalid email or password. Please try again.');
        return;
      }
      if (result.requires2FA) {
        setRequires2FA(true);
        return;
      }
      if (result.error) {
        setError(result.message);
        return;
      }
      // Successful login — result is the user object
      navigate('/');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setForgotError(''); setForgotSuccess(''); setIsLoading(true);
    try {
      const { data } = await platformApi.post('/auth/forgot-password', { email: forgotData.email });
      setForgotSuccess(data.message);
      setForgotStep(2);
    } catch(err) {
      setForgotError(err.response?.data?.message || 'Failed to send OTP. Please check the email.');
    }
    setIsLoading(false);
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    setForgotError(''); setForgotSuccess(''); setIsLoading(true);
    try {
      const { data } = await platformApi.post('/auth/reset-password', forgotData);
      setForgotSuccess(data.message);
      setTimeout(() => {
        setForgotModalOpen(false);
        setForgotStep(1);
        setForgotData({ email: '', otp: '', newPassword: '' });
        setForgotSuccess('');
      }, 2500);
    } catch(err) {
      setForgotError(err.response?.data?.message || 'Invalid OTP or failed to reset.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex bg-gray-50 dark:bg-slate-900">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96 animate-fade-in-up">
          <div>
            <h2 className="mt-6 text-3xl font-bold font-heading text-textPrimary dark:text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-textSecondary">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-accent hover:text-primary transition">
                Sign up for free
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <div className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-error/10 border border-error/20 text-error text-sm p-3 rounded-lg font-medium">
                    {error}
                  </div>
                )}
                {!requires2FA ? (
                  <>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-textPrimary dark:text-slate-300">
                        Email address
                      </label>
                      <div className="mt-1">
                        <input
                          id="email" name="email" type="email" autoComplete="email" required
                          value={formData.email} onChange={handleChange}
                          placeholder="you@example.com"
                          className="appearance-none block w-full px-4 py-3 border border-border dark:border-slate-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="password" className="block text-sm font-medium text-textPrimary dark:text-slate-300">
                          Password
                        </label>
                        <div className="text-sm">
                          <button 
                            type="button"
                            onClick={() => { setForgotModalOpen(true); setForgotStep(1); setForgotError(''); setForgotSuccess(''); }}
                            className="font-medium text-accent hover:text-primary transition"
                          >
                            Forgot your password?
                          </button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <input
                          id="password" name="password" type="password" autoComplete="current-password" required
                          value={formData.password} onChange={handleChange}
                          placeholder="••••••••"
                          className="appearance-none block w-full px-4 py-3 border border-border dark:border-slate-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label htmlFor="totpToken" className="block text-sm font-medium text-textPrimary dark:text-slate-300">
                      Authenticator Code (2FA)
                    </label>
                    <div className="mt-1">
                      <input
                        id="totpToken" name="totpToken" type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" required
                        value={formData.totpToken} onChange={handleChange}
                        placeholder="123456"
                        className="appearance-none block w-full px-4 py-3 border border-border dark:border-slate-700 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center tracking-widest text-lg font-mono"
                      />
                    </div>
                    <p className="mt-2 text-xs text-textSecondary text-center">Open Google Authenticator to view your code.</p>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-accent hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition duration-300"
                  >
                    {requires2FA ? 'Verify Code' : 'Sign in'}
                  </button>
                </div>
              </form>
              
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div>
                    <a
                      href="#"
                      className="w-full inline-flex justify-center py-3 px-4 border border-border dark:border-slate-700 rounded-lg shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-textPrimary dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                      </svg>
                    </a>
                  </div>

                  <div>
                    <a
                      href="#"
                      className="w-full inline-flex justify-center py-3 px-4 border border-border dark:border-slate-700 rounded-lg shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-textPrimary dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.836c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1 bg-primary">
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-overlay"
          src="https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&q=80"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent opacity-90"></div>
        
        {/* Connect Logo with Motion Blend */}
        <div className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '2s' }}></div>
            <img 
              src="/logo.png" 
              alt="Connect Logo" 
              className="relative w-full max-w-[22rem] opacity-90 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-pulse"
              style={{ animationDuration: '2s' }}
            />
          </div>
        </div>

        <div className="absolute bottom-12 left-12 right-12 text-white">
          <blockquote className="text-2xl font-bold mb-4">"Connect has completely revolutionized how we manage our sports facility. Bookings are up 40% since we joined."</blockquote>
          <p className="text-accent font-medium">David Silva</p>
          <p className="text-gray-300 text-sm">Owner, Coliseum Futsal Arena</p>
        </div>
      </div>

      {/* ── Forgot Password Modal ── */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-slate-800">
              <h3 className="font-black text-lg dark:text-white">Reset Password</h3>
              <button onClick={() => setForgotModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {forgotError && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">{forgotError}</div>}
              {forgotSuccess && <div className="mb-4 bg-green-50 text-green-600 p-3 rounded-xl text-sm font-medium">{forgotSuccess}</div>}
              
              {forgotStep === 1 ? (
                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <p className="text-sm text-slate-500 mb-4">Enter your registered email address. We'll send a 6-digit OTP to verify your identity.</p>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={forgotData.email}
                      onChange={e => setForgotData({...forgotData, email: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white"
                      placeholder="you@example.com"
                    />
                  </div>
                  <button disabled={isLoading} type="submit" className="w-full btn-primary py-3 rounded-xl">
                    {isLoading ? 'Sending...' : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotReset} className="space-y-4">
                  <p className="text-sm text-slate-500 mb-4">Enter the OTP sent to <b>{forgotData.email}</b> and your new password.</p>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">6-Digit OTP</label>
                    <input 
                      type="text" 
                      required
                      maxLength="6"
                      value={forgotData.otp}
                      onChange={e => setForgotData({...forgotData, otp: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white text-center tracking-[0.5em] font-mono text-xl"
                      placeholder="------"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                    <input 
                      type="password" 
                      required
                      value={forgotData.newPassword}
                      onChange={e => setForgotData({...forgotData, newPassword: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                  <button disabled={isLoading} type="submit" className="w-full bg-accent hover:bg-opacity-90 text-white font-bold py-3 rounded-xl transition">
                    {isLoading ? 'Resetting...' : 'Securely Reset Password'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Login;
