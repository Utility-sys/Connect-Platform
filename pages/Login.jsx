import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Lock, Mail, Loader2, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  // On submit, call login() from context. Navigate to/on success.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 font-montserrat overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-accent opacity-10 blur-[100px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-success opacity-5 blur-[100px] rounded-full animate-pulse delay-700"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="glass rounded-3xl p-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6">
            <ShieldCheck className="w-12 h-12 text-accent opacity-20" />
          </div>

          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
              Connect<span className="text-accent underline decoration-4 underline-offset-4">Admin</span>
            </h1>
            <p className="text-gray-400 font-medium">Platform Management Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-500 group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-300"
                  placeholder="admin@connect.lk"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Secret Key</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500 group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-300"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger text-sm py-4 px-4 rounded-2xl animate-in shake duration-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-bold py-5 rounded-2xl transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                'Secure Authentication'
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-xs text-gray-500 font-medium tracking-tight">
            Restricted System. Unauthorized access is strictly prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
