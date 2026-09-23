import React from 'react';
import { Coins, Lock, Unlock, Zap, Shield, TrendingUp, Sparkles } from 'lucide-react';

export default function StatsBento({ stats, isConnected, isArcNetwork, isDemoMode }) {
  const volume = stats?.volumeUsdc || '0.00';
  const totalGates = stats?.totalGates || '0';
  const totalUnlocks = stats?.totalUnlocks || '0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-5 mb-8 w-full">
      
      {/* Zone 1: Bento Hero Card - Primary Volume & Escrow Telemetry (6 cols on lg) */}
      <div className="sm:col-span-2 lg:col-span-6 glass-card p-6 sm:p-7 rounded-3xl relative overflow-hidden group border border-slate-800/80 shadow-2xl flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all pointer-events-none"></div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Gross Volume Settled
              </span>
              {isDemoMode ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30">
                  🧪 Sandbox Telemetry
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  ⚡ Arc Mainnet
                </span>
              )}
            </div>

            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/20">
              <Coins className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline space-x-3 mb-4">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              ${volume}
            </span>
            <span className="text-xs sm:text-sm font-bold text-cyan-400 bg-cyan-950/80 px-2 py-1 rounded-lg border border-cyan-500/30">
              USDC
            </span>
          </div>
        </div>

        {/* Visual telemetry strip with circular radial gauge for 99/1 split */}
        <div className="mt-2 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {/* Circular Radial Gauge: 99% Creator Share */}
            <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400 transition-all duration-1000 ease-out"
                  strokeDasharray="99, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-emerald-300">99%</span>
            </div>

            <div>
              <span className="text-xs font-semibold text-white block">Direct Creator Payout</span>
              <span className="text-[11px] text-slate-300">1% protocol fee reserve • Pull escrow</span>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[11px] font-semibold text-emerald-300 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>0 ERC-20 Approvals</span>
            </span>
            <span className="text-[10px] text-slate-300">Native USDC Gas</span>
          </div>
        </div>
      </div>

      {/* Zone 2: Bento Card - Protected Links & Content Unlocks (3 cols on lg) */}
      <div className="sm:col-span-1 lg:col-span-3 glass-card p-5 sm:p-6 rounded-3xl relative overflow-hidden group border border-slate-800/80 shadow-2xl flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none"></div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Protected Gates
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {totalGates}
            </span>
            <span className="text-xs text-slate-300">Active</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-300">Total Unlocks:</span>
            <span className="font-bold text-white font-mono">{totalUnlocks}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-300">
            <Shield className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span>On-chain access state</span>
          </div>
        </div>
      </div>

      {/* Zone 3: Bento Card - Sub-Second Finality & Institutional Security (3 cols on lg) */}
      <div className="sm:col-span-1 lg:col-span-3 glass-card p-5 sm:p-6 rounded-3xl relative overflow-hidden group border border-slate-800/80 shadow-2xl flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none"></div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Arc Settlement
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              &lt; 1.0s
            </span>
            <span className="text-xs text-emerald-400 font-semibold">Sub-second</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-300">Chain ID:</span>
            <span className="font-mono text-cyan-300 font-bold">5042</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
            <span>Circle Institutional Consensus</span>
          </div>
        </div>
      </div>

    </div>
  );
}
