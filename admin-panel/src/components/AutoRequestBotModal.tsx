import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Square, 
  Zap, 
  Users, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Activity, 
  RotateCcw, 
  ArrowDownLeft, 
  ArrowUpRight,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  autoRequestBotService, 
  AutoBotState, 
  AutoBotConfig, 
  AutoBotLog 
} from '../services/autoRequestBotService';
import { Agent } from '../types';

interface AutoRequestBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  onRequestDispatched?: () => void;
}

export const AutoRequestBotModal: React.FC<AutoRequestBotModalProps> = ({
  isOpen,
  onClose,
  agents,
  onRequestDispatched
}) => {
  const [botState, setBotState] = useState<AutoBotState>(autoRequestBotService.getState());
  const [targetAgentId, setTargetAgentId] = useState<string>('all');
  const [totalRequests, setTotalRequests] = useState<number>(10);
  const [intervalPreset, setIntervalPreset] = useState<'realistic' | 'fast' | 'custom'>('realistic');
  const [minIntervalSec, setMinIntervalSec] = useState<number>(60);
  const [maxIntervalSec, setMaxIntervalSec] = useState<number>(120);
  const [minAmount, setMinAmount] = useState<number>(500);
  const [maxAmount, setMaxAmount] = useState<number>(25000);
  const [requestType, setRequestType] = useState<'random' | 'deposit' | 'withdrawal'>('random');
  const [selectedGateway, setSelectedGateway] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'random'>('bKash');
  const [isInstantSending, setIsInstantSending] = useState(false);

  // Sync with service
  useEffect(() => {
    autoRequestBotService.setKnownAgents(agents);
    const unsubscribe = autoRequestBotService.subscribe((newState) => {
      setBotState(newState);
      if (newState.lastDispatched && onRequestDispatched) {
        onRequestDispatched();
      }
    });

    // Initialize local controls from current bot config
    const currentCfg = autoRequestBotService.getState().config;
    setTargetAgentId(currentCfg.targetAgentId);
    setTotalRequests(currentCfg.totalRequests);
    setMinAmount(currentCfg.minAmount);
    setMaxAmount(currentCfg.maxAmount);
    setRequestType(currentCfg.requestType);
    setSelectedGateway(currentCfg.selectedGateway || 'bKash');
    setMinIntervalSec(currentCfg.minIntervalSec);
    setMaxIntervalSec(currentCfg.maxIntervalSec);

    if (currentCfg.minIntervalSec === 60 && currentCfg.maxIntervalSec === 120) {
      setIntervalPreset('realistic');
    } else if (currentCfg.minIntervalSec === 10 && currentCfg.maxIntervalSec === 20) {
      setIntervalPreset('fast');
    } else {
      setIntervalPreset('custom');
    }

    return () => unsubscribe();
  }, [agents, onRequestDispatched]);

  if (!isOpen) return null;

  const handlePresetChange = (preset: 'realistic' | 'fast' | 'custom') => {
    setIntervalPreset(preset);
    if (preset === 'realistic') {
      setMinIntervalSec(60);
      setMaxIntervalSec(120);
    } else if (preset === 'fast') {
      setMinIntervalSec(10);
      setMaxIntervalSec(20);
    }
  };


  const handleStart = () => {
    const config: Partial<AutoBotConfig> = {
      targetAgentId,
      totalRequests,
      minIntervalSec,
      maxIntervalSec,
      minAmount,
      maxAmount,
      requestType,
      selectedGateway
    };
    autoRequestBotService.startBot(config);
  };

  const handlePause = () => {
    autoRequestBotService.pauseBot();
  };

  const handleResume = () => {
    autoRequestBotService.resumeBot();
  };

  const handleStop = () => {
    autoRequestBotService.stopBot();
  };

  const handleReset = () => {
    autoRequestBotService.resetCounters();
  };

  const handleInstantDispatch = async () => {
    setIsInstantSending(true);
    try {
      await autoRequestBotService.dispatchSingle({
        targetAgentId,
        minAmount,
        maxAmount,
        requestType,
        selectedGateway
      });
      if (onRequestDispatched) onRequestDispatched();
    } finally {
      setIsInstantSending(false);
    }
  };

  const formatCountdown = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = Math.min(
    100, 
    botState.config.totalRequests > 0 
      ? Math.round((botState.sentCount / botState.config.totalRequests) * 100) 
      : 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#0f172e] border border-[#233763] rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-white">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#121e3d] border-b border-[#233763] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-950/40">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Automated Customer Request Bot
                </h3>
                {botState.status === 'running' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    LIVE DISPATCHING
                  </span>
                )}
                {botState.status === 'paused' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    PAUSED
                  </span>
                )}
                {botState.status === 'completed' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    QUOTA COMPLETED
                  </span>
                )}
                {botState.status === 'idle' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-500/20 text-slate-400 border border-slate-500/30">
                    IDLE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                Simulates organic Bangladeshi player deposit & cashout traffic with authentic profiles & TrxIDs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#1a294e] hover:bg-[#233763] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Live Progress Banner */}
          <div className="bg-[#14234b] border border-[#233763] rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200">Dispatch Progress:</span>
                <span className="font-mono font-black text-emerald-400">
                  {botState.sentCount} / {botState.config.totalRequests} Sent
                </span>
                <span className="text-slate-400">({progressPercent}%)</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span className="text-slate-300">Next Dispatch:</span>
                {botState.status === 'running' ? (
                  <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    ⏱️ {formatCountdown(botState.secondsUntilNext)}
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">
                    {botState.status === 'paused' ? 'Paused' : 'Waiting to start'}
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#0d162f] h-2.5 rounded-full overflow-hidden border border-[#233763]">
              <div 
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Target Agent Card */}
            <div className="bg-[#121e3d] border border-[#233763] rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Target Agent (Destination)</span>
              </label>
              <select
                value={targetAgentId}
                disabled={botState.status === 'running'}
                onChange={(e) => setTargetAgentId(e.target.value)}
                className="w-full bg-[#1a294e] border border-[#233763] rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 disabled:opacity-60 transition-colors"
              >
                <option value="all">🌟 All Active Agents (Round-Robin / Random)</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    👤 {ag.name} ({ag.id}) — {ag.phone}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                {targetAgentId === 'all' 
                  ? 'Requests will be randomly assigned to all authorized agents.' 
                  : 'Requests will be exclusively sent to this specific agent.'}
              </p>
            </div>

            {/* Total Requests Limit */}
            <div className="bg-[#121e3d] border border-[#233763] rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Total Requests Quota</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={totalRequests}
                  disabled={botState.status === 'running'}
                  onChange={(e) => setTotalRequests(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#1a294e] border border-[#233763] rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-sky-500 disabled:opacity-60 transition-colors"
                />
                <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Requests</span>
              </div>
              <p className="text-[11px] text-slate-400">
                The bot automatically shuts off once this quota is reached.
              </p>
            </div>

            {/* Dispatch Interval Preset */}
            <div className="bg-[#121e3d] border border-[#233763] rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Dispatch Interval (Timing)</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  disabled={botState.status === 'running'}
                  onClick={() => handlePresetChange('realistic')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                    intervalPreset === 'realistic'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'bg-[#1a294e] text-slate-300 hover:text-white'
                  }`}
                >
                  Realistic (1-2 Min)
                </button>
                <button
                  type="button"
                  disabled={botState.status === 'running'}
                  onClick={() => handlePresetChange('fast')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                    intervalPreset === 'fast'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-[#1a294e] text-slate-300 hover:text-white'
                  }`}
                >
                  Fast (10-20 Sec)
                </button>
                <button
                  type="button"
                  disabled={botState.status === 'running'}
                  onClick={() => handlePresetChange('custom')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                    intervalPreset === 'custom'
                      ? 'bg-sky-500 text-slate-950 shadow'
                      : 'bg-[#1a294e] text-slate-300 hover:text-white'
                  }`}
                >
                  Custom
                </button>
              </div>

              {intervalPreset === 'custom' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400">Min Seconds:</span>
                    <input
                      type="number"
                      min="5"
                      value={minIntervalSec}
                      disabled={botState.status === 'running'}
                      onChange={(e) => setMinIntervalSec(Math.max(5, parseInt(e.target.value) || 5))}
                      className="w-full bg-[#1a294e] border border-[#233763] rounded-lg px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Max Seconds:</span>
                    <input
                      type="number"
                      min={minIntervalSec}
                      value={maxIntervalSec}
                      disabled={botState.status === 'running'}
                      onChange={(e) => setMaxIntervalSec(Math.max(minIntervalSec, parseInt(e.target.value) || minIntervalSec))}
                      className="w-full bg-[#1a294e] border border-[#233763] rounded-lg px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}
              <p className="text-[11px] text-slate-400">
                Randomized interval between {minIntervalSec}s and {maxIntervalSec}s per dispatch.
              </p>
            </div>

            {/* Amount Range (BDT) */}
            <div className="bg-[#121e3d] border border-[#233763] rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Amount Range (৳ BDT)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400">Min Amount (৳):</span>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={minAmount}
                    disabled={botState.status === 'running'}
                    onChange={(e) => setMinAmount(Math.max(100, parseInt(e.target.value) || 100))}
                    className="w-full bg-[#1a294e] border border-[#233763] rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Max Amount (৳):</span>
                  <input
                    type="number"
                    min={minAmount}
                    step="500"
                    value={maxAmount}
                    disabled={botState.status === 'running'}
                    onChange={(e) => setMaxAmount(Math.max(minAmount, parseInt(e.target.value) || minAmount))}
                    className="w-full bg-[#1a294e] border border-[#233763] rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Generates natural rounded sums within ৳{minAmount.toLocaleString()} - ৳{maxAmount.toLocaleString()} BDT.
              </p>
            </div>

            {/* Request Type Selection */}
            <div className="bg-[#121e3d] border border-[#233763] rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-slate-300">Request Type Distribution</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  disabled={botState.status === 'running'}
                  onClick={() => setRequestType('random')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                    requestType === 'random'
                      ? 'bg-purple-500 text-white shadow'
                      : 'bg-[#1a294e] text-slate-300 hover:text-white'
                  }`}
                >
                  🎲 50/50 Random
                </button>
                <button
                  type="button"
                  disabled={botState.status === 'running'}
                  onClick={() => setRequestType('deposit')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                    requestType === 'deposit'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'bg-[#1a294e] text-slate-300 hover:text-white'
                  }`}
                >
                  Deposit Only
                </button>
                <button
                  type="button"
                  disabled={botState.status === 'running'}
                  onClick={() => setRequestType('withdrawal')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                    requestType === 'withdrawal'
                      ? 'bg-sky-500 text-slate-950 shadow'
                      : 'bg-[#1a294e] text-slate-300 hover:text-white'
                  }`}
                >
                  Withdraw Only
                </button>
              </div>
            </div>

            {/* Dedicated Gateway Selector */}
            <div className="bg-[#121e3d] border border-[#233763] rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Payment Gateway (Channel)</label>
                <span className="text-[10px] text-amber-400 font-mono">
                  {selectedGateway === 'Rocket' ? '🔢 Rocket: Strictly Numbers Only TrxID' : 'Select Target Gateway'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { key: 'bKash', label: 'bKash', color: 'border-pink-500 bg-pink-500/15 text-pink-300', dot: 'bg-pink-500' },
                  { key: 'Nagad', label: 'Nagad', color: 'border-orange-500 bg-orange-500/15 text-orange-300', dot: 'bg-orange-500' },
                  { key: 'Rocket', label: 'Rocket (DBBL)', color: 'border-purple-500 bg-purple-500/15 text-purple-300', dot: 'bg-purple-500', note: '100% Numbers Only' },
                  { key: 'Upay', label: 'Upay', color: 'border-cyan-500 bg-cyan-500/15 text-cyan-300', dot: 'bg-cyan-500' },
                  { key: 'random', label: '🎲 Mix All', color: 'border-emerald-500 bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-500' }
                ].map((g) => {
                  const isSelected = selectedGateway === g.key;
                  return (
                    <button
                      key={g.key}
                      type="button"
                      disabled={botState.status === 'running'}
                      onClick={() => setSelectedGateway(g.key as any)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                        isSelected
                          ? `${g.color} shadow-lg ring-1 ring-white/30 font-black scale-[1.02]`
                          : 'bg-[#1a294e] border-[#233763] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? g.dot : 'bg-slate-500'}`} />
                        <span>{g.label}</span>
                      </div>
                      {g.note && (
                        <span className="text-[9px] text-purple-300 font-mono font-medium">
                          {g.note}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400">
                {selectedGateway === 'Rocket'
                  ? 'Selected: Rocket. Transaction IDs will be 100% numeric (10 digits, e.g. 4819204812) without any letters.'
                  : selectedGateway === 'random'
                  ? 'Selected: Random Gateway Mix across bKash, Nagad, Rocket, and Upay.'
                  : `Selected: ${selectedGateway}. All generated requests will be exclusively processed through ${selectedGateway}.`}
              </p>
            </div>

          </div>

          {/* Realistic Users Pool Badge */}
          <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-white">300 Organic Player Profiles Active:</strong> Real Bangladeshi names & natural usernames with <strong>0 underscores</strong> and valid BD mobile numbers.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold shrink-0">
              300 Users Loaded
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              {botState.status === 'running' ? (
                <button
                  type="button"
                  onClick={handlePause}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/40 flex items-center gap-2 transition-all"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause Bot</span>
                </button>
              ) : botState.status === 'paused' ? (
                <button
                  type="button"
                  onClick={handleResume}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all"
                >
                  <Play className="w-4 h-4" />
                  <span>Resume Bot</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStart}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Auto Bot ({totalRequests} Requests)</span>
                </button>
              )}

              {(botState.status === 'running' || botState.status === 'paused' || botState.status === 'completed') && (
                <button
                  type="button"
                  onClick={handleStop}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2.5 rounded-xl bg-[#1a294e] hover:bg-[#233763] text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Reset sent counter and logs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Count</span>
              </button>
            </div>

            {/* Instant Dispatch Button */}
            <button
              type="button"
              disabled={isInstantSending}
              onClick={handleInstantDispatch}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-sky-950/40 flex items-center gap-2 transition-all disabled:opacity-60"
            >
              <Zap className={`w-4 h-4 ${isInstantSending ? 'animate-bounce' : ''}`} />
              <span>{isInstantSending ? 'Dispatching...' : '⚡ Dispatch 1 Request Now'}</span>
            </button>
          </div>

          {/* Live Dispatch Logs Feed */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Dispatched Traffic Feed ({botState.logs.length})</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                Latest 100 entries
              </span>
            </div>

            {botState.logs.length === 0 ? (
              <div className="text-center py-8 bg-[#121e3d] border border-[#233763] rounded-2xl text-slate-400">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-400" />
                <p className="text-xs font-bold text-white">No requests dispatched in this session yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click "Start Auto Bot" or "Dispatch 1 Request Now" to begin simulating requests.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {botState.logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-[#121e3d] border border-[#233763] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-[#35508a] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                        log.type === 'deposit'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      }`}>
                        {log.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-white">{log.requestCode}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                            log.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'
                          }`}>
                            {log.type}
                          </span>
                          <span className="text-slate-400 text-[11px]">{log.paymentMethod}</span>
                          <span className="font-mono text-slate-400 text-[10px]">TrxID: {log.trxId}</span>
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white">{log.customerName}</span>
                          <span className="text-slate-400 font-mono">(@{log.customerUsername})</span>
                          <span className="text-slate-400 font-mono">{log.customerPhone}</span>
                          <span className="text-emerald-400">→</span>
                          <span className="text-amber-300 font-medium">Target: {log.agentName} ({log.agentCode})</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-emerald-400 text-sm">
                        ৳{log.amount.toLocaleString()} BDT
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {log.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#121e3d] border-t border-[#233763] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Runs in background • Direct Supabase sync • Triggers Agent Realtime alerts</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#1a294e] hover:bg-[#233763] text-white font-bold transition-colors"
          >
            Close / Minimize
          </button>
        </div>

      </div>
    </div>
  );
};
