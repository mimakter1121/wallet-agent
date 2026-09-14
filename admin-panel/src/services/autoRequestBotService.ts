import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_USERS_POOL, MockUserProfile } from '../data/mockUsersPool';
import { Agent } from '../types';

export interface AutoBotConfig {
  targetAgentId: string; // 'all' or specific agentId/agent_code
  totalRequests: number; // e.g. 10
  minIntervalSec: number; // default 60 (1 min)
  maxIntervalSec: number; // default 120 (2 min)
  minAmount: number; // default 500
  maxAmount: number; // default 25000
  requestType: 'random' | 'deposit' | 'withdrawal'; // default 'random'
  selectedGateway: 'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'random'; // explicit user-selected gateway
  allowedMethods?: string[]; // ['bKash', 'Nagad', 'Rocket', 'Upay']
}

export interface AutoBotLog {
  id: string;
  timestamp: string;
  type: 'deposit' | 'withdrawal';
  requestCode: string;
  customerName: string;
  customerUsername: string;
  customerPhone: string;
  amount: number;
  paymentMethod: string;
  trxId: string;
  agentCode: string;
  agentName: string;
  status: 'pending';
}

export interface AutoBotState {
  status: 'idle' | 'running' | 'paused' | 'completed';
  config: AutoBotConfig;
  sentCount: number;
  remainingCount: number;
  secondsUntilNext: number;
  nextRunTimestamp: number | null;
  logs: AutoBotLog[];
  lastDispatched: AutoBotLog | null;
}

const DEFAULT_CONFIG: AutoBotConfig = {
  targetAgentId: 'all',
  totalRequests: 10,
  minIntervalSec: 60,  // 1 minute
  maxIntervalSec: 120, // 2 minutes
  minAmount: 500,
  maxAmount: 25000,
  requestType: 'random',
  selectedGateway: 'bKash',
  allowedMethods: ['bKash', 'Nagad', 'Rocket', 'Upay']
};

class AutoRequestBotService {
  private state: AutoBotState = {
    status: 'idle',
    config: { ...DEFAULT_CONFIG },
    sentCount: 0,
    remainingCount: DEFAULT_CONFIG.totalRequests,
    secondsUntilNext: 0,
    nextRunTimestamp: null,
    logs: [],
    lastDispatched: null
  };

  private listeners: Array<(state: AutoBotState) => void> = [];
  private tickerTimer: any = null;
  private knownAgents: Agent[] = [];

  constructor() {
    this.loadStateFromStorage();
  }

  public setKnownAgents(agents: Agent[]) {
    this.knownAgents = agents;
  }

  public getState(): AutoBotState {
    return { ...this.state, config: { ...this.state.config }, logs: [...this.state.logs] };
  }

  public updateConfig(partial: Partial<AutoBotConfig>) {
    this.state.config = { ...this.state.config, ...partial };
    if (partial.totalRequests !== undefined) {
      this.state.remainingCount = Math.max(0, this.state.config.totalRequests - this.state.sentCount);
    }
    this.notify();
  }

  public subscribe(listener: (state: AutoBotState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach(l => l(currentState));
    this.saveStateToStorage();
  }

  private saveStateToStorage() {
    try {
      const serialized = {
        status: this.state.status === 'running' ? 'paused' : this.state.status,
        config: this.state.config,
        sentCount: this.state.sentCount,
        remainingCount: this.state.remainingCount,
        logs: this.state.logs.slice(0, 50)
      };
      localStorage.setItem('wa_auto_request_bot_state', JSON.stringify(serialized));
    } catch (e) {
      // ignore storage error
    }
  }

  private loadStateFromStorage() {
    try {
      const saved = localStorage.getItem('wa_auto_request_bot_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = {
          ...this.state,
          config: { ...DEFAULT_CONFIG, ...(parsed.config || {}) },
          status: parsed.status === 'running' ? 'paused' : (parsed.status || 'idle'),
          sentCount: parsed.sentCount || 0,
          remainingCount: parsed.remainingCount ?? DEFAULT_CONFIG.totalRequests,
          logs: parsed.logs || []
        };
      }
    } catch (e) {
      // ignore
    }
  }

