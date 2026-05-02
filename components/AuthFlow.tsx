import React, { useState, useEffect, useRef } from 'react';
import { UserRole, User } from '../types';
import { apiLogin, apiRegister, apiVerifyOtp, isBackendAvailable } from '../services/apiService';
import Logo from './Logo';

interface Props {
  onLogin: (user: User) => void;
}

const OtpInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const chars = value.split('');
    chars[i] = digit;
    const next = chars.join('');
    onChange(next);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      const chars = value.split('');
      chars[i - 1] = '';
      onChange(chars.join(''));
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, ' ').slice(0, 6).trimEnd());
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={el => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className={`w-12 h-14 bg-white/[0.04] border rounded-xl text-white font-serif text-2xl text-center outline-none transition-all ${
            value[i] ? 'border-amber-500/60' : 'border-white/[0.08] focus:border-amber-500/50'
          }`}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
};

const AuthFlow: React.FC<Props> = ({ onLogin }) => {
  const [step, setStep] = useState<'role' | 'login' | 'otp'>('role');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<UserRole>(UserRole.VISITOR);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleSubmitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        await apiRegister(name.trim(), email.trim(), password, role);
      } else {
        await apiLogin(email.trim(), password);
      }
      setStep('otp');
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = otp.replace(/\s/g, '');
    if (clean.length < 6) return setError('Enter 6-digit code');
    
    setIsLoading(true);
    setError('');
    
    try {
      const data: any = await apiVerifyOtp(email.trim(), clean);
      if (data.token) {
        onLogin(data); // Pass full user data
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#030303] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0c0c0c] border border-white/[0.08] rounded-3xl p-8">
        
        {step === 'role' && (
          <div className="space-y-6">
            <div className="text-center mb-8"><Logo size="md" /></div>
            <h2 className="text-3xl font-serif text-white mb-4">Choose Role</h2>
            {[UserRole.VISITOR, UserRole.ARTIST, UserRole.CURATOR, UserRole.ADMIN].map(r => (
              <button
                key={r}
                onClick={() => { setRole(r); setStep('login'); }}
                className="w-full p-4 text-left border border-white/[0.1] rounded-xl hover:border-amber-500/50 text-white transition-colors mb-3"
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {step === 'login' && (
          <form onSubmit={handleSubmitAuth} className="space-y-4">
            <h2 className="text-3xl font-serif text-white mb-6">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            
            {mode === 'signup' && (
              <input
                required placeholder="Display Name" value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-white outline-none"
              />
            )}
            <input
              type="email" required placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-white outline-none"
            />
            <input
              type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-white outline-none"
            />
            
            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button disabled={isLoading} className="w-full bg-amber-500 text-black py-4 rounded-xl font-bold mt-4">
              {isLoading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Sign Up')}
            </button>
            
            <p className="text-center text-zinc-500 text-sm mt-4 cursor-pointer hover:text-white" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Login'}
            </p>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <h2 className="text-3xl font-serif text-white mb-2">Verify Email</h2>
            <p className="text-zinc-400 mb-6">Enter code sent to <span className="text-amber-500">{email}</span></p>
            
            <OtpInput value={otp} onChange={setOtp} />
            
            {error && <p className="text-red-400 text-sm">{error}</p>}
            
            <button disabled={isLoading || otp.length < 6} className="w-full bg-amber-500 text-black py-4 rounded-xl font-bold mt-4 disabled:opacity-50">
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <p className="text-center text-zinc-500 text-sm mt-4">
              Didn't receive code? {resendTimer > 0 ? `Wait ${resendTimer}s` : <button type="button" onClick={handleSubmitAuth} className="text-amber-500">Resend</button>}
            </p>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthFlow;
