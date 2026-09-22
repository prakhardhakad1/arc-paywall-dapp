import React from 'react';
import { Coins, Lock, Unlock, Zap, Shield, TrendingUp } from 'lucide-react';

export default function StatsBento({ stats, isConnected, isArcNetwork }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      
      {/* Metric 1: Total Volume */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Volume Settled
          </span>
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center">
            <Coins className="w-4 h-4 text-cyan-400" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            ${stats.volumeUsdc}
          </span>
          <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/20">
            USDC
          </span>
        </div>
        <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-slate-400">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero slippage • Native Gas Asset</span>
        </div>
      </div>

      {/* Metric 2: Paywalled Gates */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Gates
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center">
            <Lock className="w-4 h-4 text-blue-400" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            {stats.totalGates}
          </span>
          <span className="text-xs text-slate-400">Protected Links</span>
        </div>
        <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-slate-400">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>On-chain access verification</span>
        </div>
      </div>

      {/* Metric 3: Total Unlocks */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Content Unlocks
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center">
            <Unlock className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            {stats.totalUnlocks}
          </span>
          <span className="text-xs text-slate-400">Instant Accesses</span>
        </div>
        <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>99% straight to creator</span>
        </div>
      </div>

      {/* Metric 4: Arc Network Speed */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Arc Finality
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            &lt; 1.0s
          </span>
          <span className="text-xs text-emerald-400 font-medium">Sub-second</span>
        </div>
        <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <span>Circle Institutional Consensus</span>
        </div>
      </div>

    </div>
  );
}
