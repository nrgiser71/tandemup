import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, hasAdminAccess } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    
    // Check admin access
    if (!await hasAdminAccess(request)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Find sessions with missing profiles
    const { data: orphanedSessions, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        user1_id,
        user2_id,
        created_at
      `)
      .not('user1_id', 'is', null);

    if (sessionError) {
      console.error('Error querying sessions:', sessionError);
      return NextResponse.json(
        { error: 'Failed to query sessions' },
        { status: 500 }
      );
    }

    const orphanedResults = [];
    let repairedCount = 0;
    let deletedCount = 0;

    for (const session of orphanedSessions) {
      // Check if user1 profile exists
      const { data: user1Profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user1_id)
        .single();

      // Check if user2 profile exists (if user2 exists)
      let user2Profile = null;
      if (session.user2_id) {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user2_id)
          .single();
        user2Profile = data;
      }

      const isOrphaned = !user1Profile || (session.user2_id && !user2Profile);
      
      if (isOrphaned) {
        const missingProfiles = [];
        if (!user1Profile) missingProfiles.push(session.user1_id);
        if (session.user2_id && !user2Profile) missingProfiles.push(session.user2_id);

        // Try to get user info from auth.users to create profiles
        let repaired = false;
        for (const userId of missingProfiles) {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(userId);
            
            if (authUser?.user) {
              // Create the missing profile
              const { error: createError } = await supabase
                .from('profiles')
                .upsert({
                  id: authUser.user.id,
                  email: authUser.user.email || '',
                  first_name: authUser.user.user_metadata?.first_name || 'User',
                  language: (authUser.user.user_metadata?.language as 'en' | 'nl' | 'fr') || 'en',
                  timezone: authUser.user.user_metadata?.timezone || 'Europe/Amsterdam',
                  subscription_status: 'trial',
                  trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                });

              if (!createError) {
                repaired = true;
                repairedCount++;
                console.log(`Repaired profile for user: ${userId}`);
              }
            }
          } catch (error) {
            console.error(`Failed to repair profile for user ${userId}:`, error);
          }
        }

        if (!repaired) {
          // Delete the orphaned session if we can't repair it
          const { error: deleteError } = await supabase
            .from('sessions')
            .delete()
            .eq('id', session.id);

          if (!deleteError) {
            deletedCount++;
            console.log(`Deleted orphaned session: ${session.id}`);
          }
        }

        orphanedResults.push({
          sessionId: session.id,
          user1_id: session.user1_id,
          user2_id: session.user2_id,
          missingProfiles,
          repaired,
          action: repaired ? 'repaired' : 'deleted'
        });
      }
    }

    return NextResponse.json({
      message: 'Orphaned session repair complete',
      totalSessions: orphanedSessions.length,
      orphanedFound: orphanedResults.length,
      profilesRepaired: repairedCount,
      sessionsDeleted: deletedCount,
      details: orphanedResults
    });

  } catch (error) {
    console.error('Repair orphaned sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}