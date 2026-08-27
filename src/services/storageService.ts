import { supabase, isSupabaseConfigured } from '../lib/supabase/client';

export const storageService = {
  // 1. Upload KYC Document to Private Bucket ('kyc_documents')
  async uploadKycDocument(file: File, agentId: string): Promise<{ path: string | null; url: string | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
      const mockUrl = URL.createObjectURL(file);
      return { path: 'local-mock/' + file.name, url: mockUrl, error: null };
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${agentId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('kyc_documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) return { path: null, url: null, error: error.message };

      const { url } = await this.getKycDocumentSignedUrl(data.path);
      return { path: data.path, url: url || data.path, error: null };
    } catch (err: any) {
      return { path: null, url: null, error: err.message || 'KYC document upload failed.' };
    }
  },

  // 2. Upload Deposit Voucher / Receipt Proof ('deposit_receipts')
  async uploadDepositReceipt(file: File, agentId: string): Promise<{ path: string | null; publicUrl: string | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
      const mockUrl = URL.createObjectURL(file);
      return { path: 'local-mock-receipt/' + file.name, publicUrl: mockUrl, error: null };
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${agentId}/receipt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('deposit_receipts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) return { path: null, publicUrl: null, error: error.message };

      const publicUrl = this.getPublicUrl('deposit_receipts', data.path);
      return { path: data.path, publicUrl, error: null };
    } catch (err: any) {
      return { path: null, publicUrl: null, error: err.message || 'Deposit receipt upload failed.' };
    }
  },

  // 3. Upload User Profile Avatar ('avatars')
  async uploadAvatar(file: File, userId: string): Promise<{ path: string | null; publicUrl: string | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
      const mockUrl = URL.createObjectURL(file);
      return { path: 'local-mock-avatar/' + file.name, publicUrl: mockUrl, error: null };
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) return { path: null, publicUrl: null, error: error.message };

      const publicUrl = this.getPublicUrl('avatars', data.path);
      return { path: data.path, publicUrl, error: null };
    } catch (err: any) {
      return { path: null, publicUrl: null, error: err.message || 'Avatar image upload failed.' };
    }
  },

  // 4. Generate Temporary Signed URL for Private KYC Document Access
  async getKycDocumentSignedUrl(path: string, expiresInSeconds: number = 3600): Promise<{ url: string | null; error: string | null }> {
    if (!isSupabaseConfigured() || path.startsWith('local-mock')) {
      return { url: path, error: null };
    }

    try {
      const { data, error } = await supabase.storage
        .from('kyc_documents')
        .createSignedUrl(path, expiresInSeconds);

      if (error) return { url: null, error: error.message };
      return { url: data?.signedUrl || null, error: null };
    } catch (err: any) {
      return { url: null, error: err.message || 'Failed to generate signed document URL.' };
    }
  },

  // 5. Get Public URL for Public Buckets
  getPublicUrl(bucket: string, path: string): string {
    if (!isSupabaseConfigured() || path.startsWith('local-mock')) {
      return path;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
};
