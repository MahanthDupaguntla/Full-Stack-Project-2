import React, { useState, useEffect, useRef } from 'react';
import { UserRole, User } from '../types';
import {
  apiLogin, apiRegister, apiVerifyOtp, apiResendOtp,
  isBackendAvailable, getToken, setToken, clearToken,
} from '../services/apiService';
import Logo from './Logo';

interface Props {
  onLogin: (user: User) => void;
}

// ── Floating Particle Background ──────────────────────────────────────────────
const ParticleField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        o: Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${p.o})`;
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(245, 158, 11, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-[1] pointer-events-none" />;
};

// ── Eye Icon ──────────────────────────────────────────────────────────────────
const EyeIcon: React.FC<{ visible: boolean }> = ({ visible }) =>
  visible ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

// ── OTP Input ─────────────────────────────────────────────────────────────────
const OtpInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const chars = value.split('');
    chars[i] = digit;
    const next = chars.join('');
    onChange(next);
    if (digit && i < 5) {
      inputRefs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!value[i] && i > 0) {
        const chars = value.split('');
        chars[i - 1] = '';
        onChange(chars.join(''));
        inputRefs.current[i - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, ' ').slice(0, 6).trimEnd());
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={el => { inputRefs.current[i] = el; }}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className={`w-full aspect-square max-h-14 sm:max-h-16 bg-white/[0.04] border rounded-xl text-white font-serif text-xl sm:text-2xl text-center outline-none transition-all ${
            value[i]
              ? 'border-amber-500/60 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
              : 'border-white/[0.08] focus:border-amber-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-amber-500/10'
          }`}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
};

// ── Main AuthFlow ─────────────────────────────────────────────────────────────
const AuthFlow: React.FC<Props> = ({ onLogin }) => {
  const [step, setStep] = useState<'splash' | 'role' | 'login' | 'otp'>('splash');
  const [otp, setOtp] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<UserRole>(UserRole.VISITOR);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(
    localStorage.getItem('artforge_saved_email') || ''
  );
  const [password, setPassword] = useState(
    localStorage.getItem('artforge_saved_password') || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check backend status on mount (non-blocking)
  useEffect(() => {
    isBackendAvailable().then(online => {
      setBackendStatus(online ? 'online' : 'offline');
    });
  }, []);

  // Resend OTP countdown
  useEffect(() => {
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

  // ── Login / Register ───────────────────────────────────────────────────────
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
      const backendUp = backendStatus === 'online' || await isBackendAvailable();

      if (!backendUp) {
        setError('Backend server is not reachable. Please try again later.');
        setIsLoading(false);
        return;
      }

      let user: User;

      // ── Real Spring Boot auth ────────────────────────────────────────────
      if (mode === 'signup') {
        user = await apiRegister(name.trim(), email.trim(), password, role);
      } else {
        user = await apiLogin(email.trim(), password);
      }

      // Check if OTP verification is needed
      const token = getToken();
      if (token === '' || token === null) {
        setIsLoading(false);
        setStep('otp');
        startResendTimer();
        return;
      }

      // Verified — proceed
      saveCredentials();
      showSuccessAndLogin(user);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  // ── OTP Verification ───────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = otp.replace(/\s/g, '');
    if (clean.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const user = await apiVerifyOtp(email.trim(), clean);
      saveCredentials();
      showSuccessAndLogin(user);
    } catch (err: any) {
      setError(err.message ?? 'Invalid OTP code. Please try again.');
      setIsLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      await apiResendOtp(email.trim());
      startResendTimer();
    } catch (err: any) {
      setError(err.message ?? 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveCredentials = () => {
    if (rememberMe) {
      localStorage.setItem('artforge_saved_email', email.trim());
      localStorage.setItem('artforge_saved_password', password);
    } else {
      localStorage.removeItem('artforge_saved_email');
      localStorage.removeItem('artforge_saved_password');
    }
  };

  const showSuccessAndLogin = (user: User) => {
    setIsSuccess(true);
    setTimeout(() => onLogin(user), 2200);
  };

  const roles = [
    {
      r: UserRole.VISITOR,
      label: 'Collector',
      desc: 'Browse and acquire unique masterpieces.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      r: UserRole.ARTIST,
      label: 'Artist',
      desc: 'Exhibit your vision to a global audience.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
    },
    {
      r: UserRole.CURATOR,
      label: 'Curator',
      desc: 'Organize exhibitions and provide insights.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      r: UserRole.ADMIN,
      label: 'Administrator',
      desc: 'Manage platform users and settings.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
  ];

  const selectedRoleInfo = roles.find(r => r.r === role);

  // ── Error Message ──────────────────────────────────────────────────────────
  const ErrorMsg: React.FC = () => error ? (
    <div className="flex items-center gap-3 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3.5 animate-fadeIn">
      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="text-[12px] text-red-400 font-medium">{error}</p>
    </div>
  ) : null;

  // ── Success Screen ─────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#030303] flex items-center justify-center">
        <ParticleField />
        <div className="relative z-10 text-center space-y-8 max-w-sm px-6 auth-success-enter">
          <div className="relative mx-auto w-28 h-28">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />
            <div className="absolute inset-2 bg-amber-500/10 rounded-full animate-pulse" />
            <div className="relative w-28 h-28 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(245,158,11,0.4)] scale-up-center">
              <svg className="w-14 h-14 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" className="auth-checkmark" />
              </svg>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-4xl sm:text-5xl font-serif text-white italic font-bold tracking-tight">
              Access <span className="text-gold">Granted</span>
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed font-light">
              Welcome to the sanctuary,{' '}
              <span className="text-amber-400 font-semibold">
                {name || email.split('@')[0]}
              </span>.
              <br />Your profile has been secured in the vault.
            </p>
          </div>
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-amber-500/50 rounded-full"
                style={{ animation: `pulse 1s ease-in-out ${i * 0.15}s infinite` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Splash ─────────────────────────────────────────────────────────────────
  if (step === 'splash') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#030303] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=2000"
            className="w-full h-full object-cover opacity-30 auth-bg-zoom scale-105"
            style={{ objectPosition: 'center 40%' }}
            alt=""
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div
            className="bg-[#0f0f0f]/50 backdrop-blur-md px-10 py-8 rounded-3xl mb-14 auth-stagger-1 flex flex-col items-center"
            style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}
          >
            <Logo size="xl" showTagline={true} />
          </div>

          <button
            onClick={() => setStep('role')}
            className="group bg-white text-black px-12 py-4 rounded-[100px] font-bold text-[15px] hover:bg-zinc-200 transition-all duration-300 shadow-xl flex items-center gap-4 auth-stagger-2 outline-none"
          >
            <span className="tracking-wide text-black pb-px">Enter the Sanctuary</span>
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform stroke-black"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>

          {/* Backend status indicator */}
          <div className="mt-8 auth-stagger-3 flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${
              backendStatus === 'checking' ? 'bg-yellow-500 animate-pulse' :
              backendStatus === 'online'   ? 'bg-green-400 animate-pulse' :
                                            'bg-red-500'
            }`} />
            <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-semibold">
              {backendStatus === 'checking' ? 'Connecting...' :
               backendStatus === 'online'   ? 'Live · Backend Connected' :
                                             'Server Unavailable'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Role Select + Login/Signup + OTP ───────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] bg-[#030303] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1500"
          className="w-full h-full object-cover grayscale opacity-20 auth-bg-zoom scale-105"
          alt=""
        />
        <div className="absolute inset-0 bg-[#030303]/80 backdrop-blur-[2px]" />
      </div>

      <ParticleField />

      {/* Panel */}
      <div className="relative z-10 w-full h-full flex flex-col justify-center items-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-[460px] relative my-auto">
          <div className="auth-glow-ring" />
          <div className="w-full bg-[#0c0c0c]/80 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 sm:p-10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] relative">

            {/* ── Role Selection ── */}
            {step === 'role' && (
              <div className="space-y-8 auth-form-enter">
                <div className="mb-6">
                  <Logo size="md" showTagline={false} showText={false} />
                </div>

                <div>
                  <h2 className="text-3xl sm:text-[34px] font-serif text-white mb-2 tracking-tight font-normal">
                    Identify Your Path
                  </h2>
                  <p className="text-zinc-400 text-[15px] font-light">
                    Choose how you wish to engage with the gallery.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {roles.map((item, idx) => (
                    <button
                      key={item.r}
                      onClick={() => handleRoleSelect(item.r)}
                      className="group bg-[#0c0c0c] hover:bg-[#141414] border border-white/[0.04] hover:border-amber-500/20 rounded-[20px] p-[22px] flex items-center gap-5 transition-all w-full text-left active:scale-[0.98]"
                      style={{ animationDelay: `${idx * 0.08}s` }}
                    >
                      <div className="w-[42px] h-[42px] rounded-xl bg-white/[0.03] flex flex-shrink-0 items-center justify-center text-zinc-500 group-hover:text-amber-400 group-hover:bg-amber-500/10 transition-all">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold text-white mb-0.5">{item.label}</h3>
                        <p className="text-zinc-500 text-[13px]">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Backend status */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${backendStatus === 'online' ? 'bg-green-400' : 'bg-red-500'}`} />
                  <span className="text-[9px] text-zinc-600 uppercase tracking-widest">
                    {backendStatus === 'online' ? 'Backend • Connected' : 'Server Unavailable'}
                  </span>
                </div>
              </div>
            )}

            {/* ── Login / Register Form ── */}
            {step === 'login' && (
              <div className="space-y-7 auth-form-enter">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep('role')}
                    className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs group"
                  >
                    <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  <button
                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                    className="text-[10px] text-zinc-500 hover:text-amber-400 transition-colors font-semibold uppercase tracking-widest"
                  >
                    {mode === 'login' ? 'Create account →' : 'Sign in →'}
                  </button>
                </div>

                {/* Title */}
                <div>
                  <p className="text-amber-500 text-[9px] uppercase tracking-[0.4em] font-black mb-3">Step 2 of 2</p>
                  <h2 className="text-3xl sm:text-4xl font-serif text-white mb-3 font-bold italic tracking-tight">
                    {mode === 'login' ? <>Welcome <span className="text-gold">Back</span></> : <>Join <span className="text-gold">ArtForge</span></>}
                  </h2>
                  <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] mt-1">
                    <div className="w-4 h-4 flex items-center justify-center text-zinc-400">
                      {selectedRoleInfo?.icon}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                      {selectedRoleInfo?.label}
                    </span>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleFinalize} className="space-y-4">
                  {/* Display name (signup only) */}
                  {mode === 'signup' && (
                    <div className="auth-field-enter">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2.5">Display Name</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          autoFocus
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="e.g. Ananya Singh"
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 pl-11 text-white font-medium text-sm outline-none focus:border-amber-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-amber-500/10 transition-all placeholder:text-zinc-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2.5">Email Address</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        required
                        autoFocus={mode === 'login'}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@artforge.com"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 pl-11 text-white font-medium text-sm outline-none focus:border-amber-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-amber-500/10 transition-all placeholder:text-zinc-600"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Password</label>
                      <button
                        type="button"
                        onClick={() => alert('Password reset feature coming soon. Contact admin@artforge.com for help.')}
                        className="text-[9px] font-bold text-amber-500/60 hover:text-amber-400 uppercase tracking-widest transition-colors"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••••"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 pl-11 pr-12 text-white font-medium text-sm outline-none focus:border-amber-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-amber-500/10 transition-all placeholder:text-zinc-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                      >
                        <EyeIcon visible={showPassword} />
                      </button>
                    </div>
                  </div>

                  {/* Remember me */}
                  <div
                    className="flex items-center gap-3 py-1 cursor-pointer group"
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    <div className={`w-5 h-5 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
                      rememberMe
                        ? 'bg-amber-500 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'bg-transparent border-zinc-700 group-hover:border-amber-500/50'
                    }`}>
                      {rememberMe && (
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.15em] group-hover:text-zinc-300 transition-colors select-none">
                      Remember account
                    </span>
                  </div>

                  <ErrorMsg />

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-shine bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black py-4 rounded-xl font-bold text-sm transition-all duration-300 shadow-[0_10px_30px_rgba(245,158,11,0.2)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.35)] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed mt-3 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        <span>{mode === 'login' ? 'Signing in...' : 'Creating Account...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{mode === 'login' ? 'Enter Gallery' : 'Create Account'}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </>
                    )}
                  </button>

                  {/* Status */}
                  <p className="text-center text-[10px] text-zinc-700 px-4 leading-relaxed">
                    {backendStatus === 'online'
                      ? '🟢 Connected to ArtForge backend'
                      : '🔴 Backend offline — please check server status'}
                  </p>
                </form>
              </div>
            )}

            {/* ── OTP Verification ── */}
            {step === 'otp' && (
              <div className="space-y-8 auth-form-enter">
                <button
                  onClick={() => { setStep('login'); setOtp(''); setError(''); }}
                  className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs group"
                >
                  <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                <div>
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-serif text-white mb-3 font-bold italic tracking-tight">
                    Verify <span className="text-gold">Email</span>
                  </h2>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-1">
                    A 6-digit security code was sent to:
                  </p>
                  <p className="text-amber-400 font-bold tracking-wide text-sm truncate max-w-full">
                    {email}
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">
                      Security Code
                    </label>
                    <OtpInput value={otp} onChange={setOtp} />
                  </div>

                  {/* Resend */}
                  <div className="flex justify-center">
                    <p className="text-[11px] text-zinc-500 font-medium">
                      Didn't receive it?{' '}
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resendTimer > 0 || isLoading}
                        className={`font-bold uppercase tracking-widest transition-colors ${
                          resendTimer > 0 ? 'text-zinc-600 cursor-not-allowed' : 'text-amber-500 hover:text-amber-400'
                        }`}
                      >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                      </button>
                    </p>
                  </div>

                  <ErrorMsg />

                  <button
                    type="submit"
                    disabled={isLoading || otp.replace(/\s/g, '').length < 6}
                    className="w-full btn-shine bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black py-4 rounded-xl font-bold text-sm transition-all duration-300 shadow-[0_10px_30px_rgba(245,158,11,0.2)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Authenticate Account</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </>
                    )}
                  </button>

                  <p className="text-center text-[10px] text-zinc-700 pt-1 px-4 leading-relaxed">
                    Check your email for the 6-digit code. If you didn't receive it, use <span className="text-amber-500 font-bold">000000</span> as the bypass code.
                  </p>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthFlow;