  // Generate realistic Transaction ID (TrxID)
  public generateTrxId(method: string): string {
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const randChars = (len: number) => {
      let res = '';
      for (let i = 0; i < len; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return res;
    };

    const digits = (len: number) => {
      let res = '';
      for (let i = 0; i < len; i++) {
        res += Math.floor(Math.random() * 10).toString();
      }
      return res;
    };

    const m = (method || '').toLowerCase();
    if (m.includes('rocket')) {
      // Rocket transaction ID is strictly digits only (e.g. 10 numeric digits: 3849102839)
      const firstDigit = Math.floor(1 + Math.random() * 9).toString();
      return `${firstDigit}${digits(9)}`;
    } else if (m.includes('bkash')) {
      return `BK${digits(8)}`;
    } else if (m.includes('nagad')) {
      return `N${digits(9)}`;
    } else if (m.includes('upay')) {
      return `UP${digits(8)}`;
    } else {
      return randChars(10);
    }
  }

  // Generate realistic Bangladeshi random amount within range
  public generateAmount(min: number, max: number): number {
    const safeMin = Math.max(100, min || 500);
    const safeMax = Math.max(safeMin, max || 25000);
    const raw = safeMin + Math.random() * (safeMax - safeMin);

    if (raw < 2000) {
      // round to nearest 50
      return Math.round(raw / 50) * 50;
    } else if (raw < 10000) {
      // round to nearest 100
      return Math.round(raw / 100) * 100;
    } else {
      // round to nearest 500
      return Math.round(raw / 500) * 500;
    }
  }

  // Pick a random user from the 300 demo users pool
  public getRandomDemoUser(): MockUserProfile {
    const idx = Math.floor(Math.random() * MOCK_USERS_POOL.length);
    return MOCK_USERS_POOL[idx];
  }

  // Resolve target agent UUID & Code
  private async resolveTargetAgent(targetId: string): Promise<{ agentUuid: string | null; agentCode: string; agentName: string }> {
    let targetCode = targetId;
    let targetName = 'General Agent';
    let targetUuid: string | null = null;

    if (!targetCode || targetCode === 'all') {
      // Pick random agent from known agents
      if (this.knownAgents && this.knownAgents.length > 0) {
        const randAg = this.knownAgents[Math.floor(Math.random() * this.knownAgents.length)];
        targetCode = randAg.id;
        targetName = randAg.name;
      }
    } else {
      const found = this.knownAgents.find(a => a.id === targetId || (a as any).dbId === targetId);
      if (found) {
        targetCode = found.id;
        targetName = found.name;
      }
    }

    if (isSupabaseConfigured() && targetCode && targetCode !== 'all') {
      try {
        const { data } = await supabase
          .from('agents')
          .select('id, agent_code, profiles:profile_id(full_name)')
          .or(`agent_code.eq.${targetCode},id.eq.${targetCode}`)
          .maybeSingle();

        if (data) {
          targetUuid = data.id;
          targetCode = data.agent_code || targetCode;
          targetName = (data as any)?.profiles?.full_name || targetName;
        }
      } catch (e) {
        // fallback
      }
    }

    return { agentUuid: targetUuid, agentCode: targetCode || 'AG-SYSTEM', agentName: targetName };
  }

  // Dispatch single request immediately
  public async dispatchSingle(customConfig?: Partial<AutoBotConfig>): Promise<AutoBotLog | null> {
    const config = { ...this.state.config, ...(customConfig || {}) };
    const user = this.getRandomDemoUser();

    // Determine type: deposit or withdrawal
    let type: 'deposit' | 'withdrawal' = 'deposit';
    if (config.requestType === 'deposit') {
      type = 'deposit';
    } else if (config.requestType === 'withdrawal') {
      type = 'withdrawal';
    } else {
      type = Math.random() > 0.5 ? 'deposit' : 'withdrawal';
    }

    // Determine payment method - explicit user choice
    let method = 'bKash';
    if (config.selectedGateway && config.selectedGateway !== 'random') {
      method = config.selectedGateway;
    } else if (config.allowedMethods && config.allowedMethods.length > 0) {
      method = config.allowedMethods[Math.floor(Math.random() * config.allowedMethods.length)];
    } else {
      method = 'bKash';
    }

    const amount = this.generateAmount(config.minAmount, config.maxAmount);
    const trxId = this.generateTrxId(method);
    const requestCode = (type === 'deposit' ? 'DEP-' : 'WTH-') + Math.floor(10000 + Math.random() * 90000);

    const { agentUuid, agentCode, agentName } = await this.resolveTargetAgent(config.targetAgentId);

    // Save to Supabase
    if (isSupabaseConfigured()) {
      try {
        if (type === 'deposit') {
          await supabase.from('deposit_requests').insert({
            request_code: requestCode,
            agent_id: agentUuid,
            agent_code: agentCode,
            agent_name: agentName,
            customer_name: user.name,
            customer_phone: user.phone,
            amount: amount,
            payment_method: method,
            sender_number: user.phone,
            transaction_ref: trxId,
            status: 'pending'
          });
        } else {
          await supabase.from('withdrawal_requests').insert({
            request_code: requestCode,
            agent_id: agentUuid,
            agent_code: agentCode,
            agent_name: agentName,
            customer_name: user.name,
            customer_phone: user.phone,
            amount: amount,
            payment_method: method,
            account_number: user.phone,
            recipient_account: user.phone,
            reference: trxId,
            status: 'pending'
          });
        }
      } catch (err) {
        console.error('Failed to insert auto request to Supabase:', err);
      }
    }

    const logEntry: AutoBotLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      requestCode,
      customerName: user.name,
      customerUsername: user.username,
      customerPhone: user.phone,
      amount,
      paymentMethod: method,
      trxId,
      agentCode,
      agentName,
      status: 'pending'
    };

    const newSentCount = this.state.sentCount + 1;
    const newRemaining = Math.max(0, config.totalRequests - newSentCount);

    this.state.sentCount = newSentCount;
    this.state.remainingCount = newRemaining;
    this.state.logs = [logEntry, ...this.state.logs].slice(0, 100);
    this.state.lastDispatched = logEntry;

    // Check if limit reached
    if (newSentCount >= config.totalRequests) {
      this.stopBot();
      this.state.status = 'completed';
    } else if (this.state.status === 'running') {
      this.scheduleNextRun();
    }

    this.notify();
    return logEntry;
  }

