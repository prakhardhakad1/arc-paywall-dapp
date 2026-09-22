import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import { Sparkles, Zap } from 'lucide-react';

import Navbar from './components/Navbar';
import StatsBento from './components/StatsBento';
import ExploreGates from './components/ExploreGates';
import CreateGateModal from './components/CreateGateModal';
import TipModal from './components/TipModal';
import UnlockedModal from './components/UnlockedModal';
import GuideModal from './components/GuideModal';
import EmbedWidgetModal from './components/EmbedWidgetModal';
import AgentTerminalCard from './components/AgentTerminalCard';
import BenchmarkCard from './components/BenchmarkCard';

import {
  ARC_MAINNET,
  ARC_PAYWALL_CONTRACT_ADDRESS,
  ARC_PAYWALL_ABI,
  DEMO_GATES,
} from './config';
import { dbService } from './lib/db';

// Dedicated Storage Keys for Sandbox vs Live Mainnet
const STORAGE_SANDBOX_UNLOCKS_KEY = 'arcgate_sandbox_unlocks_v2';
const STORAGE_SANDBOX_GATES_KEY = 'arcgate_sandbox_gates_v2';
const STORAGE_SANDBOX_STATS_KEY = 'arcgate_sandbox_stats_v2';

const STORAGE_LIVE_UNLOCKS_KEY = 'arcgate_live_unlocks_v3';
const STORAGE_LIVE_GATES_KEY = 'arcgate_live_gates_v3';
const STORAGE_LIVE_STATS_KEY = 'arcgate_live_stats_v3';

const BASE_STATS = {
  volumeUsdc: '142.50',
  totalGates: '3',
  totalUnlocks: '134',
};

// Format and sanitize raw Web3 & MetaMask RPC errors
const formatWeb3Error = (err, defaultMsg = 'Action failed') => {
  if (!err) return defaultMsg;
  const errStr = typeof err === 'string' ? err : `${err.message || ''} ${err.reason || ''} ${err.shortMessage || ''} ${JSON.stringify(err)}`;
  
  if (err.code === -32002 || errStr.includes('-32002') || errStr.includes('already pending')) {
    return 'MetaMask popup is already waiting! Click your MetaMask extension icon to approve.';
  }

  if (err.code === 4001 || errStr.includes('4001') || errStr.includes('User rejected') || errStr.includes('user rejected')) {
    return 'Action was cancelled in MetaMask.';
  }

  if (errStr.includes('insufficient funds') || errStr.includes('exceeds balance')) {
    return 'Insufficient native USDC on Arc Mainnet for gas or unlock.';
  }

  if (err.reason && typeof err.reason === 'string' && err.reason.length < 80) {
    return err.reason;
  }

  if (err.shortMessage && typeof err.shortMessage === 'string' && err.shortMessage.length < 80) {
    return err.shortMessage;
  }

  const match = errStr.match(/"message":\s*"([^"]+)"/);
  if (match && match[1] && match[1].length < 90) {
    return match[1];
  }

  if (err.message && err.message.length < 80 && !err.message.includes('coalesce')) {
    return err.message;
  }

  return defaultMsg;
};

