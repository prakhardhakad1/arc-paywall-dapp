import React, { useState } from 'react';
import { Lock, Unlock, ExternalLink, Heart, Clock, User, ArrowUpRight, CheckCircle2, Search } from 'lucide-react';

export default function ExploreGates({
  gates,
  account,
  onUnlock,
  onViewSecret,
  onTipCreator,
  unlockingId,
  isArcNetwork
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGates = gates.filter((g) => {
    const term = searchTerm.toLowerCase();
    return (
      g.title.toLowerCase().includes(term) ||
      g.description.toLowerCase().includes(term) ||
      g.creator.toLowerCase().includes(term)
    );
  });

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    const d = new Date(timestamp * 1000);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Discover Paywalled Links</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-normal">
              {filteredGates.length} Available
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Unlock digital alpha, code, files, or secret invites with instant 1-click native USDC.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search gates or creators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>
      </div>

      {/* Grid of Gates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGates.map((gate) => {
          const isCreator = account && gate.creator.toLowerCase() === account.toLowerCase();
          const isUnlocked = gate.isUnlocked || isCreator;
          const isCurrentlyUnlocking = unlockingId === gate.id;

          return (
            <div
              key={gate.id}
              className={`glass-card rounded-2xl p-6 flex flex-col justify-between border relative overflow-hidden transition-all ${
                isUnlocked
                  ? 'border-emerald-500/30 hover:border-emerald-500/50'
                  : 'border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              {/* Top Banner Tag */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono">{truncateAddress(gate.creator)}</span>
                  {isCreator && (
                    <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.2 rounded font-semibold">
                      You
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(gate.createdAt)}</span>
                  </span>
                  {isUnlocked ? (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" />
                      <span>Paywalled</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div className="mb-6 flex-1">
                <h3 className="text-base font-bold text-white tracking-tight mb-2 line-clamp-2">
                  {gate.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {gate.description}
                </p>
              </div>

              {/* Pricing & Footer Actions */}
              <div className="pt-4 border-t border-slate-800/90 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                      Access Fee
                    </span>
                    <span className="text-lg font-extrabold text-white">
                      {gate.priceUsdcFormatted}{' '}
                      <span className="text-xs font-semibold text-cyan-400">USDC</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                      Unlocks
                    </span>
                    <span className="text-sm font-semibold text-slate-300">
                      {gate.unlockCount} supporters
                    </span>
                  </div>
                </div>

                {/* Primary Button */}
                <div className="grid grid-cols-5 gap-2">
                  {isUnlocked ? (
                    <button
                      onClick={() => onViewSecret(gate)}
                      className="col-span-4 inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-all shadow-sm"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>View Unlocked Secret</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onUnlock(gate)}
                      disabled={isCurrentlyUnlocking}
                      className="col-span-4 inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4" />
                      <span>
                        {isCurrentlyUnlocking ? 'Confirming On-Chain...' : `Unlock • ${gate.priceUsdcFormatted} USDC`}
                      </span>
                    </button>
                  )}

                  {/* Direct Tip Creator Button */}
                  <button
                    onClick={() => onTipCreator(gate.creator)}
                    title="Send a direct micro-tip to creator"
                    className="col-span-1 inline-flex items-center justify-center p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-pink-400 border border-slate-700/80 transition-all"
                  >
                    <Heart className="w-4 h-4 fill-pink-500/20" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredGates.length === 0 && (
        <div className="glass-panel p-12 rounded-2xl text-center">
          <Lock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No gates found</h3>
          <p className="text-xs text-slate-400">
            Try adjusting your search query or create a new paywalled link!
          </p>
        </div>
      )}

    </div>
  );
}
