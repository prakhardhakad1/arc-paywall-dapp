import React from 'react';
import { Code2, Send, FileText, Database, Key, ExternalLink } from 'lucide-react';

/**
 * Detects content type and returns badge metadata based on gate details
 */
export function getContentType(gate) {
  if (!gate) return defaultBadge();

  const title = (gate.title || '').toLowerCase();
  const desc = (gate.description || '').toLowerCase();
  const payload = (gate.secretPayload || '').toLowerCase();
  const combined = `${title} ${desc} ${payload}`;

  // GitHub / Code
  if (combined.includes('github.com') || combined.includes('repo') || combined.includes('starter kit') || combined.includes('solidity') || combined.includes('codebase')) {
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

  // Telegram / Community Invite
  if (combined.includes('t.me/') || combined.includes('telegram') || combined.includes('channel') || combined.includes('invite link') || combined.includes('discord')) {
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

  // Research PDF / Blueprint
  if (combined.includes('.pdf') || combined.includes('paper') || combined.includes('blueprint') || combined.includes('research') || combined.includes('spec')) {
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

  // Dataset / Signals / Data feeds
  if (combined.includes('dataset') || combined.includes('data') || combined.includes('parquet') || combined.includes('database') || combined.includes('signals') || combined.includes('csv') || combined.includes('metrics') || combined.includes('alpha signals')) {
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

  // API Token / Secret Access Key
  if (combined.includes('api') || combined.includes('token') || combined.includes('secret') || combined.includes('passcode') || combined.includes('credential')) {
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
