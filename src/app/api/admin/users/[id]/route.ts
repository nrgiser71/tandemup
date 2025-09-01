import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Check if user is admin
async function isAdmin(userId: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();
    
  return profile?.email === adminEmail;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
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

    const userId = params.id;

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
      ...(profile.sessions_as_user1 || []),
      ...(profile.sessions_as_user2 || [])
    ];

    const stats = {
      totalSessions: allSessions.length,
      completedSessions: allSessions.filter(s => s.status === 'completed').length,
      cancelledSessions: allSessions.filter(s => s.status === 'cancelled').length,
      noShowSessions: allSessions.filter(s => s.status === 'no_show').length,
      upcomingSessions: allSessions.filter(s => 
        ['waiting', 'matched'].includes(s.status) && 
        new Date(s.start_time) > new Date()
      ).length,
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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
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

    const userId = params.id;
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
        await supabase
          .from('profiles')
          .update({ is_banned: true })
          .eq('id', userId);
        
        // Add strike record
        await supabase.from('strikes').insert({
          user_id: userId,
          reason: reason || 'Banned by admin',
          issued_by: user.id,
        });
        break;

      case 'unban':
        await supabase
          .from('profiles')
          .update({ is_banned: false })
          .eq('id', userId);
        break;

      case 'add_strike':
        await supabase.rpc('increment_strike_count', { user_id: userId });
        
        const expiresAt = duration ? 
          new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : 
          null;
        
        await supabase.from('strikes').insert({
          user_id: userId,
          reason: reason || 'Strike added by admin',
          issued_by: user.id,
          expires_at: expiresAt?.toISOString(),
        });
        break;

      case 'reset_strikes':
        await supabase
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