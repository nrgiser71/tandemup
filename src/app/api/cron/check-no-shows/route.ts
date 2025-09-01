import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Find sessions that started more than 5 minutes ago but one or both users haven't joined
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('status', 'matched')
      .lt('start_time', fiveMinutesAgo.toISOString())
      .or('user1_joined.eq.false,user2_joined.eq.false');

    if (sessionsError) {
      console.error('Error fetching sessions for no-show check:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    let processedCount = 0;
    const noShowUsers: string[] = [];

    for (const session of sessions || []) {
      const typedSession = session as { user1_joined: boolean; user2_joined: boolean; id: string; user1_id: string; user2_id: string };
      const user1NoShow = !typedSession.user1_joined;
      const user2NoShow = !typedSession.user2_joined;

      if (user1NoShow || user2NoShow) {
        // Update session status to no_show
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('sessions')
          .update({
            status: 'no_show',
            updated_at: new Date().toISOString(),
          })
          .eq('id', typedSession.id);

        // Update no-show counts for users who didn't join
        if (user1NoShow && typedSession.user1_id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).rpc('increment_no_show_count', { 
            user_id: typedSession.user1_id 
          });
          noShowUsers.push(typedSession.user1_id);
        }

        if (user2NoShow && typedSession.user2_id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).rpc('increment_no_show_count', { 
            user_id: typedSession.user2_id 
          });
          noShowUsers.push(typedSession.user2_id);
        }

        processedCount++;

        // TODO: Send no-show emails
        // TODO: Apply penalties based on no-show count
        
        console.log(`Processed no-show for session ${typedSession.id}`);
      }
    }

    return NextResponse.json({
      message: `Processed ${processedCount} no-show sessions`,
      processedCount,
      noShowUsers: noShowUsers.length,
    });
  } catch (error) {
    console.error('Check no-shows cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}