// lib/api-utils/auth.ts
import { createClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';
import { User } from '@supabase/supabase-js';

export interface AuthContext {
  user: User;
  supabase: any;
}

export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  try {
    const supabase = await createClient();
    
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    return { user, supabase };
  } catch (error) {
    console.error('Auth context error:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const authContext = await getAuthContext(request);
  
  if (!authContext) {
    throw new Error('Authentication required');
  }
  
  return authContext;
}

export async function getOptionalAuth(request: NextRequest): Promise<AuthContext | null> {
  return await getAuthContext(request);
}