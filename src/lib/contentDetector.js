import React from 'react';
import { Code2, Send, FileText, Database, Key, ExternalLink } from 'lucide-react';

/**
 * Detects content type based STRICTLY on public gate title and description
 * (Never exposes or inspects secretPayload to classify public badges)
 */
export function getContentType(gate) {
  if (!gate) return defaultBadge();

  const publicText = `${gate.title || ''} ${gate.description || ''}`.toLowerCase();

  // 1. GitHub / Code Repository
  if (/\b(github|repo|repository|code|template|starter kit|solidity|codebase|source code|sdk)\b/i.test(publicText)) {
    return {
      type: 'code',
      label: 'GitHub Repo',
      icon: Code2,
      bg: 'bg-purple-950/80',
      text: 'text-purple-300',
      border: 'border-purple-500/30',
      glow: 'shadow-purple-500/20',
      category: 'code',
    };
  }

  // 2. Telegram / Community Invite
  if (/\b(telegram|t\.me|channel|discord|community|invite|invites|chat|private group|vip group)\b/i.test(publicText)) {
    return {
      type: 'invite',
      label: 'Telegram VIP',
      icon: Send,
      bg: 'bg-sky-950/80',
      text: 'text-sky-300',
      border: 'border-sky-500/30',
      glow: 'shadow-sky-500/20',
      category: 'invites',
    };
  }

  // 3. Research PDF / Blueprint / Whitepaper
  if (/\b(pdf|blueprint|research|whitepaper|spec|specification|architecture blueprint)\b/i.test(publicText)) {
    return {
      type: 'research',
      label: 'Research PDF',
      icon: FileText,
      bg: 'bg-amber-950/80',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
      glow: 'shadow-amber-500/20',
      category: 'alpha',
    };
  }

  // 4. Dataset / Quantitative Signals
  if (/\b(dataset|datasets|parquet|csv|signals|data feeds|quant signals)\b/i.test(publicText)) {
    return {
      type: 'dataset',
      label: 'Alpha Dataset',
      icon: Database,
      bg: 'bg-emerald-950/80',
      text: 'text-emerald-300',
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-500/20',
      category: 'datasets',
    };
  }

  // 5. API Token / Endpoint Access
  if (/\b(api key|api token|access token|api endpoint|bearer token)\b/i.test(publicText)) {
    return {
      type: 'api',
      label: 'API Key',
      icon: Key,
      bg: 'bg-rose-950/80',
      text: 'text-rose-300',
      border: 'border-rose-500/30',
      glow: 'shadow-rose-500/20',
      category: 'datasets',
    };
  }

  return defaultBadge();
}

function defaultBadge() {
  return {
    type: 'link',
    label: 'Secret Link',
    icon: ExternalLink,
    bg: 'bg-cyan-950/80',
    text: 'text-cyan-300',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/20',
    category: 'alpha',
  };
}
