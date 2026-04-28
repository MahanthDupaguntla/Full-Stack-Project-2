import React, { useState } from 'react';
import { Artwork, User } from '../types';
import { toINRString } from '../utils/currency';

interface CheckoutPageProps {
  cart: Artwork[];
  cartTotal: number;
  user: User;
  onCheckout: () => Promise<void>;
  onBack: () => void;
  onRemove: (id: string) => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ cart, cartTotal, user, onCheckout, onBack, onRemove }) => {
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card' | 'upi'>('wallet');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'review' | 'payment' | 'confirm'>('review');

  const canPay = paymentMethod === 'wallet'
    ? user.walletBalance >= cartTotal
    : paymentMethod === 'card'
      ? cardNumber.length >= 16 && cardExpiry.length >= 4 && cardCvv.length >= 3
      : upiId.includes('@');

  const handlePay = async () => {
    setIsProcessing(true);
    await onCheckout();
    setStep('confirm');
    setIsProcessing(false);
  };

  if (cart.length === 0 && step !== 'confirm') {
    return (
      <div className="flex flex-col items-center justify-center py-20 sm:py-40 animate-fadeIn text-center px-4">
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-white/5">
          <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif text-white mb-3 italic">Your Cart is Empty</h2>
        <p className="text-zinc-500 text-sm mb-8 max-w-sm">Discover extraordinary artworks in our gallery and add them to your collection.</p>
        <button onClick={onBack} className="bg-white text-black px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-500 transition-all">
          Explore Gallery →
        </button>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="flex flex-col items-center justify-center py-20 sm:py-40 animate-fadeIn text-center px-4">
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20 animate-bounce">
          <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif text-white mb-4 italic">Purchase Complete!</h2>
        <p className="text-zinc-400 text-sm mb-2 max-w-md">Your artworks have been added to your collection. You can view them in your profile.</p>
        <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-10">Transaction confirmed</p>
        <button onClick={onBack} className="bg-white text-black px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-amber-500 transition-all shadow-xl">
          Back to Gallery
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn pb-20 px-2 sm:px-4">
      <header className="mb-8 sm:mb-12">
        <button onClick={onBack} className="text-zinc-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          Back to Gallery
        </button>
        <span className="tag-pill mb-3 inline-block">Secure Checkout</span>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white italic">
          {step === 'review' ? 'Review ' : 'Payment '}
          <span className="text-gold">Cart</span>
        </h2>
      </header>

      {/* Steps indicator */}
      <div className="flex items-center gap-3 mb-10">
        {['review', 'payment'].map((s, i) => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === s ? 'bg-amber-500 text-black' : i === 0 && step === 'payment' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-zinc-600 border border-white/10'}`}>
              {i === 0 && step === 'payment' ? '✓' : i + 1}
            </div>
            {i < 1 && <div className={`flex-1 h-px ${step === 'payment' ? 'bg-amber-500/50' : 'bg-white/10'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {step === 'review' && cart.map((art: Artwork) => (
            <div key={art.id} className="glass rounded-2xl p-4 sm:p-5 flex gap-4 sm:gap-5 items-center border border-white/5 hover:border-amber-500/20 transition-all group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-serif font-bold text-sm sm:text-base italic truncate">{art.title}</h3>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mt-1">{art.artist}</p>
                <p className="text-amber-500 font-bold text-sm mt-2">{toINRString(art.price)}</p>
              </div>
              <button
                onClick={() => onRemove(art.id)}
                className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}

          {step === 'payment' && (
            <div className="glass rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 border border-white/5 space-y-6">
              <h3 className="text-lg font-serif text-white italic">Select Payment Method</h3>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: 'wallet' as const, label: 'Wallet', icon: '💰', sub: toINRString(user.walletBalance) },
                  { id: 'card' as const, label: 'Card', icon: '💳', sub: 'Visa/Master' },
                  { id: 'upi' as const, label: 'UPI', icon: '📱', sub: 'Google Pay' },
                ]).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-4 rounded-xl border text-center transition-all ${paymentMethod === m.id ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 bg-white/5 hover:bg-white/8'}`}
                  >
                    <span className="text-2xl block mb-2">{m.icon}</span>
                    <span className="text-white text-xs font-bold block">{m.label}</span>
                    <span className="text-zinc-500 text-[9px] uppercase tracking-widest">{m.sub}</span>
                  </button>
                ))}
              </div>

              {paymentMethod === 'wallet' && user.walletBalance < cartTotal && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-xs">
                  Insufficient balance. You need {toINRString(cartTotal - user.walletBalance)} more.
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <input value={cardNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} placeholder="Card Number" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white text-sm outline-none focus:border-amber-500/50 placeholder:text-zinc-600" />
                  <div className="grid grid-cols-2 gap-4">
                    <input value={cardExpiry} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardExpiry(e.target.value.slice(0, 5))} placeholder="MM/YY" className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white text-sm outline-none focus:border-amber-500/50 placeholder:text-zinc-600" />
                    <input value={cardCvv} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="CVV" type="password" className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white text-sm outline-none focus:border-amber-500/50 placeholder:text-zinc-600" />
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <input value={upiId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUpiId(e.target.value)} placeholder="yourname@upi" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white text-sm outline-none focus:border-amber-500/50 placeholder:text-zinc-600" />
              )}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="glass rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 border border-white/5 h-fit sticky top-32">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Order Summary</h3>
          <div className="space-y-3 mb-6 border-b border-white/5 pb-6">
            <div className="flex justify-between text-xs"><span className="text-zinc-500">Items ({cart.length})</span><span className="text-white font-bold">{toINRString(cartTotal)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-zinc-500">Platform Fee</span><span className="text-white font-bold">{toINRString(cartTotal * 0.02)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-zinc-500">Tax (GST 18%)</span><span className="text-white font-bold">{toINRString(cartTotal * 0.18)}</span></div>
          </div>
          <div className="flex justify-between items-center mb-8">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Total</span>
            <span className="text-2xl font-serif font-bold text-white">{toINRString(cartTotal * 1.2)}</span>
          </div>

          {step === 'review' ? (
            <button
              onClick={() => setStep('payment')}
              className="w-full bg-white text-black py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-500 transition-all shadow-xl"
            >
              Proceed to Payment →
            </button>
          ) : (
            <button
              onClick={handlePay}
              disabled={!canPay || isProcessing}
              className="w-full bg-amber-500 text-black py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : `Pay ${toINRString(cartTotal * 1.2)}`}
            </button>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-zinc-600 text-[9px] uppercase tracking-widest">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Secure & Encrypted
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
