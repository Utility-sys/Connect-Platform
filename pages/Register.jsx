import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useConnect } from '../context/ConnectContext';

function Register() {
  const navigate = useNavigate();
  const { registerUser } = useConnect();
  const [accountType, setAccountType] = useState('user');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = await registerUser({
      ...formData,
      role: accountType
    });
    
    if (user) {
      if (user.role === 'owner') navigate('/owner-dashboard');
      else navigate('/customer-dashboard');
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex bg-gray-50">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-[450px] animate-fade-in-up">
          <div>
            <h2 className="mt-6 text-3xl font-bold font-heading text-textPrimary">Create an account</h2>
            <p className="mt-2 text-sm text-textSecondary">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-accent hover:text-primary transition">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <div className="mt-6">
              
              <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                <button 
                  onClick={() => setAccountType('user')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition ${accountType === 'user' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-primary'}`}
                >
                  I want to book
                </button>
                <button 
                  onClick={() => setAccountType('owner')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition ${accountType === 'owner' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-primary'}`}
                >
                  I own a venue
                </button>
              </div>

              <form 
                onSubmit={handleSubmit} 
                className="space-y-5"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first-name" className="block text-sm font-medium text-textPrimary">
                      First name
                    </label>
                    <div className="mt-1">
                      <input
                        id="first-name"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="appearance-none block w-full px-4 py-3 border border-border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block text-sm font-medium text-textPrimary">
                      Last name
                    </label>
                    <div className="mt-1">
                      <input
                        id="last-name"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="appearance-none block w-full px-4 py-3 border border-border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-textPrimary">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="appearance-none block w-full px-4 py-3 border border-border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-textPrimary">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="appearance-none block w-full px-4 py-3 border border-border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-textSecondary">
                    I agree to the {' '}
                    <a href="#" className="font-medium text-accent hover:text-primary">
                      Terms of Service
                    </a>
                    {' '} and {' '}
                    <a href="#" className="font-medium text-accent hover:text-primary">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-accent hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition duration-300 mt-2"
                  >
                    Create account
                  </button>
                </div>
              </form>
              
            </div>
          </div>
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1 bg-gradient-to-br from-primary via-primary-light to-primary-lighter">
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-50 mix-blend-overlay grayscale"
          src="https://images.unsplash.com/photo-1518605368461-1ee7c58ed83e?auto=format&fit=crop&q=80"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent opacity-90"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm px-8">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 text-white">
            <h3 className="text-xl font-bold mb-4 text-accent flex items-center gap-2">
              <Check className="w-5 h-5" /> Why join Connect?
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-accent shrink-0" />
                <span className="text-sm">Instant bookings with verified availability in real-time</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-accent shrink-0" />
                <span className="text-sm">Exclusive discounts and promotional offers for members</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-accent shrink-0" />
                <span className="text-sm">Manage all your bookings and payments securely in one place</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-accent shrink-0" />
                <span className="text-sm">AI Assistant to recommend the perfect venue for your needs</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