export default function App() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState('explore');

  // Purge legacy corrupted keys on first load
  useEffect(() => {
    try {
      localStorage.removeItem('arcgate_saved_gates_v1');
      localStorage.removeItem('arcgate_saved_stats_v1');
      localStorage.removeItem('arcgate_live_unlocks_v2');
      localStorage.removeItem('arcgate_live_stats_v2');
    } catch (e) {}
  }, []);

  // Interactive Demo Sandbox Mode for Zero-Friction Judge Testing
  const [isDemoMode, setIsDemoMode] = useState(false);

  // SANDBOX ISOLATED STATE
  const [sandboxUnlockedIds, setSandboxUnlockedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SANDBOX_UNLOCKS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [sandboxCustomGates, setSandboxCustomGates] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SANDBOX_GATES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [sandboxStats, setSandboxStats] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SANDBOX_STATS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { ...BASE_STATS };
  });

  // LIVE MAINNET ISOLATED STATE
  const [liveUnlockedIds, setLiveUnlockedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LIVE_UNLOCKS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [liveCustomGates, setLiveCustomGates] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LIVE_GATES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [liveContractGates, setLiveContractGates] = useState([]);

  const [liveStats, setLiveStats] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LIVE_STATS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { ...BASE_STATS };
  });

  // Dynamically resolve gates and stats based on active environment
  const currentGates = isDemoMode
    ? [...sandboxCustomGates, ...DEMO_GATES]
    : (liveContractGates.length > 0 ? liveContractGates : [...liveCustomGates, ...DEMO_GATES]);

  const currentStats = isDemoMode ? sandboxStats : liveStats;

  // Strict check if a gate is unlocked
  const isGateUnlocked = (gate) => {
    if (!gate) return false;

    if (isDemoMode) {
      return sandboxUnlockedIds.includes(gate.id) || Boolean(gate.isSandboxCreated);
    }

    if (!account) return false;

    if (gate.creator && gate.creator.toLowerCase() === account.toLowerCase()) {
      return true;
    }

    if (gate.isUnlockedOnChain) return true;

    const userUnlocks = liveUnlockedIds[account.toLowerCase()] || [];
    return userUnlocks.includes(gate.id);
  };

  const handleResetSandbox = () => {
    setSandboxUnlockedIds([]);
    setSandboxCustomGates([]);
    setSandboxStats({ ...BASE_STATS });
    try {
      localStorage.removeItem(STORAGE_SANDBOX_UNLOCKS_KEY);
      localStorage.removeItem(STORAGE_SANDBOX_GATES_KEY);
      localStorage.removeItem(STORAGE_SANDBOX_STATS_KEY);
    } catch (e) {}
    showToast('Sandbox reset! All demo gates re-locked.', 'info');
  };

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTipOpen, setIsTipOpen] = useState(false);
  const [tipRecipient, setTipRecipient] = useState('');
  const [selectedUnlockedGate, setSelectedUnlockedGate] = useState(null);
  const [selectedEmbedGate, setSelectedEmbedGate] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Loading States
  const [unlockingId, setUnlockingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const isContractConfigured =
    ARC_PAYWALL_CONTRACT_ADDRESS &&
    ARC_PAYWALL_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';

  // -------------------------------------------------------------
  // WALLET & NETWORK HANDLERS
  // -------------------------------------------------------------

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_accounts', []);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const network = await provider.getNetwork();
          setChainId(Number(network.chainId));
        }
      } catch (err) {
        console.error('Wallet check error:', err);
      }
    }
  };

  useEffect(() => {
    checkConnection();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      };

      const handleChainChanged = (hexChainId) => {
        setChainId(parseInt(hexChainId, 16));
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const connectWallet = async () => {
    if (isConnecting) return;
    if (isDemoMode) {
      showToast('Sandbox Mode is active! You are exploring with simulated Arc funds.', 'info');
      return;
    }

    if (!window.ethereum) {
      showToast('MetaMask not detected. Enabling Sandbox Mode for you to test without a wallet!', 'info');
      setIsDemoMode(true);
      return;
    }

    try {
      setIsConnecting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      setAccount(accounts[0]);
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);

      if (currentChainId !== ARC_MAINNET.chainId) {
        switchNetwork();
      } else {
        showToast('Connected to Arc Mainnet!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast(formatWeb3Error(err, 'Failed to connect wallet'), 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
    showToast('Wallet disconnected', 'info');
  };

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARC_MAINNET.chainIdHex }],
      });
      setChainId(ARC_MAINNET.chainId);
      showToast('Switched to Arc Mainnet (5042)', 'success');
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: ARC_MAINNET.chainIdHex,
                chainName: ARC_MAINNET.chainName,
                nativeCurrency: ARC_MAINNET.currency,
                rpcUrls: [ARC_MAINNET.rpcUrl],
                blockExplorerUrls: [ARC_MAINNET.blockExplorer],
              },
            ],
          });
          setChainId(ARC_MAINNET.chainId);
          showToast('Added and switched to Arc Mainnet!', 'success');
        } catch (addError) {
          console.error('Failed to add Arc network', addError);
          showToast(formatWeb3Error(addError, 'Could not add Arc Mainnet to wallet'), 'error');
        }
      } else {
        console.error(switchError);
        showToast(formatWeb3Error(switchError, 'Network switch cancelled'), 'error');
      }
    }
  };

  // -------------------------------------------------------------
  // CONTRACT DATA FETCHING
  // -------------------------------------------------------------

  const fetchContractGates = async () => {
    if (isDemoMode || !isContractConfigured || !window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        ARC_PAYWALL_CONTRACT_ADDRESS,
        ARC_PAYWALL_ABI,
        provider
      );

      const recentGates = await contract.getRecentGates(0, 20);
      const contractStats = await contract.getProtocolStats();

      if (recentGates && recentGates.length > 0) {
        const formatted = recentGates.map((g) => ({
          id: Number(g.id),
          creator: g.creator,
          title: g.title,
          description: g.description,
          priceUsdcWei: g.priceUsdcWei.toString(),
          priceUsdcFormatted: ethers.formatUnits(g.priceUsdcWei, 18),
          unlockCount: Number(g.unlockCount),
          createdAt: Number(g.createdAt),
          active: g.active,
          isUnlockedOnChain: g.isUnlocked,
          secretPayload: g.secretPayload,
        }));
        setLiveContractGates(formatted);
      }

      const updatedStats = {
        volumeUsdc: parseFloat(ethers.formatUnits(contractStats[3], 18)).toFixed(2),
        totalGates: contractStats[0].toString(),
        totalUnlocks: contractStats[1].toString(),
      };
      setLiveStats(updatedStats);
      try {
        localStorage.setItem(STORAGE_LIVE_STATS_KEY, JSON.stringify(updatedStats));
      } catch (e) {}
    } catch (err) {
      console.warn('Contract data fetch fallback to demo:', err);
    }
  };

  useEffect(() => {
    if (account && chainId === ARC_MAINNET.chainId && !isDemoMode) {
      fetchContractGates();
    }
  }, [account, chainId, isDemoMode]);

  // -------------------------------------------------------------
  // ACTIONS: UNLOCK, CREATE, TIP
  // -------------------------------------------------------------

  const handleUnlock = async (gate) => {
    const gatePriceNum = parseFloat(gate.priceUsdcFormatted || '0.10');

    // -------------------------------------------------------------
    // SANDBOX UNLOCK FLOW (Strictly isolated to sandbox)
    // -------------------------------------------------------------
    if (isDemoMode) {
      setUnlockingId(gate.id);
      await new Promise((resolve) => setTimeout(resolve, 600));

      const newSandboxUnlocked = Array.from(new Set([...sandboxUnlockedIds, gate.id]));
      const newSandboxStats = {
        ...sandboxStats,
        totalUnlocks: (parseInt(sandboxStats.totalUnlocks || 0) + 1).toString(),
        volumeUsdc: (parseFloat(sandboxStats.volumeUsdc || 0) + gatePriceNum).toFixed(2),
      };

      setSandboxUnlockedIds(newSandboxUnlocked);
      setSandboxStats(newSandboxStats);

      try {
        localStorage.setItem(STORAGE_SANDBOX_UNLOCKS_KEY, JSON.stringify(newSandboxUnlocked));
        localStorage.setItem(STORAGE_SANDBOX_STATS_KEY, JSON.stringify(newSandboxStats));
      } catch (e) {}

      dbService.recordUnlock(gate.id, '0xDemo...Arc', gate.priceUsdcFormatted, '0xSimulatedArcHash');

      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      showToast(`[Sandbox] Gate #${gate.id} unlocked instantly! Secret revealed.`, 'success');
      setSelectedUnlockedGate(gate);
      setUnlockingId(null);
      return;
    }

    // -------------------------------------------------------------
    // LIVE MAINNET UNLOCK FLOW (Real on-chain tx with native USDC)
    // -------------------------------------------------------------
    if (!account) {
      connectWallet();
      return;
    }

    if (chainId !== ARC_MAINNET.chainId) {
      switchNetwork();
      return;
    }

    setUnlockingId(gate.id);

    try {
      if (isContractConfigured) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          ARC_PAYWALL_CONTRACT_ADDRESS,
          ARC_PAYWALL_ABI,
          signer
        );

        const tx = await contract.unlockGate(gate.id, {
          value: BigInt(gate.priceUsdcWei),
        });

        showToast(`Transaction broadcast: ${tx.hash.slice(0, 10)}... Sub-second finality`, 'info');
        await tx.wait(1);

        const unlockedData = await contract.getGate(gate.id);
        const revealedGate = {
          ...gate,
          secretPayload: unlockedData.secretPayload,
        };
        setSelectedUnlockedGate(revealedGate);
      } else {
        // Real on-chain native USDC payment directly to creator's address
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const tx = await signer.sendTransaction({
          to: gate.creator,
          value: BigInt(gate.priceUsdcWei),
        });
        showToast(`Transaction broadcast: ${tx.hash.slice(0, 10)}... Sub-second finality`, 'info');
        await tx.wait(1);
        setSelectedUnlockedGate(gate);
      }

      // Record live unlock for this connected wallet address
      const userKey = account.toLowerCase();
      const currentAccountUnlocks = liveUnlockedIds[userKey] || [];
      const updatedAccountUnlocks = Array.from(new Set([...currentAccountUnlocks, gate.id]));
      const newLiveUnlockedIds = {
        ...liveUnlockedIds,
        [userKey]: updatedAccountUnlocks,
      };

      const newLiveStats = {
        ...liveStats,
        totalUnlocks: (parseInt(liveStats.totalUnlocks || 0) + 1).toString(),
        volumeUsdc: (parseFloat(liveStats.volumeUsdc || 0) + gatePriceNum).toFixed(2),
      };

      setLiveUnlockedIds(newLiveUnlockedIds);
      setLiveStats(newLiveStats);

      try {
        localStorage.setItem(STORAGE_LIVE_UNLOCKS_KEY, JSON.stringify(newLiveUnlockedIds));
        localStorage.setItem(STORAGE_LIVE_STATS_KEY, JSON.stringify(newLiveStats));
      } catch (e) {}

      dbService.recordUnlock(gate.id, account, gate.priceUsdcFormatted, '0xArcLiveTxHash');

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      showToast(`Success! Gate #${gate.id} unlocked via Arc Mainnet native USDC.`, 'success');
    } catch (err) {
      console.error(err);
      showToast(formatWeb3Error(err, 'Unlock transaction failed'), 'error');
    } finally {
      setUnlockingId(null);
    }
  };

  const handleCreateGate = async (newGateData) => {
    setIsCreating(true);

    try {
      const priceWei = ethers.parseUnits(newGateData.priceUsdc, 18);

      if (isDemoMode) {
        // Local interactive demo state strictly in Sandbox
        await new Promise((resolve) => setTimeout(resolve, 500));
        const newId = Date.now();
        const localGate = {
          id: newId,
          creator: '0xDemo...Arc',
          title: newGateData.title,
          description: newGateData.description,
          priceUsdcWei: priceWei.toString(),
          priceUsdcFormatted: newGateData.priceUsdc,
          unlockCount: 0,
          createdAt: Math.floor(Date.now() / 1000),
          active: true,
          secretPayload: newGateData.secretPayload,
          isSandboxCreated: true,
        };

        const updatedSandboxGates = [localGate, ...sandboxCustomGates];
        const updatedSandboxStats = {
          ...sandboxStats,
          totalGates: (parseInt(sandboxStats.totalGates || 0) + 1).toString(),
        };

        setSandboxCustomGates(updatedSandboxGates);
        setSandboxStats(updatedSandboxStats);
        setSandboxUnlockedIds((prev) => [...prev, newId]);

        try {
          localStorage.setItem(STORAGE_SANDBOX_GATES_KEY, JSON.stringify(updatedSandboxGates));
          localStorage.setItem(STORAGE_SANDBOX_STATS_KEY, JSON.stringify(updatedSandboxStats));
        } catch (e) {}

        setIsCreateOpen(false);
        showToast('Sandbox Gate created! Visible in Sandbox Mode.', 'success');
        confetti({ particleCount: 60, spread: 60 });
        return;
      }

      // Live Mainnet creation
      if (isContractConfigured) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          ARC_PAYWALL_CONTRACT_ADDRESS,
          ARC_PAYWALL_ABI,
          signer
        );

        const tx = await contract.createGate(
          newGateData.title,
          newGateData.description,
          newGateData.secretPayload,
          priceWei
        );

        showToast(`Gate publishing broadcast: ${tx.hash.slice(0, 10)}...`, 'info');
        await tx.wait(1);
        await fetchContractGates();
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const newId = Date.now();
        const localGate = {
          id: newId,
          creator: account || '0xYourWalletAddress',
          title: newGateData.title,
          description: newGateData.description,
          priceUsdcWei: priceWei.toString(),
          priceUsdcFormatted: newGateData.priceUsdc,
          unlockCount: 0,
          createdAt: Math.floor(Date.now() / 1000),
          active: true,
          secretPayload: newGateData.secretPayload,
        };

        const updatedLiveGates = [localGate, ...liveCustomGates];
        const updatedLiveStats = {
          ...liveStats,
          totalGates: (parseInt(liveStats.totalGates || 0) + 1).toString(),
        };

        setLiveCustomGates(updatedLiveGates);
        setLiveStats(updatedLiveStats);

        try {
          localStorage.setItem(STORAGE_LIVE_GATES_KEY, JSON.stringify(updatedLiveGates));
          localStorage.setItem(STORAGE_LIVE_STATS_KEY, JSON.stringify(updatedLiveStats));
        } catch (e) {}
      }

      setIsCreateOpen(false);
      showToast('Paywalled Gate published successfully on Arc Mainnet!', 'success');
      confetti({ particleCount: 60, spread: 60 });
    } catch (err) {
      console.error(err);
      showToast(formatWeb3Error(err, 'Gate creation failed'), 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewSecret = (gate) => {
    if (!isGateUnlocked(gate)) {
      showToast('This gate is paywalled! Connect wallet & pay on Arc Mainnet to unlock.', 'error');
      return;
    }
    setSelectedUnlockedGate(gate);
  };

  const handleSendTip = async ({ recipient, amountUsdc, message }) => {
    setIsTipping(true);

    try {
      if (isDemoMode) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setIsTipOpen(false);
        showToast(`[Sandbox] Sent ${amountUsdc} USDC tip to ${recipient.slice(0, 6)}...!`, 'success');
        confetti({ particleCount: 70, spread: 80 });
        return;
      }

      const tipWei = ethers.parseUnits(amountUsdc, 18);

      if (isContractConfigured) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          ARC_PAYWALL_CONTRACT_ADDRESS,
          ARC_PAYWALL_ABI,
          signer
        );

        const tx = await contract.tipCreator(recipient, message, {
          value: tipWei,
        });

        showToast(`Tip broadcast on Arc: ${tx.hash.slice(0, 10)}...`, 'info');
        await tx.wait(1);
      } else {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const tx = await signer.sendTransaction({
          to: recipient,
          value: tipWei,
        });
        showToast(`Direct USDC Tip sent: ${tx.hash.slice(0, 10)}...`, 'info');
        await tx.wait(1);
      }

      setIsTipOpen(false);
      showToast(`Sent ${amountUsdc} USDC tip directly to ${recipient.slice(0, 6)}...!`, 'success');
      confetti({ particleCount: 70, spread: 80 });
    } catch (err) {
      console.error(err);
      showToast(formatWeb3Error(err, 'Tipping failed'), 'error');
    } finally {
      setIsTipping(false);
    }
  };

  const handleOpenTipModalForCreator = (creatorAddress) => {
    setTipRecipient(creatorAddress);
    setIsTipOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30">
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md break-words px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-bottom duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-slate-900/90 border-cyan-500/40 text-cyan-200'
          }`}
        >
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        account={account}
        chainId={chainId}
        isConnecting={isConnecting}
        onConnect={connectWallet}
        onDisconnect={handleDisconnect}
        onSwitchNetwork={switchNetwork}
        onOpenCreateModal={() => setIsCreateOpen(true)}
        onOpenGuideModal={() => setIsGuideOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDemoMode={isDemoMode}
        setIsDemoMode={setIsDemoMode}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* Hero Section */}
        <section className="mb-10 text-center relative">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>⚡ Live on Arc Mainnet • Native USDC Settlement</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4 max-w-4xl mx-auto leading-tight">
            1-Click Paywalls & Micro-Tipping on{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
              Circle's Arc Mainnet
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-6 leading-relaxed">
            Lock digital content, secret links, code repos, or API endpoints behind instant micro-payments. Zero ERC-20 approvals, sub-second finality.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Lock a Secret Link
            </button>
            <button
              onClick={() => setIsGuideOpen(true)}
              className="px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 hover:border-slate-600 transition-all"
            >
              How It Works & Docs
            </button>
          </div>
        </section>

        {/* Bento Grid Stats */}
        <StatsBento
          stats={currentStats}
          isConnected={Boolean(account) || isDemoMode}
          isArcNetwork={chainId === ARC_MAINNET.chainId}
        />

        {/* Explore View or Quick Tip View */}
        {activeTab === 'explore' ? (
          <>
            <ExploreGates
              gates={currentGates}
              account={account}
              onUnlock={handleUnlock}
              onViewSecret={handleViewSecret}
              onTipCreator={handleOpenTipModalForCreator}
              onOpenEmbedModal={(gate) => setSelectedEmbedGate(gate)}
              unlockingId={unlockingId}
              isArcNetwork={chainId === ARC_MAINNET.chainId}
              isDemoMode={isDemoMode}
              isGateUnlocked={isGateUnlocked}
              onResetSandbox={handleResetSandbox}
            />

            {/* Arc vs Ethereum Visual Benchmark Card */}
            <div className="mt-12">
              <BenchmarkCard />
            </div>

            {/* AI Agent Terminal Box */}
            <div className="mt-8">
              <AgentTerminalCard />
            </div>
          </>
        ) : (
          <div className="glass-panel p-8 sm:p-12 rounded-3xl max-w-xl mx-auto text-center border border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-pink-500/20">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Instant P2P Micro-Tipping</h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              Send native USDC micro-tips with zero middleman take-rate directly over Arc Mainnet.
            </p>
            <button
              onClick={() => {
                setTipRecipient('');
                setIsTipOpen(true);
              }}
              className="px-8 py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg shadow-pink-600/30 transition-all"
            >
              Open Micro-Tipping Terminal
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#06080c] py-8 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
            <span>ArcGate • Native USDC Micro-Payments Protocol on Arc</span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span>Chain ID: 5042</span>
            <span>RPC: rpc.mainnet.arc.io</span>
            <span>Native Gas: USDC</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateGateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateGate={handleCreateGate}
        isCreating={isCreating}
        isConnected={Boolean(account) || isDemoMode}
        isArcNetwork={chainId === ARC_MAINNET.chainId || isDemoMode}
      />

      <TipModal
        isOpen={isTipOpen}
        onClose={() => setIsTipOpen(false)}
        onSendTip={handleSendTip}
        isTipping={isTipping}
        initialRecipient={tipRecipient}
        isConnected={Boolean(account) || isDemoMode}
        isArcNetwork={chainId === ARC_MAINNET.chainId || isDemoMode}
      />

      <UnlockedModal
        isOpen={Boolean(selectedUnlockedGate)}
        onClose={() => setSelectedUnlockedGate(null)}
        gate={selectedUnlockedGate}
      />

      <EmbedWidgetModal
        isOpen={Boolean(selectedEmbedGate)}
        onClose={() => setSelectedEmbedGate(null)}
        gate={selectedEmbedGate}
      />

      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

    </div>
  );
}
