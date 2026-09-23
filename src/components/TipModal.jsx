import React, { useState } from 'react';
import { X, Heart, Sparkles, AlertCircle } from 'lucide-react';

export default function TipModal({ isOpen, onClose, onSendTip, isTipping, initialRecipient, isConnected, isArcNetwork }) {
  const [recipient, setRecipient] = useState(initialRecipient || '');
  const [amountUsdc, setAmountUsdc] = useState('0.50');
  const [message, setMessage] = useState('Great alpha! Keep building on Arc.');
  const [error, setError] = useState('');

  // Keep recipient updated if initialRecipient changes
  React.useEffect(() => {
    if (initialRecipient) {
      setRecipient(initialRecipient);
    }
  }, [initialRecipient]);

  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!isConnected) {
      setError('Please connect your wallet first.');
      return;
    }

    if (!isArcNetwork) {
      setError('Please switch to Arc Mainnet (Chain 5042).');
      return;
    }

    if (!recipient.trim() || !recipient.startsWith('0x') || recipient.length !== 42) {
      setError('Please enter a valid 0x EVM recipient address.');
      return;
    }

    const amt = parseFloat(amountUsdc);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid tip amount greater than 0.');
      return;
    }

    onSendTip({
      recipient: recipient.trim(),
      amountUsdc: amountUsdc.trim(),
      message: message.trim()
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tip-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl relative">
        
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-md shadow-pink-500/20">
            <Heart className="w-5 h-5 text-white fill-white/20" />
          </div>
          <div>
            <h3 id="tip-modal-title" className="text-lg font-bold text-white tracking-tight">
              Instant Creator Tip
            </h3>
            <p className="text-xs text-slate-400">
              Direct peer-to-peer USDC micro-tipping with zero intermediaries.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Recipient */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Creator Address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-all"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tip Amount (USDC)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.05"
                min="0.01"
                placeholder="0.50"
                value={amountUsdc}
                onChange={(e) => setAmountUsdc(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-3.5 pr-16 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-pink-400">
                USDC
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              {['0.10', '0.50', '1.00', '2.50', '5.00'].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setAmountUsdc(preset)}
                  className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                    amountUsdc === preset
                      ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              On-Chain Message (Optional)
            </label>
            <input
              type="text"
              placeholder="Leave a note for the creator..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-all"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isTipping}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg shadow-pink-600/25 transition-all disabled:opacity-50"
          >
            {isTipping ? 'Sending USDC Tip...' : `Send ${amountUsdc} USDC Tip`}
          </button>
        </form>

      </div>
    </div>
  );
}
