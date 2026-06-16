import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiMail, FiLock, FiArrowRight, FiEdit3 } from 'react-icons/fi';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect already-authenticated users to dashboard
  if (isAuthenticated) return <Navigate to="/" replace />;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please fill in all fields');
    }

    try {
      setLoading(true);
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Invalid email or password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 px-4 py-12 relative overflow-hidden">
      {/* Decorative gradient glow spots */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Logo header */}
        <div className="text-center mb-8">
          <div className="inline-flex gradient-primary p-3 rounded-2xl text-white shadow-xl shadow-primary-500/20 mb-3 animate-float">
            <FiEdit3 className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Doc<span className="text-primary-400">Sign</span>
          </h2>
          <p className="text-sm text-surface-400 mt-2">
            Secure, legally-binding electronic signature platform
          </p>
        </div>

        {/* Card Form */}
        <div className="glass-card p-8 shadow-2xl relative">
          <div className="absolute top-0 inset-x-0 h-1 gradient-primary rounded-t-2xl"></div>

          <h3 className="text-xl font-bold text-white mb-6">Sign In</h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label" htmlFor="email">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-500">
                  <FiMail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label" htmlFor="password">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-500">
                  <FiLock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-2"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <FiArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Redirect link */}
          <div className="text-center mt-6 pt-6 border-t border-surface-800">
            <p className="text-sm text-surface-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-primary-400 hover:text-primary-300 font-semibold hover:underline"
              >
                Sign up free
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 glass-light rounded-xl p-4 border border-surface-800 text-center">
          <p className="text-xs text-surface-400">
            💡 <span className="font-semibold text-surface-300">Quick Test:</span> Register any email to begin signing immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
