export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_user_id: string | null;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          role: 'admin' | 'agent' | 'sub_agent';
          status: 'pending' | 'active' | 'suspended' | 'blocked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          full_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'agent' | 'sub_agent';
          status?: 'pending' | 'active' | 'suspended' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          full_name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'agent' | 'sub_agent';
          status?: 'pending' | 'active' | 'suspended' | 'blocked';
          updated_at?: string;
        };
      };
      agents: {
        Row: {
          id: string;
          profile_id: string;
          agent_code: string;
          balance: number;
          pending_balance: number;
          total_deposit: number;
          total_withdrawal: number;
          total_commission: number;
          commission_rate: number;
          verification_status: 'pending' | 'under_review' | 'verified' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          agent_code: string;
          balance?: number;
          pending_balance?: number;
          total_deposit?: number;
          total_withdrawal?: number;
          total_commission?: number;
          commission_rate?: number;
          verification_status?: 'pending' | 'under_review' | 'verified' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          agent_code?: string;
          balance?: number;
          pending_balance?: number;
          total_deposit?: number;
          total_withdrawal?: number;
          total_commission?: number;
          commission_rate?: number;
          verification_status?: 'pending' | 'under_review' | 'verified' | 'rejected';
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          agent_id: string;
          customer_code: string;
          full_name: string;
          phone: string;
          status: 'active' | 'inactive' | 'pending_verification';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          customer_code: string;
          full_name: string;
          phone: string;
          status?: 'active' | 'inactive' | 'pending_verification';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          customer_code?: string;
          full_name?: string;
          phone?: string;
          status?: 'active' | 'inactive' | 'pending_verification';
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          transaction_code: string;
          agent_id: string;
          customer_id: string | null;
          type: 'deposit' | 'withdrawal' | 'commission' | 'fund_transfer' | 'adjustment';
          amount: number;
          fee: number;
          commission: number;
          payment_method: string;
          reference: string;
          status: 'pending' | 'processing' | 'approved' | 'completed' | 'rejected' | 'cancelled';
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          transaction_code: string;
          agent_id: string;
          customer_id?: string | null;
          type: 'deposit' | 'withdrawal' | 'commission' | 'fund_transfer' | 'adjustment';
          amount: number;
          fee?: number;
          commission?: number;
          payment_method: string;
          reference: string;
          status?: 'pending' | 'processing' | 'approved' | 'completed' | 'rejected' | 'cancelled';
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          transaction_code?: string;
          agent_id?: string;
          customer_id?: string | null;
          type?: 'deposit' | 'withdrawal' | 'commission' | 'fund_transfer' | 'adjustment';
          amount?: number;
          fee?: number;
          commission?: number;
          payment_method?: string;
          reference?: string;
          status?: 'pending' | 'processing' | 'approved' | 'completed' | 'rejected' | 'cancelled';
          note?: string | null;
          updated_at?: string;
        };
      };
      wallet_transactions: {
        Row: {
          id: string;
          agent_id: string;
          transaction_id: string | null;
          type: string;
          amount: number;
          balance_before: number;
          balance_after: number;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          transaction_id?: string | null;
          type: string;
          amount: number;
          balance_before: number;
          balance_after: number;
          description: string;
          created_at?: string;
        };
      };
      commission_transactions: {
        Row: {
          id: string;
          agent_id: string;
          transaction_id: string | null;
          rate: number;
          transaction_amount: number;
          commission_amount: number;
          status: 'credited' | 'pending' | 'paid';
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          transaction_id?: string | null;
          rate: number;
          transaction_amount: number;
          commission_amount: number;
          status?: 'credited' | 'pending' | 'paid';
          created_at?: string;
        };
      };
      deposit_requests: {
        Row: {
          id: string;
          request_code: string;
          agent_id: string;
          customer_id: string;
          amount: number;
          payment_method: string;
          reference: string;
          status: 'pending' | 'processing' | 'approved' | 'completed' | 'rejected' | 'cancelled';
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_code: string;
          agent_id: string;
          customer_id: string;
          amount: number;
          payment_method: string;
          reference: string;
          status?: 'pending' | 'processing' | 'approved' | 'completed' | 'rejected' | 'cancelled';
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          status?: 'pending' | 'processing' | 'approved' | 'completed' | 'rejected' | 'cancelled';
          note?: string | null;
          updated_at?: string;
        };
      };
      withdrawal_requests: {
        Row: {
          id: string;
          request_code: string;
          agent_id: string;
          customer_id: string;
          amount: number;
          payment_method: string;
          account_number: string;
          reference: string;
          status: 'pending' | 'processing' | 'approved' | 'completed' | 'rejected' | 'cancelled';
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_code: string;
          agent_id: string;
          customer_id: string;
          amount: number;
          payment_method: string;
          account_number: string;
          reference: string;
          status?: 'pending' | 'processing' | 'approved' | 'completed' | 'rejected' | 'cancelled';
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          status?: 'pending' | 'processing' | 'approved' | 'completed' | 'rejected' | 'cancelled';
          note?: string | null;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'transaction' | 'security' | 'commission' | 'system';
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: 'transaction' | 'security' | 'commission' | 'system';
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
      };
      support_tickets: {
        Row: {
          id: string;
          ticket_code: string;
          user_id: string;
          subject: string;
          category: string;
          message: string;
          status: 'open' | 'in_progress' | 'resolved';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_code: string;
          user_id: string;
          subject: string;
          category: string;
          message: string;
          status?: 'open' | 'in_progress' | 'resolved';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'open' | 'in_progress' | 'resolved';
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      submit_deposit_request: {
        Args: {
          p_customer_id: string;
          p_amount: number;
          p_payment_method: string;
          p_reference: string;
          p_note?: string;
        };
        Returns: Json;
      };
      approve_deposit_request: {
        Args: {
          p_request_id: string;
          p_admin_note?: string;
        };
        Returns: Json;
      };
      submit_withdrawal_request: {
        Args: {
          p_customer_id: string;
          p_amount: number;
          p_payment_method: string;
          p_account_number: string;
          p_reference: string;
          p_note?: string;
        };
        Returns: Json;
      };
      process_withdrawal_request: {
        Args: {
          p_request_id: string;
          p_status: string;
          p_admin_note?: string;
        };
        Returns: Json;
      };
      claim_commission_to_wallet: {
        Args: {
          p_amount: number;
        };
        Returns: Json;
      };
      add_agent_funds: {
        Args: {
          p_amount: number;
          p_payment_method: string;
          p_reference: string;
        };
        Returns: Json;
      };
      get_agent_dashboard_metrics: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };
  };
}
