import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Check if user is admin
async function isAdmin(userId: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single() as { data: { email: string } | null };
    
  return profile?.email === adminEmail;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!(await isAdmin(user.id))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all stats in parallel
    const [
      userStats,
      sessionStats,
      reportStats,
      subscriptionStats
    ] = await Promise.all([
      // User stats
      supabase
        .from('profiles')
        .select('id, created_at')
        .then(({ data, count }) => ({ 
          total: count || data?.length || 0,
          // Users active in last 7 days (simplified - based on creation)
          active: data?.filter((u: { created_at: string }) => 
            new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length || 0
        })),

      // Session stats  
      supabase
        .from('sessions')
        .select('status')
        .then(({ data }) => {
          const stats = {
            total: data?.length || 0,
            completed: data?.filter((s: { status: string }) => s.status === 'completed').length || 0,
            waiting: data?.filter((s: { status: string }) => s.status === 'waiting').length || 0,
          };
          return stats;
        }),

      // Report stats
      supabase
        .from('reports')
        .select('status')
        .eq('status', 'pending')
        .then(({ count }) => ({ pending: count || 0 })),

      // Subscription stats
      supabase
        .from('profiles')
        .select('subscription_status')
        .then(({ data }) => ({
          trial: data?.filter((p: { subscription_status: string }) => p.subscription_status === 'trial').length || 0,
          paid: data?.filter((p: { subscription_status: string }) => p.subscription_status === 'active').length || 0,
        }))
    ]);

    const stats = {
      totalUsers: userStats.total,
      activeUsers: userStats.active,
      totalSessions: sessionStats.total,
      completedSessions: sessionStats.completed,
      waitingSessions: sessionStats.waiting,
      pendingReports: reportStats.pending,
      trialUsers: subscriptionStats.trial,
      paidUsers: subscriptionStats.paid,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}