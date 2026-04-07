
import React, { useState, useEffect } from 'react';
import { UserRole, User } from '../types';
import { mockBackend } from '../services/mockBackend';
import Logo from './Logo';

interface Props {
  onLogin: (user: User) => void;
}

const AuthFlow: React.FC<Props> = ({ onLogin }) => {
  const [step, setStep] = useState<'splash' | 'role' | 'login'>('splash');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<UserRole>(UserRole.VISITOR);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep('login');
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600)); // Nice UX delay
    const user = mockBackend.login(name, role);
    onLogin(user);
  };

  const roles = [
    {
      r: UserRole.VISITOR,
      label: 'Collector',
      desc: 'Browse and acquire masterpieces from world-class artists.',
      emoji: '🎨',
      color: 'from-amber-500/20 to-amber-500/5',
      border: 'border-amber-500/30',
      accent: 'text-amber-400',
    },
    {
      r: UserRole.ARTIST,
      label: 'Artist',
      desc: 'Exhibit your vision to discerning collectors worldwide.',
      emoji: '✍️',
      color: 'from-blue-500/20 to-blue-500/5',
      border: 'border-blue-500/30',
      accent: 'text-blue-400',
    },
    {
      r: UserRole.CURATOR,
      label: 'Curator',
      desc: 'Organize exhibitions and guide the gallery narrative.',
      emoji: '🏛️',
      color: 'from-purple-500/20 to-purple-500/5',
      border: 'border-purple-500/30',
      accent: 'text-purple-400',
    },
    {
      r: UserRole.ADMIN,
      label: 'Administrator',
      desc: 'Oversee platform activities, users, and settings.',
      emoji: '⚙️',
      color: 'from-green-500/20 to-green-500/5',
      border: 'border-green-500/30',
      accent: 'text-green-400',
    },
  ];

  const selectedRoleInfo = roles.find(r => r.r === role);

  // Splash screen
  if (step === 'splash') {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=2000"
            className="w-full h-full object-cover opacity-25 scale-105"
            alt="background"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/80" />
        </div>

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl animate-orb pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/6 rounded-full blur-3xl animate-orb pointer-events-none" style={{ animationDelay: '9s' }} />

        <div className="relative z-10 flex flex-col items-center text-center px-6 animate-fadeIn">
          <div className="mb-8">
            <Logo size="xl" showTagline={true} />
          </div>

          <p className="text-zinc-400 text-lg font-light max-w-md mb-12 leading-relaxed animate-fadeIn delay-200">
            The world's most evocative digital art sanctuary. Where collectors meets creators.
          </p>

          {/* Stats */}
          <div className="flex gap-12 mb-14 animate-fadeIn delay-300">
            {[['500+', 'Artworks'], ['120+', 'Artists'], ['24', 'Countries']].map(([n, l]) => (
              <div key={l} className="text-center">
                <p className="text-3xl font-serif font-bold text-white">{n}</p>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1 font-semibold">{l}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep('role')}
            className="group btn-shine bg-white text-black px-14 py-5 rounded-2xl font-bold text-base hover:bg-amber-400 transition-all shadow-[0_20px_60px_rgba(255,255,255,0.1)] flex items-center gap-4 animate-fadeIn delay-500"
          >
            Enter the Sanctuary
            <svg className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>

          <p className="text-zinc-600 text-xs mt-8 animate-fadeIn delay-700">No real account needed · Demo mode</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex">
      {/* Left visual panel */}
      <div className="hidden lg:flex w-[45%] h-full relative flex-col justify-between p-16 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1500"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          alt="Art background"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/30 via-transparent to-[#050505]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />

        <div className="relative z-10">
          <Logo size="md" showTagline={false} />
        </div>

        <div className="relative z-10">
          <div className="w-10 h-px bg-amber-500/60 mb-6" />
          <blockquote className="text-3xl font-serif text-white italic leading-relaxed mb-4">
            "Art washes away from the soul the dust of everyday life."
          </blockquote>
          <p className="text-zinc-500 text-sm uppercase tracking-widest font-semibold">— Pablo Picasso</p>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="w-full lg:w-[55%] h-full flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">

          {/* Role Selection */}
          {step === 'role' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <button
                  onClick={() => setStep('splash')}
                  className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm mb-8 group"
                >
                  <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <p className="text-amber-500 text-[10px] uppercase tracking-widest font-black mb-3">Step 1 of 2</p>
                <h2 className="text-4xl font-serif text-white mb-2 font-bold">Choose Your Path</h2>
                <p className="text-zinc-500 text-sm">How do you wish to engage with the gallery?</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {roles.map(item => (
                  <button
                    key={item.r}
                    onClick={() => handleRoleSelect(item.r)}
                    className={`group relative p-5 rounded-2xl border bg-gradient-to-br ${item.color} ${item.border} hover:scale-[1.02] transition-all duration-300 text-left`}
                  >
                    <span className="text-2xl block mb-3">{item.emoji}</span>
                    <h3 className={`text-base font-bold mb-1.5 ${item.accent}`}>{item.label}</h3>
                    <p className="text-zinc-500 text-[10px] leading-relaxed">{item.desc}</p>
                    <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border ${item.border} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Login Form */}
          {step === 'login' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <button
                  onClick={() => setStep('role')}
                  className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm mb-8 group"
                >
                  <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Change role
                </button>

                <div className="flex items-center justify-between mb-1">
                  <p className="text-amber-500 text-[10px] uppercase tracking-widest font-black">Step 2 of 2</p>
                  <button
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-[10px] text-zinc-500 hover:text-amber-400 transition-colors font-semibold uppercase tracking-widest"
                  >
                    {mode === 'login' ? 'Create account →' : 'Sign in →'}
                  </button>
                </div>
                <h2 className="text-4xl font-serif text-white mb-2 font-bold">
                  {mode === 'login' ? 'Welcome Back' : 'Join ArtForge'}
                </h2>

                {/* Selected role badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-gradient-to-r ${selectedRoleInfo?.color} ${selectedRoleInfo?.border} mt-2`}>
                  <span className="text-sm">{selectedRoleInfo?.emoji}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${selectedRoleInfo?.accent}`}>{selectedRoleInfo?.label}</span>
                </div>
              </div>

              <form onSubmit={handleFinalize} className="space-y-5">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Email Address</label>
                    <input
                      type="email"
                      required={mode === 'signup'}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. you@artforge.com"
                      className="w-full bg-white/4 border border-white/8 rounded-2xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Display Name</label>
                  <input
                    autoFocus
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Julian Reed"
                    className="w-full bg-white/4 border border-white/8 rounded-2xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Passkey</label>
                  <input
                    type="password"
                    placeholder="••••••••••"
                    className="w-full bg-white/4 border border-white/8 rounded-2xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-shine bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-2xl font-bold text-sm transition-all shadow-[0_10px_30px_rgba(245,158,11,0.25)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.35)] flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Entering gallery...
                    </>
                  ) : (
                    <>
                      {mode === 'login' ? 'Enter Gallery' : 'Create Account'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] text-zinc-600">
                  🔒 Demo mode — no real data stored
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
