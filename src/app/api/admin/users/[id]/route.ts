import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const supabase = await createClient();
    
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

    if (!(await isAdmin(user.id))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const userId = id;

    // Get user profile with session stats
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        sessions_as_user1:sessions!sessions_user1_id_fkey(id, status, start_time),
        sessions_as_user2:sessions!sessions_user2_id_fkey(id, status, start_time),
        strikes(id, reason, created_at, expires_at),
        reports_made:reports!reports_reporter_id_fkey(id, reason, status, created_at),
        reports_received:reports!reports_reported_id_fkey(id, reason, status, created_at)
      `)
      .eq('id', userId)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate session stats
    const allSessions = [
      ...((profile as { sessions_as_user1?: unknown[] }).sessions_as_user1 || []),
      ...((profile as { sessions_as_user2?: unknown[] }).sessions_as_user2 || [])
    ];

    const stats = {
      totalSessions: allSessions.length,
      completedSessions: allSessions.filter((s: unknown) => (s as { status: string }).status === 'completed').length,
      cancelledSessions: allSessions.filter((s: unknown) => (s as { status: string }).status === 'cancelled').length,
      noShowSessions: allSessions.filter((s: unknown) => (s as { status: string }).status === 'no_show').length,
      upcomingSessions: allSessions.filter((s: unknown) => {
        const session = s as { status: string; start_time: string };
        return ['waiting', 'matched'].includes(session.status) && 
               new Date(session.start_time) > new Date();
      }).length,
    };

    return NextResponse.json({
      profile,
      stats,
    });
  } catch (error) {
    console.error('Admin get user API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const supabase = await createClient();
    
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

    if (!(await isAdmin(user.id))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const userId = id;
    const body = await request.json();
    const { action, reason, duration } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'ban':
        await (supabase as unknown as { from: (table: string) => { update: (data: unknown) => { eq: (column: string, value: string) => Promise<unknown> } } })
          .from('profiles')
          .update({ is_banned: true })
          .eq('id', userId);
        
        // Add strike record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('strikes').insert({
          user_id: userId,
          reason: reason || 'Banned by admin',
          issued_by: user.id,
        });
        break;

      case 'unban':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('profiles')
          .update({ is_banned: false })
          .eq('id', userId);
        break;

      case 'add_strike':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).rpc('increment_strike_count', { user_id: userId });
        
        const expiresAt = duration ? 
          new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : 
          null;
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('strikes').insert({
          user_id: userId,
          reason: reason || 'Strike added by admin',
          issued_by: user.id,
          expires_at: expiresAt?.toISOString(),
        });
        break;

      case 'reset_strikes':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('profiles')
          .update({ strike_count: 0 })
          .eq('id', userId);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Action ${action} completed successfully`
    });
  } catch (error) {
    console.error('Admin update user API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}