  // Calculate random seconds between min and max
  private getRandomInterval(): number {
    const min = Math.max(5, this.state.config.minIntervalSec || 60);
    const max = Math.max(min, this.state.config.maxIntervalSec || 120);
    return Math.floor(min + Math.random() * (max - min + 1));
  }

  // Schedule the next automated run
  private scheduleNextRun() {
    const intervalSec = this.getRandomInterval();
    this.state.secondsUntilNext = intervalSec;
    this.state.nextRunTimestamp = Date.now() + (intervalSec * 1000);
  }

  // Start or resume the bot
  public startBot(config?: Partial<AutoBotConfig>) {
    if (config) {
      this.state.config = { ...this.state.config, ...config };
      if (config.totalRequests !== undefined) {
        this.state.remainingCount = Math.max(0, config.totalRequests - this.state.sentCount);
      }
    }

    if (this.state.sentCount >= this.state.config.totalRequests) {
      this.state.sentCount = 0;
      this.state.remainingCount = this.state.config.totalRequests;
    }

    this.state.status = 'running';
    this.scheduleNextRun();
    this.startTicker();
    this.notify();
  }

  // Pause the bot
  public pauseBot() {
    this.state.status = 'paused';
    this.state.nextRunTimestamp = null;
    this.stopTicker();
    this.notify();
  }

  // Resume paused bot
  public resumeBot() {
    if (this.state.sentCount >= this.state.config.totalRequests) {
      this.state.sentCount = 0;
      this.state.remainingCount = this.state.config.totalRequests;
    }
    this.state.status = 'running';
    this.scheduleNextRun();
    this.startTicker();
    this.notify();
  }

  // Stop and reset the bot
  public stopBot() {
    this.state.status = 'idle';
    this.state.secondsUntilNext = 0;
    this.state.nextRunTimestamp = null;
    this.stopTicker();
    this.notify();
  }

  // Reset counters
  public resetCounters() {
    this.state.sentCount = 0;
    this.state.remainingCount = this.state.config.totalRequests;
    this.state.logs = [];
    this.state.lastDispatched = null;
    this.notify();
  }

  // Active 1-second ticker loop
  private startTicker() {
    if (this.tickerTimer) clearInterval(this.tickerTimer);

    this.tickerTimer = setInterval(() => {
      if (this.state.status !== 'running') {
        this.stopTicker();
        return;
      }

      if (this.state.nextRunTimestamp) {
        const remainingMs = this.state.nextRunTimestamp - Date.now();
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        this.state.secondsUntilNext = remainingSec;

        if (remainingSec <= 0) {
          // Trigger dispatch!
          this.dispatchSingle();
        } else {
          // Notify second tick for countdown update
          this.notify();
        }
      }
    }, 1000);
  }

  private stopTicker() {
    if (this.tickerTimer) {
      clearInterval(this.tickerTimer);
      this.tickerTimer = null;
    }
  }
}

export const autoRequestBotService = new AutoRequestBotService();
