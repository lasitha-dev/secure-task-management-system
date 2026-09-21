import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { redirectToApp } from '@taskmaster/shared-ui/appLinks';
import { useAuth } from '../context/AuthContext';
import useGoogleAuth from '../hooks/useGoogleAuth';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, googleLogin } = useAuth();
  const { triggerGoogleLogin, isGoogleAvailable } = useGoogleAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service');
      return;
    }

    setLoading(true);
    try {
      const user = await register(name, email, password);
      
      // Check user role and redirect accordingly (new users are typically regular users)
      if (user.role === 'Admin') {
        redirectToApp('user', '/admin', { includeToken: false });
      } else {
        redirectToApp('task');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const idToken = await triggerGoogleLogin();
      const user = await googleLogin(idToken);
      
      // Check user role and redirect accordingly
      if (user.role === 'Admin') {
        redirectToApp('user', '/admin', { includeToken: false });
      } else {
        redirectToApp('task');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Google Sign-Up failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="bg-[#111621] font-display text-slate-100 min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#2d3748] bg-[#111621]/95 backdrop-blur supports-[backdrop-filter]:bg-[#111621]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-lg bg-[#144bb8] text-white">
                <span className="material-symbols-outlined">task_alt</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-white">TaskMaster</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a className="text-sm font-medium text-slate-400 hover:text-[#144bb8] transition-colors" href="#">Product</a>
              <a className="text-sm font-medium text-slate-400 hover:text-[#144bb8] transition-colors" href="#">Solutions</a>
              <a className="text-sm font-medium text-slate-400 hover:text-[#144bb8] transition-colors" href="#">Pricing</a>
            </nav>
            <div className="flex items-center gap-4">
              <Link className="text-sm font-medium text-slate-200 hover:text-[#144bb8] transition-colors" to="/login">Log In</Link>
              <Link className="rounded-lg bg-[#144bb8] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0f3a91] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#144bb8] transition-all" to="/register">Get Started</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left Side: Form */}
          <div className="flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-4xl font-black tracking-tight text-white mb-2">Create your account</h1>
              <p className="text-lg text-slate-400">Join thousands of teams managing their tasks efficiently with TaskMaster.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium leading-6 text-slate-200" htmlFor="name">Full Name</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">person</span>
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="block w-full rounded-lg border-0 py-3 pl-10 text-white shadow-sm ring-1 ring-inset ring-[#2d3748] placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-[#144bb8] bg-[#1c2230] sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="block text-sm font-medium leading-6 text-slate-200" htmlFor="email">Email Address</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">mail</span>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com"
                    required
                    className="block w-full rounded-lg border-0 py-3 pl-10 text-white shadow-sm ring-1 ring-inset ring-[#2d3748] placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-[#144bb8] bg-[#1c2230] sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              {/* Password + Confirm Password Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium leading-6 text-slate-200" htmlFor="password">Password</label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="material-symbols-outlined text-slate-400 text-[20px]">lock</span>
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="block w-full rounded-lg border-0 py-3 pl-10 text-white shadow-sm ring-1 ring-inset ring-[#2d3748] placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-[#144bb8] bg-[#1c2230] sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium leading-6 text-slate-200" htmlFor="confirm-password">Confirm Password</label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="material-symbols-outlined text-slate-400 text-[20px]">lock_reset</span>
                    </div>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="block w-full rounded-lg border-0 py-3 pl-10 text-white shadow-sm ring-1 ring-inset ring-[#2d3748] placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-[#144bb8] bg-[#1c2230] sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start">
                <div className="flex h-6 items-center">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="h-4 w-4 rounded border-[#2d3748] text-[#144bb8] focus:ring-[#144bb8] bg-[#1c2230] ring-offset-[#111621]"
                  />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <label className="font-medium text-slate-300">I agree to the <a className="font-semibold text-[#144bb8] hover:text-[#0f3a91]" href="#">Terms of Service</a> and <a className="font-semibold text-[#144bb8] hover:text-[#0f3a91]" href="#">Privacy Policy</a>.</label>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-lg bg-[#144bb8] px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-[#0f3a91] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#144bb8] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>

              {/* Divider */}
              <div className="relative mt-8">
                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2d3748]"></div>
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6">
                  <span className="bg-[#111621] px-6 text-slate-400">Or continue with</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <a className="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-[#2d3748] bg-[#1c2230] hover:bg-slate-800" href="#">
                  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M12.0003 20.45C16.667 20.45 20.5836 17.2834 20.5836 12.5C20.5836 7.71668 16.667 4.55002 12.0003 4.55002C7.33366 4.55002 3.41699 7.71668 3.41699 12.5C3.41699 17.2834 7.33366 20.45 12.0003 20.45Z" fill="white" fillOpacity="0.01"></path>
                    <path clipRule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM13.085 13.915H11.53V9.895H13.085V13.915ZM12.305 8.785C11.815 8.785 11.425 8.395 11.425 7.905C11.425 7.415 11.815 7.025 12.305 7.025C12.795 7.025 13.185 7.415 13.185 7.905C13.185 8.395 12.795 8.785 12.305 8.785Z" fill="currentColor" fillRule="evenodd"></path>
                  </svg>
                  <span className="text-sm font-semibold leading-6">SAML SSO</span>
                </a>
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={googleLoading || !isGoogleAvailable}
                  className="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-[#2d3748] bg-[#1c2230] hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm font-semibold leading-6">{googleLoading ? 'Connecting...' : 'Google'}</span>
                </button>
              </div>

              {/* Sign In Link */}
              <p className="mt-10 text-center text-sm text-slate-400">Already have an account? <Link className="font-semibold leading-6 text-[#144bb8] hover:text-[#0f3a91]" to="/login">Sign in</Link></p>
            </form>
          </div>

          {/* Right Side: Testimonial Panel */}
          <div className="hidden lg:flex relative h-full min-h-[600px] w-full flex-col justify-between overflow-hidden rounded-2xl bg-[#1c2230] p-8 shadow-2xl ring-1 ring-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-[#144bb8]/30 via-[#111621] to-[#111621] z-0"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=2832&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay z-0"></div>

            {/* Floating Card 1: Task Completed */}
            <div className="relative z-10 self-end max-w-xs transform translate-y-4 translate-x-4">
              <div className="rounded-xl bg-[#1c2230]/90 p-4 shadow-lg backdrop-blur ring-1 ring-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-8 rounded-full bg-[#144bb8]/20 flex items-center justify-center text-[#144bb8]">
                    <span className="material-symbols-outlined text-sm">check</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Task Completed</p>
                    <p className="text-sm font-semibold text-white">Q3 Roadmap Finalization</p>
                  </div>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-1.5 mb-1">
                  <div className="bg-[#144bb8] h-1.5 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>

            {/* Testimonial Quote */}
            <div className="relative z-10 my-auto p-4">
              <blockquote className="text-xl font-medium leading-relaxed text-slate-200">&ldquo;TaskMaster has transformed how our engineering team collaborates. The microservices architecture ensures we never experience downtime during critical sprints.&rdquo;</blockquote>
              <div className="mt-6 flex items-center gap-4">
                <div className="size-10 rounded-full bg-slate-700 overflow-hidden">
                  <img alt="Sarah Chen" className="h-full w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDE6BIslYcTWiGLvA6WQ7Fitpb-0THpyY5KCV5QWTZUpptrUSy8Z9fHdkUbbDixVm-T3szN4x0BzlfTSVrW3XGlUnewmHjJE1Gp8oi-SV6xAdOY9PeqbBFHJmX7WplQme_tLkst7ZtVR_PNRFkOQnARBZQqVATBQvyRJxWxGMP1JhnQFsYfkMlqDx_C2KPJ-oHYz1d9OxMoyU137veRQeRLamPHeWYqbvUk_FPApVopuSkJVov1ty8Xpb9TsqK787Hy5u8uXDqGT5g" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Sarah Chen</div>
                  <div className="text-xs text-slate-400">CTO at TechFlow</div>
                </div>
              </div>
            </div>

            {/* Floating Card 2: Team Velocity */}
            <div className="relative z-10 self-start max-w-xs transform -translate-y-4 -translate-x-4">
              <div className="rounded-xl bg-[#1c2230]/90 p-4 shadow-lg backdrop-blur ring-1 ring-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400">Team Velocity</p>
                  <span className="text-xs font-bold text-green-400">+24%</span>
                </div>
                <div className="flex items-end gap-1 h-12">
                  <div className="w-2 bg-slate-700 rounded-t h-6"></div>
                  <div className="w-2 bg-slate-700 rounded-t h-8"></div>
                  <div className="w-2 bg-slate-700 rounded-t h-5"></div>
                  <div className="w-2 bg-[#144bb8]/60 rounded-t h-10"></div>
                  <div className="w-2 bg-[#144bb8] rounded-t h-12"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-[#2d3748] bg-[#111621]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400">&copy; 2024 TaskMaster Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a className="text-sm text-slate-400 hover:text-white" href="#">Privacy</a>
            <a className="text-sm text-slate-400 hover:text-white" href="#">Terms</a>
            <a className="text-sm text-slate-400 hover:text-white" href="#">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
