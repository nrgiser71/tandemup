/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (Vercel adds this header)
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Find all waiting sessions that could be matched
    const { data: waitingSessions, error: waitingError } = await supabase
      .from('sessions')
      .select(`
        id,
        start_time,
        duration,
        user1_id,
        profiles!sessions_user1_id_fkey(language, first_name, email)
      `)
      .eq('status', 'waiting')
      .is('user2_id', null)
      .order('start_time', { ascending: true });

    if (waitingError) {
      console.error('Error fetching waiting sessions:', waitingError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    let matchedCount = 0;
    const matched: string[] = [];

    // Group sessions by time and duration
    const sessionGroups: { [key: string]: unknown[] } = {};

    waitingSessions?.forEach(session => {
      const typedSession = session as { start_time: string; duration: number; id: string; profiles?: { language: string }; user1_id?: string };
      const key = `${typedSession.start_time}_${typedSession.duration}`;
      if (!sessionGroups[key]) {
        sessionGroups[key] = [];
      }
      sessionGroups[key].push(session);
    });

    // Try to match within each group
    for (const [, sessions] of Object.entries(sessionGroups)) {
      if (sessions.length < 2) continue;

      // Group by language for better matches
      const languageGroups: { [lang: string]: unknown[] } = {};
      sessions.forEach(session => {
        const lang = (session as any).profiles?.language || 'en';
        if (!languageGroups[lang]) {
          languageGroups[lang] = [];
        }
        languageGroups[lang].push(session);
      });

      // Match within same language groups first
      for (const langSessions of Object.values(languageGroups)) {
        while (langSessions.length >= 2) {
          const session1 = langSessions.shift();
          const session2 = langSessions.shift();

          if (matched.includes((session1 as any).id) || matched.includes((session2 as any).id)) {
            continue;
          }

          // Update the first session to include the second user
          const { error: matchError } = await (supabase as any)
            .from('sessions')
            .update({
              user2_id: (session2 as any).user1_id,
              status: 'matched',
              updated_at: new Date().toISOString(),
            })
            .eq('id', (session1 as any).id);

          if (!matchError) {
            // Delete the second session since we merged them
            await (supabase as any)
              .from('sessions')
              .delete()
              .eq('id', (session2 as any).id);

            matched.push((session1 as any).id, (session2 as any).id);
            matchedCount++;

            // TODO: Send match found emails to both users
            console.log(`Matched sessions: ${(session1 as any).id} with user ${(session2 as any).user1_id}`);
          }
        }
      }
    }

    return NextResponse.json({
      message: `Matched ${matchedCount} session pairs`,
      matchedCount,
      processedSessions: waitingSessions?.length || 0,
    });
  } catch (error) {
    console.error('Match sessions cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}