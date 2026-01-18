import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://yvlxhcvvwxvfakguldlp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function verifySupabaseToken(token: string | undefined): Promise<{ valid: boolean; userId?: string; error?: string }> {
  if (!token) {
    return { valid: false, error: 'No authorization token provided' };
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token.replace('Bearer ', ''));
    
    if (error || !user) {
      return { valid: false, error: error?.message || 'Invalid token' };
    }

    return { valid: true, userId: user.id };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Token verification failed' };
  }
}

export async function createAnonymousSession(): Promise<{ sessionId: string; userId: string }> {
  const userId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  return { sessionId, userId };
}
