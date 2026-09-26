import { supabase, isSupabaseConfigured } from '../lib/supabase/client';

export interface DashboardMetrics {
  balance: number;
  pending_balance: number;
  total_commission: number;
  today_deposits: number;
  today_withdrawals: number;
  today_commission: number;
  active_customers_count: number;
  verification_status: string;
  agent_code: string;
}

export const agentService = {
  // Fetch Server-side Aggregated Dashboard Metrics
  async getDashboardMetrics(): Promise<{ data: DashboardMetrics | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: null };
    }

    try {
      const { data, error } = await (supabase.rpc as any)('get_agent_dashboard_metrics');
      if (error) {
        return { data: null, error: error.message };
      }
      return { data: data as DashboardMetrics, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to load dashboard statistics.' };
    }
  },

  // Request Add Liquidity Float (Submitted as PENDING for Admin clearance)
  async addFunds(
    amount: number, 
    paymentMethod: string, 
    reference: string,
    agentId?: string | null,
    agentName?: string
  ): Promise<{ data: any; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: { success: true, status: 'pending' }, error: null };
    }

    try {
      // 1. Resolve valid Agent UUID
      let targetAgentUuid: string | null = null;
      const isUuid = agentId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agentId);

      if (isUuid) {
        targetAgentUuid = agentId;
      } else if (agentId) {
        // Query agents table by agent_code (e.g. AG-97292)
        const { data: agByCode } = await supabase
          .from('agents')
          .select('id')
          .eq('agent_code', agentId)
          .maybeSingle();
        if (agByCode?.id) {
          targetAgentUuid = agByCode.id;
        }
      }

      // If still not resolved, get current authenticated user's agent record
      if (!targetAgentUuid) {
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser?.user?.id) {
          const { data: profData } = await supabase
            .from('profiles')
            .select('id, agents(id)')
            .eq('id', authUser.user.id)
            .maybeSingle();
          targetAgentUuid = (profData as any)?.agents?.[0]?.id || (profData as any)?.agents?.id || null;
        }
      }

      // If still not resolved, auto-create profile & agent record for this agent
      if (!targetAgentUuid) {
        const fallbackCode = (agentId && !isUuid) ? agentId : ('AG-' + Math.floor(10000 + Math.random() * 90000));
        const { data: profData } = await supabase
          .from('profiles')
          .insert({
            full_name: agentName || 'Liquidity Agent',
            email: `${fallbackCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@walletagent.com`,
            phone: '+8801700000000',
            role: 'agent',
            status: 'active'
          })
          .select('id')
          .single();

        if (profData?.id) {
          const { data: newAgData } = await supabase
            .from('agents')
            .insert({
              profile_id: profData.id,
              agent_code: fallbackCode,
              balance: 0,
              pending_balance: 0,
              total_deposit: 0,
              total_withdrawal: 0,
              total_commission: 0,
              verification_status: 'pending'
            })
            .select('id')
            .single();

          targetAgentUuid = newAgData?.id || null;
        }
      }

      if (!targetAgentUuid) {
        console.error('Cannot resolve agent UUID for topup request.');
        return { data: null, error: 'Could not resolve Agent account record in database.' };
      }

      // 2. Insert topup request transaction record into Supabase
      const txCode = 'TOPUP-' + Math.floor(100000 + Math.random() * 900000);
      const displayNote = `Agent Topup (${agentName || 'Liquidity Agent'})`;

      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert({
          transaction_code: txCode,
          agent_id: targetAgentUuid,
          type: 'fund_transfer',
          amount: amount,
          fee: 0,
          commission: 0,
          payment_method: paymentMethod,
          reference: reference,
          status: 'pending',
          note: displayNote
        })
        .select()
        .single();

      if (txError) {
        console.error('Error inserting top-up transaction into Supabase:', txError);
        return { data: null, error: txError.message };
      }

      // 3. Update agent's pending_balance in Supabase so it shows as pending
      try {
        const { data: curAgent } = await supabase.from('agents').select('pending_balance').eq('id', targetAgentUuid).maybeSingle();
        if (curAgent) {
          await supabase
            .from('agents')
            .update({
              pending_balance: (parseFloat(curAgent.pending_balance) || 0) + amount
            })
            .eq('id', targetAgentUuid);
        }
      } catch (e) {
        console.warn('Could not update pending_balance on agents record:', e);
      }

      console.log('Successfully submitted top-up request to Supabase:', txData);
      return { data: txData, error: null };
    } catch (err: any) {
      console.error('Exception submitting topup request:', err);
      return { data: null, error: err.message || 'Failed to submit topup request.' };
    }
  },

  // Request Settlement / Withdrawal of Float or Commission (Submitted as PENDING for Admin clearance)
  async withdrawFunds(
    amount: number,
    source: 'float' | 'commission',
    paymentMethod: string,
    destinationAddress: string,
    agentId?: string | null,
    agentName?: string,
    accountHolderName?: string
  ): Promise<{ data: any; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: { success: true, status: 'pending' }, error: null };
    }

    try {
      // 1. Resolve valid Agent UUID
      let targetAgentUuid: string | null = null;
      const isUuid = agentId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agentId);

      if (isUuid) {
        targetAgentUuid = agentId;
      } else if (agentId) {
        const { data: agByCode } = await supabase
          .from('agents')
          .select('id')
          .eq('agent_code', agentId)
          .maybeSingle();
        if (agByCode?.id) {
          targetAgentUuid = agByCode.id;
        }
      }

      if (!targetAgentUuid) {
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser?.user?.id) {
          const { data: profData } = await supabase
            .from('profiles')
            .select('id, agents(id)')
            .eq('id', authUser.user.id)
            .maybeSingle();
          targetAgentUuid = (profData as any)?.agents?.[0]?.id || (profData as any)?.agents?.id || null;
        }
      }

      if (!targetAgentUuid) {
        targetAgentUuid = 'e3f85535-3000-4000-8000-000000055353';
      }

      const txCode = 'WD-' + Math.floor(100000 + Math.random() * 900000);
      const displayNote = `Agent Settlement (${source === 'commission' ? 'Commission' : 'Float'}) -> ${paymentMethod}: ${destinationAddress}${accountHolderName ? ` (${accountHolderName})` : ''}`;

      // 2. Insert withdrawal transaction record into Supabase
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert({
          transaction_code: txCode,
          agent_id: targetAgentUuid,
          type: 'fund_transfer',
          amount: amount,
          fee: 0,
          commission: 0,
          payment_method: paymentMethod,
          reference: destinationAddress || ('REF-' + Date.now()),
          status: 'pending',
          note: displayNote,
          customer_name: agentName ? `${agentName} (Agent Settlement)` : 'Agent Settlement',
          customer_phone: destinationAddress || 'N/A'
        })
        .select()
        .single();

      if (txError) {
        console.error('Error inserting withdrawal transaction into Supabase:', txError);
        return { data: null, error: txError.message };
      }

      // 3. Update agent's balance or total_commission and pending_balance
      try {
        const { data: curAgent } = await supabase
          .from('agents')
          .select('balance, pending_balance, total_commission')
          .eq('id', targetAgentUuid)
          .maybeSingle();

        if (curAgent) {
          const curBal = parseFloat(curAgent.balance) || 0;
          const curPending = parseFloat(curAgent.pending_balance) || 0;
          const curComm = parseFloat(curAgent.total_commission) || 0;

          if (source === 'commission') {
            await supabase
              .from('agents')
              .update({
                total_commission: Math.max(0, curComm - amount),
                pending_balance: curPending + amount
              })
              .eq('id', targetAgentUuid);
          } else {
            await supabase
              .from('agents')
              .update({
                balance: Math.max(0, curBal - amount),
                pending_balance: curPending + amount
              })
              .eq('id', targetAgentUuid);
          }
        }
      } catch (e) {
        console.warn('Could not update balance on agents record:', e);
      }

      return { data: txData, error: null };
    } catch (err: any) {
      console.error('Exception submitting withdrawal request:', err);
      return { data: null, error: err.message || 'Failed to submit withdrawal request.' };
    }
  }
};
