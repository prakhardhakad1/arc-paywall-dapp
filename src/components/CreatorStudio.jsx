import React, { useState } from 'react';
import {
  Coins,
  Lock,
  Unlock,
  PlusCircle,
  TrendingUp,
  Download,
  Share2,
  Code2,
  Eye,
  Check,
  Copy,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { getContentType } from '../lib/contentDetector';

export default function CreatorStudio({
  gates,
  account,
  isDemoMode,
  onOpenCreateModal,
  onOpenEmbedModal,
  onViewSecret,
  onToggleGateActive,
  onWithdrawEarnings,
  pendingEarnings,
  isWithdrawing,
}) {
  const [copiedGateId, setCopiedGateId] = useState(null);

  // Filter gates created by this creator (or demo creator in Sandbox)
  const myGates = gates.filter((gate) => {
    if (isDemoMode) {
      return gate.creator === '0xDemo...Arc' || gate.isSandboxCreated || gate.id <= 3;
    }
    return account && gate.creator && gate.creator.toLowerCase() === account.toLowerCase();
  });

  // Calculate creator analytics
  const totalVolume = myGates.reduce((sum, g) => {
    const price = parseFloat(g.priceUsdcFormatted || '0');
    return sum + price * (g.unlockCount || 0);
  }, 0);

  const totalSales = myGates.reduce((sum, g) => sum + (g.unlockCount || 0), 0);
  const activeGatesCount = myGates.filter((g) => g.active !== false).length;
  const pausedGatesCount = myGates.filter((g) => g.active === false).length;

  // Milestone Progress (e.g. goal of 50 USDC)
  const milestoneGoal = 50.0;
  const progressPercent = Math.min(100, Math.round((totalVolume / milestoneGoal) * 100));

  const handleCopyShareLink = (gateId) => {
    const url = `${window.location.origin}?gate=${gateId}`;
    navigator.clipboard.writeText(url);
    setCopiedGateId(gateId);
    setTimeout(() => setCopiedGateId(null), 2000);
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Creator Studio
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-semibold uppercase">
              {isDemoMode ? 'Sandbox Telemetry' : 'Live Arc Telemetry'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your paywalled content, track real-time USDC gross volume, and claim accumulated escrow earnings.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Gate</span>
        </button>
      </div>

      {/* Bento Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Gross Revenue with Circular Radial Gauge */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group border border-slate-800 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center">
              <Coins className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  ${totalVolume.toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  USDC
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {progressPercent}% of ${milestoneGoal} goal
              </span>
            </div>

            {/* Circular Radial Gauge */}
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-cyan-400 transition-all duration-1000 ease-out"
                  strokeDasharray={`${progressPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-white">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Unlocks / Sales */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group border border-slate-800 hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Accesses
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {totalSales}
            </span>
            <span className="text-xs text-slate-400">Paid Unlocks</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>Avg. conversion: </span>
            <span className="text-emerald-400 font-semibold">25.0%</span>
          </div>
        </div>

        {/* Metric 3: Active Gates vs Paused */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group border border-slate-800 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Protected Gates
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/30 flex items-center justify-center">
              <Lock className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {myGates.length}
            </span>
            <span className="text-xs text-slate-400">Published</span>
          </div>
          <div className="mt-2 flex items-center space-x-2 text-[11px]">
            <span className="text-emerald-400 font-medium">● {activeGatesCount} Active</span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-400 font-medium">● {pausedGatesCount} Paused</span>
          </div>
        </div>

        {/* Metric 4: Smart Contract Escrow Claim Card */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group border border-emerald-500/40 bg-emerald-950/20 shadow-lg shadow-emerald-950/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Claimable Escrow</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Pull Escrow
              </span>
            </div>
            <div className="flex items-baseline space-x-1.5 mb-1">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ${pendingEarnings || '0.00'}
              </span>
              <span className="text-xs font-semibold text-emerald-400">USDC</span>
            </div>
            <p className="text-[10px] text-slate-400 mb-3">
              Direct smart contract pull-over-push reserve
            </p>
          </div>

          <button
            onClick={onWithdrawEarnings}
            disabled={isWithdrawing || parseFloat(pendingEarnings || '0') <= 0}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isWithdrawing ? 'Claiming On-Chain...' : 'Claim Earnings'}</span>
          </button>
        </div>

      </div>

      {/* My Created Gates Table/Card List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <span>My Created Paywalls</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
              {myGates.length}
            </span>
          </h3>
        </div>

        {myGates.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center border border-slate-800">
            <Lock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white mb-1">No gates authored yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
              Launch your first paywalled link, secret repository, or invite link in under 30 seconds.
            </p>
            <button
              onClick={onOpenCreateModal}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/25 transition-all cursor-pointer"
            >
              Lock Your First Secret
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myGates.map((gate) => {
              const badge = getContentType(gate);
              const BadgeIcon = badge.icon;
              const isActive = gate.active !== false;
              const gateRevenue = (parseFloat(gate.priceUsdcFormatted || '0') * (gate.unlockCount || 0)).toFixed(2);

              return (
                <div
                  key={gate.id}
                  className={`glass-card rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                    isActive ? 'border-slate-800 hover:border-cyan-500/40' : 'border-amber-500/30 bg-amber-950/10'
                  }`}
                >
                  <div>
                    {/* Top Row: Content Badge & Status Toggle */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>

                      <button
                        onClick={() => onToggleGateActive(gate.id)}
                        className={`inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/60'
                            : 'bg-amber-950/80 text-amber-300 border-amber-500/30 hover:bg-amber-900/60'
                        }`}
                        title="Click to toggle Active / Paused state"
                      >
                        {isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-amber-400" />}
                        <span>{isActive ? 'Active' : 'Paused'}</span>
                      </button>
                    </div>

                    {/* Title & Description */}
                    <h4 className="text-sm font-bold text-white mb-1.5 line-clamp-1">
                      {gate.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {gate.description}
                    </p>

                    {/* Stats strip */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center mb-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Fee</span>
                        <span className="text-xs font-bold text-white">{gate.priceUsdcFormatted} USDC</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Unlocks</span>
                        <span className="text-xs font-bold text-cyan-400">{gate.unlockCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Earned</span>
                        <span className="text-xs font-bold text-emerald-400">${gateRevenue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="grid grid-cols-3 gap-1.5">
                      {/* View Secret */}
                      <button
                        onClick={() => onViewSecret(gate)}
                        className="py-2 px-2 rounded-xl text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center space-x-1 cursor-pointer transition-all"
                        title="Preview your secret content"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Secret</span>
                      </button>

                      {/* Embed Code */}
                      <button
                        onClick={() => onOpenEmbedModal(gate)}
                        className="py-2 px-2 rounded-xl text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center space-x-1 cursor-pointer transition-all"
                        title="Get 1-line HTML / React embed widget"
                      >
                        <Code2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Embed</span>
                      </button>

                      {/* Copy Share Link */}
                      <button
                        onClick={() => handleCopyShareLink(gate.id)}
                        className="py-2 px-2 rounded-xl text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center space-x-1 cursor-pointer transition-all"
                        title="Copy direct link to this gate"
                      >
                        {copiedGateId === gate.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5 text-blue-400" />
                            <span>Share</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
