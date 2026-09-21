import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { redirectToApp } from '@taskmaster/shared-ui/appLinks';
import { useAuth } from '../context/AuthContext';
import useGoogleAuth from '../hooks/useGoogleAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, googleLogin, logout } = useAuth();
  const navigate = useNavigate();
  const { triggerGoogleLogin, isGoogleAvailable } = useGoogleAuth();

  // Clear localStorage if coming from logout
  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    if (params.get('logout') === 'true') {
      console.log('[Login] Logout flag detected, clearing localStorage');
      logout();
      // Clean up URL
      globalThis.history.replaceState({}, '', '/login');
    }
  }, [logout]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      console.log('[Login] Attempting login for:', email);
      const user = await login(email, password);
      console.log('[Login] Login successful:', user);
      
      // Check user role and redirect accordingly
      if (user.role === 'Admin') {
        console.log('[Login] Admin user detected, redirecting to admin dashboard');
        navigate('/admin');
      } else {
        console.log('[Login] Regular user detected, redirecting to task dashboard');
        redirectToApp('task');
      }
    } catch (err) {
      console.error('[Login] Login failed:', err);
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      console.log('[Login] Attempting Google login');
      const idToken = await triggerGoogleLogin();
      const user = await googleLogin(idToken);
      console.log('[Login] Google login successful:', user);
      
      // Check user role and redirect accordingly
      if (user.role === 'Admin') {
        console.log('[Login] Admin user detected, redirecting to admin dashboard');
        navigate('/admin');
      } else {
        console.log('[Login] Regular user detected, redirecting to task dashboard');
        redirectToApp('task');
      }
    } catch (err) {
      console.error('[Login] Google login failed:', err);
      setError(err.response?.data?.message || err.message || 'Google Sign-In failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="bg-[#0f172a] font-display min-h-screen flex flex-col overflow-x-hidden antialiased selection:bg-[#144bb8] selection:text-white">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#334155] px-10 py-4 bg-[#1e293b]/50 backdrop-blur-sm fixed w-full z-50">
        <div className="flex items-center gap-4 text-white">
          <div className="size-8 text-[#144bb8]">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z"></path>
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold leading-tight tracking-tight">TaskMaster</h2>
        </div>
        <div className="flex gap-3">
          <p className="text-slate-400 text-sm font-medium self-center hidden sm:block">New to TaskMaster?</p>
          <Link
            to="/register"
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-transparent border border-slate-600 hover:bg-slate-700 text-white text-sm font-bold leading-normal transition-colors"
          >
            <span className="truncate">Sign Up</span>
          </Link>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center pt-20 px-4">
        <div style={{ maxWidth: '440px', width: '100%' }} className="flex flex-col gap-6">
          <div className="bg-[#1e293b] rounded-xl shadow-lg border border-[#334155] p-8 w-full">
            <div className="text-center mb-8">
              <h1 className="text-white tracking-tight text-3xl font-bold leading-tight mb-2">Welcome Back</h1>
              <p className="text-slate-400 text-sm font-normal">Enter your credentials to access your workspace.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-slate-300 text-sm font-medium">Email Address</span>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '20px' }}>mail</span>
                  </div>
                  <input
                    style={{ paddingLeft: '44px', paddingRight: '16px', backgroundColor: '#111621' }}
                    className="w-full rounded-lg border border-slate-600 h-12 text-white text-sm placeholder:text-slate-400 focus:border-[#144bb8] focus:ring-1 focus:ring-[#144bb8] focus:outline-none transition-all"
                    placeholder="name@company.com"
                    type="email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </label>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="login-password" className="text-slate-300 text-sm font-medium">Password</label>
                  <Link to="#" className="text-[#144bb8] text-xs font-semibold hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '20px' }}>lock</span>
                  </div>
                  <input
                    id="login-password"
                    style={{ paddingLeft: '44px', paddingRight: '44px', backgroundColor: '#111621' }}
                    className="w-full rounded-lg border border-slate-600 h-12 text-white text-sm placeholder:text-slate-400 focus:border-[#144bb8] focus:ring-1 focus:ring-[#144bb8] focus:outline-none transition-all"
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                className="mt-2 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-4 bg-[#144bb8] hover:bg-[#113d96] text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1e293b] px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || !isGoogleAvailable}
              className="w-full flex items-center justify-center gap-3 bg-[#111621] hover:bg-slate-800 text-white border border-slate-600 rounded-lg h-11 px-4 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 4.66c1.61 0 3.1.56 4.28 1.68l3.29-3.29c-2-1.87-4.66-2.95-7.57-2.95-4.3 0-8.01 2.47-9.81 6.13l3.66 2.84c.87-2.6 3.3-4.53 6.15-4.53z" fill="#EA4335"></path>
              </svg>
              <span>{googleLoading ? 'Signing in...' : 'Log in with Google'}</span>
            </button>
          </div>

          <div className="text-center">
            <p className="text-slate-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#144bb8] hover:text-[#113d96] font-semibold transition-colors">Create an account</Link>
            </p>
            <div className="mt-8 flex justify-center gap-6 text-xs text-slate-400">
              <Link to="#" className="hover:text-slate-300">Privacy Policy</Link>
              <Link to="#" className="hover:text-slate-300">Terms of Service</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
