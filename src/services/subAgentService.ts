import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { SubAgent } from '../types';

export const subAgentService = {
  // Fetch Sub-Agents under a Master Agent code from Supabase
  async getSubAgents(parentAgentCode: string = 'AG-55353'): Promise<SubAgent[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const cleanCode = parentAgentCode.trim();
      const { data, error } = await supabase
        .from('sub_agents')
        .select('*')
        .or(`parent_agent_code.eq.${cleanCode},parent_agent_code.ilike.${cleanCode}`)
        .order('joined_date', { ascending: false });

      if (error) {
        console.error('Error fetching sub_agents from Supabase:', error);
        return [];
      }

      if (data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.sub_code || row.id,
          name: row.name || 'Sub-Agent Partner',
          mobile: row.mobile || '',
          email: row.email || '',
          status: (row.status as any) || 'active',
          todayVolume: parseFloat(row.today_volume?.toString() || '0') || 0,
          totalVolume: parseFloat(row.total_volume?.toString() || '0') || 0,
          commissionEarned: parseFloat(row.commission_earned?.toString() || '0') || 0,
          joinedDate: row.joined_date || row.created_at?.substring(0, 10) || new Date().toISOString().substring(0, 10),
          directReferrals: parseInt(row.direct_referrals?.toString() || '0', 10) || 0,
          location: row.location || 'Regional Hub'
        }));
      }

      return [];
    } catch (err) {
      console.error('Failed to load sub-agents:', err);
      return [];
    }
  },

  // Insert a newly invited Sub-Agent into Supabase
  async createSubAgent(
    parentAgentCode: string,
    data: { name: string; email: string; mobile: string; location: string }
  ): Promise<SubAgent> {
    const subCode = 'SUB-' + Math.floor(10000 + Math.random() * 90000);
    const joinedDate = new Date().toISOString().split('T')[0];

    const newSubAgent: SubAgent = {
      id: subCode,
      name: data.name.trim(),
      email: data.email.trim(),
      mobile: data.mobile.trim(),
      location: data.location.trim() || 'Regional Hub',
      status: 'pending',
      todayVolume: 0,
      totalVolume: 0,
      commissionEarned: 0,
      joinedDate,
      directReferrals: 0
    };

    if (isSupabaseConfigured()) {
      try {
        const { data: dbRow, error } = await supabase
          .from('sub_agents')
          .insert({
            parent_agent_code: parentAgentCode,
            sub_code: subCode,
            name: newSubAgent.name,
            email: newSubAgent.email,
            mobile: newSubAgent.mobile,
            location: newSubAgent.location,
            status: 'pending',
            today_volume: 0,
            total_volume: 0,
            commission_earned: 0,
            direct_referrals: 0,
            joined_date: joinedDate
          })
          .select('*')
          .single();

        if (error) {
          console.error('Error inserting sub_agent to Supabase:', error);
        } else if (dbRow) {
          newSubAgent.id = dbRow.sub_code || dbRow.id;
        }
      } catch (err) {
        console.error('Failed to insert sub_agent to Supabase:', err);
      }
    }

    return newSubAgent;
  }
};
