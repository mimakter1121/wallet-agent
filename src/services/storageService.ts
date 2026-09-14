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

  // Helper: Convert File to base64 Data URL
  fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // 3. Upload User Profile Avatar ('avatars') - Max 100 KB Limit
  async uploadAvatar(file: File, userId: string): Promise<{ path: string | null; publicUrl: string | null; error: string | null }> {
    const MAX_AVATAR_SIZE = 100 * 1024; // 100 KB = 102,400 bytes
    if (file.size > MAX_AVATAR_SIZE) {
      const sizeInKb = (file.size / 1024).toFixed(1);
      return {
        path: null,
        publicUrl: null,
        error: `File size is ${sizeInKb} KB. Profile picture cannot exceed 100 KB.`
      };
    }

    const cleanId = (userId || 'agent').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `${cleanId}_${Date.now()}.${fileExt}`;

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || 'image/jpeg'
          });

        if (!error && data?.path) {
          const publicUrl = this.getPublicUrl('avatars', data.path);
          return { path: data.path, publicUrl, error: null };
        }
      } catch (uploadErr) {
        console.warn('Supabase storage upload error, falling back to local data URL:', uploadErr);
      }
    }

    // Fallback: Convert to Base64 data URL so avatar change never fails
    try {
      const dataUrl = await this.fileToDataUrl(file);
      return { path: 'data-url/' + fileName, publicUrl: dataUrl, error: null };
    } catch (readErr: any) {
      return { path: null, publicUrl: null, error: readErr.message || 'Could not process image file.' };
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
