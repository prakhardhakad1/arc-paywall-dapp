import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ExternalLink,
  Heart,
  Clock,
  User,
  ArrowUpRight,
  CheckCircle2,
  Search,
  Code2,
  Eye,
  TrendingUp,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { dbService } from '../lib/db';
import { getContentType } from '../lib/contentDetector';
import { formatGateId, formatCreatorHandle } from '../lib/typedIds';

const CATEGORIES = [
  { id: 'all', label: 'All Content' },
  { id: 'alpha', label: 'Research & Alpha' },
  { id: 'code', label: 'Code Repos' },
  { id: 'invites', label: 'Private Channels' },
  { id: 'datasets', label: 'Datasets & APIs' },
];

export default function ExploreGates({
  gates,
  account,
  onUnlock,
  onViewSecret,
  onTipCreator,
  onOpenEmbedModal,
  onSelectGate,
  unlockingId,
  isArcNetwork,
  isDemoMode,
  isGateUnlocked,
  onResetSandbox,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  // Filter gates
  const filteredGates = gates
    .filter((g) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        g.title.toLowerCase().includes(term) ||
        g.description.toLowerCase().includes(term) ||
        g.creator.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (selectedCategory === 'all') return true;
      const contentType = getContentType(g);
      return contentType.category === selectedCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.unlockCount || 0) - (a.unlockCount || 0);
      }
      if (sortBy === 'newest') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      if (sortBy === 'price_asc') {
        return parseFloat(a.priceUsdcFormatted || '0') - parseFloat(b.priceUsdcFormatted || '0');
      }
      if (sortBy === 'price_desc') {
        return parseFloat(b.priceUsdcFormatted || '0') - parseFloat(a.priceUsdcFormatted || '0');
      }
      return 0;
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
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Discover Paywalled Links</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-normal">
                {filteredGates.length} Available
              </span>
            </h2>
            {isDemoMode && (
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40">
                  Sandbox Mode
                </span>
                {onResetSandbox && (
                  <button
                    onClick={onResetSandbox}
                    className="inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition-all cursor-pointer shadow-sm"
                    title="Reset Sandbox Unlocks"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Unlock digital downloads, code, files, or private links with instant 1-click native USDC.
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

      {/* Category Chips and Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Category Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <span className="text-xs text-slate-400 flex items-center space-x-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Sort:</span>
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer font-medium"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Grid of Gates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGates.map((gate) => {
          const isCreator = !isDemoMode && account && gate.creator && gate.creator.toLowerCase() === account.toLowerCase();
          const isUnlocked = isGateUnlocked ? isGateUnlocked(gate) : (isDemoMode ? Boolean(gate.isUnlocked) : false);
          const isCurrentlyUnlocking = unlockingId === gate.id;
          const isPaused = gate.active === false;
          const badge = getContentType(gate);
          const BadgeIcon = badge.icon;
          const stats = dbService.getGateStats(gate.id, gate.unlockCount, parseFloat(gate.priceUsdcFormatted || 0.1));

          return (
            <div
              key={gate.id}
              className={`glass-card rounded-2xl p-6 flex flex-col justify-between border relative overflow-hidden transition-all group ${
                isUnlocked
                  ? 'border-emerald-500/30 hover:border-emerald-500/50'
                  : isPaused
                  ? 'border-amber-500/30 bg-amber-950/10'
                  : 'border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              <div>
                {/* Top Banner Tag */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono text-cyan-400 font-semibold">{formatCreatorHandle(gate.creator)}</span>
                    <span className="font-mono text-slate-500 text-[10px] hidden sm:inline">({truncateAddress(gate.creator)})</span>
                    {isCreator && (
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.2 rounded font-semibold">
                        You
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] text-slate-500 flex items-center space-x-1 mr-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(gate.createdAt)}</span>
                    </span>
                    
                    {isUnlocked ? (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Unlocked</span>
                      </span>
                    ) : isPaused ? (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-amber-400 bg-amber-950/70 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        <span>Paused</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-amber-400/90 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Paywalled</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Rich Content Badge & Typed Gate ID */}
                <div className="mb-2 flex items-center space-x-2">
                  <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}>
                    <BadgeIcon className="w-3 h-3" />
                    <span>{badge.label}</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-800">
                    {formatGateId(gate.id, isDemoMode)}
                  </span>
                </div>

                {/* Gate Title (clickable to single gate landing view) */}
                <h3
                  onClick={() => onSelectGate && onSelectGate(gate)}
                  className="text-base font-bold text-white mb-2 leading-snug group-hover:text-cyan-300 transition-colors line-clamp-2 cursor-pointer flex items-center space-x-1"
                >
                  <span>{gate.title}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-cyan-400" />
                </h3>

                {/* Gate Description */}
                <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">
                  {gate.description}
                </p>
              </div>

              <div>
                {/* Simulated Telemetry / Views & Conversion */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 py-2 border-t border-slate-800/80 mb-3">
                  <span className="flex items-center space-x-1">
                    <Eye className="w-3 h-3 text-slate-400" />
                    <span>{stats.views} views</span>
                  </span>
                  <span className="flex items-center space-x-1 text-emerald-400 font-medium">
                    <TrendingUp className="w-3 h-3" />
                    <span>{stats.conversion}% conv</span>
                  </span>
                </div>

                {/* Pricing / Access Fee */}
                <div className="flex items-baseline justify-between mb-4">
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

                {/* Primary Button Bar */}
                <div className="grid grid-cols-6 gap-2">
                  {isUnlocked ? (
                    <button
                      onClick={() => onViewSecret(gate)}
                      className="col-span-4 inline-flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-all shadow-sm cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>View Secret</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onUnlock(gate)}
                      disabled={isCurrentlyUnlocking || isPaused}
                      className="col-span-4 inline-flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span className="truncate">
                        {isCurrentlyUnlocking
                          ? 'Unlocking...'
                          : isPaused
                          ? 'Paused by Creator'
                          : `Unlock • ${gate.priceUsdcFormatted} USDC`}
                      </span>
                    </button>
                  )}

                  {/* 1-Line Embed Widget Button */}
                  <button
                    onClick={() => onOpenEmbedModal(gate)}
                    title="Get 1-line HTML / React embed snippet"
                    className="col-span-1 inline-flex items-center justify-center p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700/80 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>

                  {/* Direct Tip Creator Button */}
                  <button
                    onClick={() => onTipCreator(gate.creator)}
                    title="Send a direct micro-tip to creator"
                    className="col-span-1 inline-flex items-center justify-center p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-pink-400 border border-slate-700/80 transition-all hover:scale-105 active:scale-95 cursor-pointer"
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
            Try adjusting your search query, selecting another category, or creating a new paywalled link!
          </p>
        </div>
      )}

    </div>
  );
}
