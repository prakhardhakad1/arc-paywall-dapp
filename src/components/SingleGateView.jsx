import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  User,
  Clock,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Heart,
  Coins,
  Code2,
  Zap,
  TrendingUp,
  FlaskConical,
  Key,
} from 'lucide-react';
import { getContentType } from '../lib/contentDetector';
import { formatGateId, formatCreatorHandle } from '../lib/typedIds';
import { decryptPayload, getDemoGateKey } from '../lib/crypto';

export default function SingleGateView({
  gate,
  account,
  isDemoMode,
  isGateUnlocked,
  onUnlock,
  onTipCreator,
  onOpenEmbedModal,
  onBack,
  unlockingId,
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [decryptedText, setDecryptedText] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);

  const isUnlocked = isGateUnlocked(gate);

  // Client-side decryption of payload when unlocked
  useEffect(() => {
    if (isUnlocked && gate?.secretPayload) {
      setIsDecrypting(true);
      const gateKey = getDemoGateKey(gate.id);
      decryptPayload(gate.secretPayload, gateKey)
        .then((text) => {
          setDecryptedText(text);
          setIsDecrypting(false);
        })
        .catch(() => {
          setDecryptedText(gate.secretPayload);
          setIsDecrypting(false);
        });
    } else {
      setDecryptedText('');
      setIsDecrypting(false);
    }
  }, [isUnlocked, gate]);

  if (!gate) {
    return (
      <div className="glass-panel p-12 rounded-3xl text-center max-w-md mx-auto my-12">
        <Lock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Gate Not Found</h3>
        <p className="text-xs text-slate-400 mb-6">
          The requested paywalled gate ID could not be found or may have been paused.
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all cursor-pointer"
        >
          Return to All Gates
        </button>
      </div>
    );
  }

  const badge = getContentType(gate);
  const BadgeIcon = badge.icon;
  const isCurrentlyUnlocking = unlockingId === gate.id;
  const rawPayload = decryptedText || gate.secretPayload;
  const cleanUrl = rawPayload ? rawPayload.match(/https?:\/\/[^\s]+/)?.[0] : null;

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recent';
    const d = new Date(timestamp * 1000);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCopyShareLink = async () => {
    const url = `${window.location.origin}/gate/${gate.id}`;
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (err) {
        console.warn('Clipboard write permission denied:', err);
      }
    }
  };

  const handleCopySecret = async () => {
    const textToCopy = decryptedText || gate.secretPayload;
    if (textToCopy && navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } catch (err) {
        console.warn('Clipboard write permission denied:', err);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          aria-label="Back to explore all gates"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer py-1.5 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyShareLink}
            aria-label="Copy shareable link for this paywalled gate"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-200 hover:text-white py-1.5 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer"
            title="Copy shareable link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Gate'}</span>
          </button>

          <button
            onClick={() => onOpenEmbedModal(gate)}
            aria-label="Get 1-line HTML embed snippet"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 py-1.5 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer"
            title="Get 1-line HTML embed snippet"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Embed</span>
          </button>
        </div>
      </div>

      {/* Main Single Gate Landing Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}>
              <BadgeIcon className="w-3.5 h-3.5" />
              <span>{badge.label}</span>
            </span>

            <span className="font-mono text-xs text-slate-400 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-full">
              {formatGateId(gate.id, isDemoMode)}
            </span>

            {isDemoMode ? (
              <span className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-full">
                <FlaskConical className="w-3 h-3 text-amber-400" />
                <span>Sandbox Simulation</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-full">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>Arc Mainnet</span>
              </span>
            )}
          </div>

          {isUnlocked ? (
            <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Unlocked & Verified</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-3 py-1 rounded-full">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Paywalled Access</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-4">
          {gate.title}
        </h1>

        {/* Creator and Metadata Strip */}
        <div className="flex flex-wrap items-center gap-4 py-3 px-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 mb-6">
          <div className="flex items-center space-x-1.5">
            <User className="w-4 h-4 text-slate-500" />
            <span className="font-mono text-cyan-400 font-semibold">{formatCreatorHandle(gate.creator)}</span>
            <span className="font-mono text-slate-500 text-[11px] hidden sm:inline">({truncateAddress(gate.creator)})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Published {formatDate(gate.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-cyan-400">
            <TrendingUp className="w-4 h-4" />
            <span>{gate.unlockCount || 0} active supporters</span>
          </div>
        </div>

        {/* Description */}
        <div className="prose prose-invert max-w-none text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
          <p>{gate.description}</p>
        </div>

        {/* Unlocked Secret Container OR Locked Paywall Card */}
        {isUnlocked ? (
          <div className="p-6 rounded-3xl bg-slate-950/90 border border-emerald-500/40 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Protected Content (Decrypted)</span>
              </span>
              <button
                onClick={handleCopySecret}
                className="text-xs text-slate-300 hover:text-white flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-slate-800 font-mono text-xs sm:text-sm text-emerald-200 break-all select-all whitespace-pre-wrap">
              {isDecrypting ? (
                <div className="flex items-center space-x-2 text-slate-400 py-1">
                  <Key className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Decrypting secret payload client-side...</span>
                </div>
              ) : (
                decryptedText || gate.secretPayload
              )}
            </div>

            {cleanUrl && (
              <a
                href={cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Open Resource Directly</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-cyan-500/30 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Access Fee
                </span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {gate.priceUsdcFormatted}
                  </span>
                  <span className="text-sm font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                    USDC
                  </span>
                </div>
                <span className="text-xs text-slate-400 mt-1 block">
                  Native gas payment • 0 ERC-20 approvals required
                </span>
              </div>

              <button
                onClick={() => onUnlock(gate)}
                disabled={isCurrentlyUnlocking}
                className="py-4 px-8 rounded-2xl text-sm sm:text-base font-extrabold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-xl shadow-cyan-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {isCurrentlyUnlocking ? 'Unlocking on Arc...' : `Unlock for ${gate.priceUsdcFormatted} USDC`}
                </span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Sub-second instant finality</span>
              </div>
              <div className="flex items-center space-x-2">
                <Coins className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>99% direct to creator</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Permanent lifetime access</span>
              </div>
            </div>
          </div>
        )}

        {/* Tip Creator Button */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Enjoyed this creator's work?</span>
          <button
            onClick={() => onTipCreator(gate.creator)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-pink-400 hover:text-pink-300 border border-slate-700/80 transition-all cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 fill-pink-500/20" />
            <span>Send Direct Tip</span>
          </button>
        </div>

      </div>

    </div>
  );
}
