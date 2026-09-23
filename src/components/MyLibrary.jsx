import React from 'react';
import {
  Bookmark,
  ExternalLink,
  Unlock,
  ShieldCheck,
  User,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { getContentType } from '../lib/contentDetector';

export default function MyLibrary({
  gates,
  account,
  isDemoMode,
  isGateUnlocked,
  onViewSecret,
  onNavigateExplore,
}) {
  // Filter all gates unlocked by this user
  const unlockedGates = gates.filter((gate) => isGateUnlocked(gate));

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recent';
    const d = new Date(timestamp * 1000);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Library Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
              <span>My Content Library</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-semibold">
                {unlockedGates.length} Unlocked
              </span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Permanent access to all secret links, research papers, repositories, and private communities unlocked by your wallet.
          </p>
        </div>

        <button
          onClick={onNavigateExplore}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-700 transition-all cursor-pointer self-start sm:self-auto"
        >
          <span>Explore More Gates</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of Unlocked Content */}
      {unlockedGates.length === 0 ? (
        <div className="glass-panel p-12 sm:p-16 rounded-3xl text-center border border-slate-800 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
            <Bookmark className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Your library is empty</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            You haven't unlocked any paywalled links yet. Discover exclusive research notes, developer repositories, or private channels on Arc Mainnet.
          </p>
          <button
            onClick={onNavigateExplore}
            className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            Discover Content to Unlock
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {unlockedGates.map((gate) => {
            const badge = getContentType(gate);
            const BadgeIcon = badge.icon;
            const cleanUrl = gate.secretPayload ? gate.secretPayload.match(/https?:\/\/[^\s]+/)?.[0] : null;

            return (
              <div
                key={gate.id}
                className="glass-card rounded-2xl p-6 border border-emerald-500/30 hover:border-emerald-500/50 flex flex-col justify-between transition-all relative overflow-hidden group shadow-lg shadow-emerald-950/20"
              >
                {/* Background glow on hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none"></div>

                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}>
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>

                    <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Unlocked</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white mb-2 leading-snug line-clamp-2">
                    {gate.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {gate.description}
                  </p>

                  {/* Metadata pill */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 mb-5">
                    <span className="flex items-center space-x-1 font-mono">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>{truncateAddress(gate.creator)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{formatDate(gate.createdAt)}</span>
                    </span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onViewSecret(gate)}
                      className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Secret</span>
                    </button>

                    {cleanUrl ? (
                      <a
                        href={cleanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-cyan-600/20"
                      >
                        <span>Open Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <button
                        onClick={() => onViewSecret(gate)}
                        className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <span>View Passcode</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
