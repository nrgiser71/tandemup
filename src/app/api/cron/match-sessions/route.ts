/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Type definitions for better type safety
interface ProfileData {
  languages: string[];
  first_name: string;
  email: string;
}

interface SessionWithProfile {
  id: string;
  start_time: string;
  duration: number;
  user1_id: string;
  profiles?: ProfileData;
}

/**
 * Calculate language compatibility score between two users
 * Returns the number of common languages (higher is better)
 * Handles backward compatibility with single language strings
 */
function calculateLanguageCompatibility(languages1: string[] | string | undefined, languages2: string[] | string | undefined): number {
  // Handle backward compatibility - convert single language to array
  const user1Languages = Array.isArray(languages1) ? languages1 : languages1 ? [languages1] : ['en'];
  const user2Languages = Array.isArray(languages2) ? languages2 : languages2 ? [languages2] : ['en'];
  
  // Find common languages
  const commonLanguages = user1Languages.filter(lang => user2Languages.includes(lang));
  return commonLanguages.length;
}

/**
 * Get formatted language list for logging
 */
function formatLanguages(languages: string[] | string | undefined): string {
  if (!languages) return 'en';
  if (Array.isArray(languages)) return languages.join(', ');
  return languages;
}

export const dynamic = 'force-dynamic';

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
    // Note: During migration period, we support both 'language' and 'languages' fields
    const { data: waitingSessions, error: waitingError } = await supabase
      .from('sessions')
      .select(`
        id,
        start_time,
        duration,
        user1_id,
        profiles!sessions_user1_id_fkey(languages, first_name, email)
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
    const sessionGroups: { [key: string]: SessionWithProfile[] } = {};

    waitingSessions?.forEach(session => {
      const typedSession = session as SessionWithProfile;
      const key = `${typedSession.start_time}_${typedSession.duration}`;
      if (!sessionGroups[key]) {
        sessionGroups[key] = [];
      }
      sessionGroups[key].push(typedSession);
    });

    // Try to match within each group
    for (const [, sessions] of Object.entries(sessionGroups)) {
      if (sessions.length < 2) continue;

      // Create a copy to work with
      const availableSessions = sessions.filter(session => !matched.includes(session.id));
      
      // Match sessions with language compatibility prioritization
      while (availableSessions.length >= 2) {
        const session1 = availableSessions.shift()!;
        if (matched.includes(session1.id)) continue;

        // Find the best match for session1 based on language compatibility
        let bestMatch: SessionWithProfile | null = null;
        let bestMatchIndex = -1;
        let maxCommonLanguages = 0;

        for (let i = 0; i < availableSessions.length; i++) {
          const candidateSession = availableSessions[i];
          if (matched.includes(candidateSession.id)) continue;

          // Calculate language compatibility score
          const compatibilityScore = calculateLanguageCompatibility(
            session1.profiles?.languages,
            candidateSession.profiles?.languages
          );
          
          // Prefer matches with higher language compatibility
          if (compatibilityScore > maxCommonLanguages) {
            bestMatch = candidateSession;
            bestMatchIndex = i;
            maxCommonLanguages = compatibilityScore;
          }
        }

        // If no language-compatible match found, take the first available session
        if (!bestMatch && availableSessions.length > 0) {
          bestMatch = availableSessions[0];
          bestMatchIndex = 0;
        }

        if (bestMatch && !matched.includes(bestMatch.id)) {
          // Remove the matched session from available sessions
          availableSessions.splice(bestMatchIndex, 1);

          // Update the first session to include the second user
          const { error: matchError } = await (supabase as any)
            .from('sessions')
            .update({
              user2_id: bestMatch.user1_id,
              status: 'matched',
              updated_at: new Date().toISOString(),
            })
            .eq('id', session1.id);

          if (!matchError) {
            // Delete the second session since we merged them
            await supabase
              .from('sessions')
              .delete()
              .eq('id', bestMatch.id);

            matched.push(session1.id, bestMatch.id);
            matchedCount++;

            const user1LanguageStr = formatLanguages(session1.profiles?.languages);
            const user2LanguageStr = formatLanguages(bestMatch.profiles?.languages);
            const compatibilityScore = calculateLanguageCompatibility(
              session1.profiles?.languages,
              bestMatch.profiles?.languages
            );
            
            console.log(`Matched sessions: ${session1.id} with user ${bestMatch.user1_id}. User1 languages: [${user1LanguageStr}], User2 languages: [${user2LanguageStr}], Compatibility score: ${compatibilityScore}`);
            // TODO: Send match found emails to both users
          } else {
            console.error('Error matching sessions:', matchError);
          }
        }
      }
    }

    return NextResponse.json({
      message: `Matched ${matchedCount} session pairs`,
      matchedCount,
      processedSessions: waitingSessions?.length || 0,
      totalWaitingSessions: waitingSessions?.length || 0,
      matchedSessions: matched.length
    });
  } catch (error) {
    console.error('Match sessions cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}