
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { mockBackend } from '../services/mockBackend';
import { apiLogin, apiRegister, apiVerifyOtp, isBackendAvailable } from '../services/apiService';
import { getToken } from '../services/apiService';
import Logo from './Logo';

interface Props {
  onLogin: (user: User) => void;
}

const AuthFlow: React.FC<Props> = ({ onLogin }) => {
  const [step, setStep] = useState<'splash' | 'role' | 'login' | 'otp'>('splash');
  const [otp, setOtp] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<UserRole>(UserRole.VISITOR);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(localStorage.getItem('artforge_saved_email') || 'dupaguntlarajamahanthprasad@gmail.com');
  const [password, setPassword] = useState(localStorage.getItem('artforge_saved_password') || 'password123'); // Preset password for convenience
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-decrement resend timer
  React.useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const startResendTimer = () => setResendTimer(60);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep('login');
    setError('');
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Display name is required for registration');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const backendUp = await isBackendAvailable();

      let user: User;
      if (backendUp) {
        // Real Spring Boot auth
        if (mode === 'signup') {
          user = await apiRegister(name, email, password, role);
        } else {
          user = await apiLogin(email, password);
        }

        if (getToken() === "") {
            setStep('otp');
            setIsLoading(false);
            startResendTimer();
            return;
        }

      } else {
        // Mock fallback
        await new Promise(r => setTimeout(r, 500));
        user = mockBackend.login(name, role);
      }

      if (getToken() === "") {
        setStep('otp');
        setIsLoading(false);
        startResendTimer();
        return;
      }

      // Save credentials for convenience
      if (rememberMe) {
        localStorage.setItem('artforge_saved_email', email);
        localStorage.setItem('artforge_saved_password', password);
      } else {
        localStorage.removeItem('artforge_saved_email');
        localStorage.removeItem('artforge_saved_password');
      }

      onLogin(user);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setIsLoading(true);
    setError('');
    try {
      const user = await apiVerifyOtp(email, otp);
      setIsSuccess(true);
      setTimeout(() => onLogin(user), 2500); // Wait for success animation
    } catch (err: any) {
      setError(err.message ?? 'Invalid OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        await apiRegister(name, email, password, role);
      } else {
        await apiLogin(email, password);
      }
      startResendTimer();
    } catch (err: any) {
      setError(err.message ?? 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { r: UserRole.VISITOR,  label: 'Collector',      desc: 'Browse and acquire masterpieces from world-class artists.',  emoji: '🎨', color: 'from-amber-500/20 to-amber-500/5',  border: 'border-amber-500/30',  accent: 'text-amber-400'  },
    { r: UserRole.ARTIST,   label: 'Artist',         desc: 'Exhibit your vision to discerning collectors worldwide.',      emoji: '✍️',  color: 'from-blue-500/20 to-blue-500/5',   border: 'border-blue-500/30',   accent: 'text-blue-400'   },
    { r: UserRole.CURATOR,  label: 'Curator',        desc: 'Organize exhibitions and guide the gallery narrative.',         emoji: '🏛️', color: 'from-purple-500/20 to-purple-500/5',border: 'border-purple-500/30', accent: 'text-purple-400' },
    { r: UserRole.ADMIN,    label: 'Administrator',  desc: 'Oversee platform activities, users, and settings.',            emoji: '⚙️', color: 'from-green-500/20 to-green-500/5', border: 'border-green-500/30',  accent: 'text-green-400'  },
  ];

  const selectedRoleInfo = roles.find(r => r.r === role);

  // ── Success State ───────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#050505] flex items-center justify-center animate-fadeIn">
        <div className="text-center space-y-8 max-w-sm px-6">
          <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-amber-500/30 scale-up-center">
            <svg className="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-serif text-white italic font-bold">Access Granted</h2>
            <p className="text-zinc-500 text-sm leading-relaxed font-light">
              Welcome to the sanctuary, <span className="text-white font-bold">{name || email.split('@')[0]}</span>. 
              Your profile has been secured in the vault.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 bg-amber-500/40 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Splash ───────────────────────────────────────────────────────────────────
  if (step === 'splash') {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover opacity-25 scale-105" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/80" />
        </div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl animate-orb pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/6 rounded-full blur-3xl animate-orb pointer-events-none" style={{ animationDelay: '9s' }} />

        <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 animate-fadeIn">
          <div className="mb-6 sm:mb-8 scale-90 sm:scale-100"><Logo size="xl" showTagline={true} /></div>
          <p className="text-zinc-400 text-base sm:text-lg font-light max-w-md mb-8 sm:mb-12 leading-relaxed animate-fadeIn delay-200 px-4">
            The world's most evocative digital art sanctuary. Where collectors meet creators.
          </p>
          <div className="flex gap-6 sm:gap-12 mb-10 sm:mb-14 animate-fadeIn delay-300">
            {[['500+', 'Artworks'], ['120+', 'Artists'], ['24', 'Countries']].map(([n, l]) => (
              <div key={l} className="text-center">
                <p className="text-2xl sm:text-3xl font-serif font-bold text-white">{n}</p>
                <p className="text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-widest mt-1 font-semibold">{l}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setStep('role')}
            className="group btn-shine bg-white text-black px-10 sm:px-14 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base hover:bg-amber-400 transition-all shadow-[0_20px_60px_rgba(255,255,255,0.1)] flex items-center gap-4 animate-fadeIn delay-500">
            Enter the Sanctuary
            <svg className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
          <p className="text-zinc-600 text-[10px] mt-8 animate-fadeIn delay-700">No real account needed in demo mode</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[45%] h-full relative flex-col justify-between p-16 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1500" className="absolute inset-0 w-full h-full object-cover opacity-40" alt="" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/30 via-transparent to-[#050505]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        <div className="relative z-10"><Logo size="md" showTagline={false} /></div>
        <div className="relative z-10">
          <div className="w-10 h-px bg-amber-500/60 mb-6" />
          <blockquote className="text-3xl font-serif text-white italic leading-relaxed mb-4">
            "Art washes away from the soul the dust of everyday life."
          </blockquote>
          <p className="text-zinc-500 text-sm uppercase tracking-widest font-semibold">— Pablo Picasso</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-[55%] h-full flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">

          {/* ── Role Selection ── */}
          {step === 'role' && (
            <div className="space-y-6 sm:space-y-8 animate-fadeIn">
              <div>
                <button onClick={() => setStep('splash')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[11px] sm:text-sm mb-6 sm:mb-8 group">
                  <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <p className="text-amber-500 text-[9px] sm:text-[10px] uppercase tracking-widest font-black mb-2 sm:mb-3">Step 1 of 2</p>
                <h2 className="text-3xl sm:text-4xl font-serif text-white mb-2 font-bold">Choose Your Path</h2>
                <p className="text-zinc-500 text-xs sm:text-sm">How do you wish to engage with the gallery?</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pb-12 sm:pb-0">
                {roles.map(item => (
                  <button key={item.r} onClick={() => handleRoleSelect(item.r)}
                    className={`group relative p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border bg-gradient-to-br ${item.color} ${item.border} hover:scale-[1.02] active:scale-95 transition-all duration-300 text-left`}>
                    <span className="text-2xl sm:text-3xl block mb-3 sm:mb-4">{item.emoji}</span>
                    <h3 className={`text-base sm:text-lg font-bold mb-1.5 sm:mb-2 ${item.accent}`}>{item.label}</h3>
                    <p className="text-zinc-500 text-[10px] sm:text-[11px] leading-relaxed line-clamp-2">{item.desc}</p>
                    <div className={`absolute top-5 right-5 w-6 h-6 rounded-full border ${item.border} hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Login / Register Form ── */}
          {step === 'login' && (
            <div className="space-y-6 sm:space-y-8 animate-fadeIn">
              <div>
                <button onClick={() => setStep('role')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[11px] sm:text-sm mb-6 sm:mb-8 group">
                  <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Change role
                </button>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-amber-500 text-[9px] sm:text-[10px] uppercase tracking-widest font-black">Step 2 of 2</p>
                  <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                    className="text-[9px] sm:text-[10px] text-zinc-500 hover:text-amber-400 transition-colors font-semibold uppercase tracking-widest">
                    {mode === 'login' ? 'Create account →' : 'Sign in →'}
                  </button>
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif text-white mb-2 font-bold leading-tight">
                  {mode === 'login' ? 'Welcome Back' : 'Join ArtForge'}
                </h2>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-gradient-to-r ${selectedRoleInfo?.color} ${selectedRoleInfo?.border} mt-2`}>
                  <span className="text-sm">{selectedRoleInfo?.emoji}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${selectedRoleInfo?.accent}`}>{selectedRoleInfo?.label}</span>
                </div>
              </div>

              <form onSubmit={handleFinalize} className="space-y-3 sm:space-y-4">
                {/* Display name only shown for signup */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Display Name</label>
                    <input autoFocus required value={name} onChange={e => setName(e.target.value)}
                      placeholder="e.g. Julian Reed"
                      className="w-full bg-white border border-zinc-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-black font-bold text-sm outline-none focus:border-amber-500 transition-all placeholder:text-zinc-400 placeholder:font-normal" />
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Email Address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@artforge.com"
                    className="w-full bg-white border border-zinc-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-black font-bold text-sm outline-none focus:border-amber-500 transition-all placeholder:text-zinc-400 placeholder:font-normal" />
                </div>

                {/* Password */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500">Password</label>
                    <button type="button" onClick={() => alert('Password reset link sent to ' + email + ' (Demo mode)')} className="text-[9px] font-bold text-amber-500/70 hover:text-amber-400 uppercase tracking-widest transition-colors">Forgot?</button>
                  </div>
                  <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full bg-white border border-zinc-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-black font-bold text-sm outline-none focus:border-amber-500 transition-all placeholder:text-zinc-400 placeholder:font-normal" />
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-3 py-2 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                   <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded sm:rounded-lg border transition-all flex items-center justify-center ${rememberMe ? 'bg-amber-500 border-amber-500' : 'bg-white/5 border-zinc-200 group-hover:border-amber-500'}`}>
                     {rememberMe && <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                   </div>
                   <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase font-black tracking-widest group-hover:text-zinc-200 transition-colors">Remember account</span>
                </div>

                {/* Error message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-[11px] sm:text-sm text-red-400 animate-fadeIn">
                    ⚠️ {error}
                  </div>
                )}

                <button type="submit" disabled={isLoading}
                  className="w-full btn-shine bg-amber-500 hover:bg-amber-400 text-black py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-[0_10px_30px_rgba(245,158,11,0.25)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.35)] flex items-center justify-center gap-3 disabled:opacity-70 mt-2">
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      {mode === 'login' ? 'Enter Gallery' : 'Create Account'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4-4m4-4H3" />
                      </svg>
                    </>
                  )}
                </button>

                <p className="text-center text-[9px] text-zinc-600 pt-2 px-4 leading-relaxed">
                  Connects to Spring Boot backend · Falls back to demo mode automatically
                </p>
              </form>
            </div>
          )}

          {/* ── OTP Verification Step ── */}
          {step === 'otp' && (
            <div className="space-y-6 sm:space-y-8 animate-fadeIn">
              <div>
                <button onClick={() => setStep('login')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[11px] sm:text-sm mb-6 sm:mb-8 group">
                  <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 border border-amber-500/30 text-xl overflow-hidden">
                  ✉️
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif text-white mb-2 font-bold leading-tight">Verify Email</h2>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-1">
                  Security code sent to:
                </p>
                <p className="text-amber-500 font-bold tracking-wide text-xs sm:text-sm truncate">{email}</p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-8">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-6">Security Code</label>
                  <div className="flex justify-between gap-1.5 sm:gap-3">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <input
                        key={i}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={otp[i] || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          if (val) {
                            const newOtp = otp.split('');
                            newOtp[i] = val.slice(-1);
                            setOtp(newOtp.join(''));
                            // Focus next
                            if (i < 5) (e.target.nextElementSibling as HTMLInputElement)?.focus();
                          } else {
                            const newOtp = otp.split('');
                            newOtp[i] = '';
                            setOtp(newOtp.join(''));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otp[i] && i > 0) {
                            (e.target.previousElementSibling as HTMLInputElement)?.focus();
                          }
                        }}
                        className="w-full h-12 sm:h-16 bg-white border border-zinc-200 rounded-xl sm:rounded-2xl text-black font-serif text-lg sm:text-2xl text-center outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-sm"
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <p className="text-[10px] text-zinc-500 font-medium font-serif">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0 || isLoading}
                      className={`font-black uppercase tracking-widest transition-colors ${resendTimer > 0 ? 'text-zinc-300' : 'text-amber-500 hover:text-amber-400'}`}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Now'}
                    </button>
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-[11px] sm:text-sm text-red-400 animate-fadeIn">
                    ⚠️ {error}
                  </div>
                )}

                <button type="submit" disabled={isLoading || otp.length < 6}
                  className="w-full btn-shine bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-xl sm:rounded-2xl font-bold text-sm transition-all shadow-[0_10px_30px_rgba(245,158,11,0.25)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.35)] flex items-center justify-center gap-3 disabled:opacity-50">
                  {isLoading ? 'Verifying...' : 'Authenticate Account →'}
                </button>
                
                <p className="text-center text-[9px] text-zinc-600 pt-2 px-4">
                  Check your terminal output if no SMTP is configured in application.properties!
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthFlow;
