/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateTimeSlots } from '@/lib/utils';

export const dynamic = 'force-dynamic';

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
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const selectedDate = new Date(date);
    
    // Validate date is not in the past (compare only dates, not time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    if (selectedDateOnly < today) {
      return NextResponse.json(
        { error: 'Cannot get slots for past dates' },
        { status: 400 }
      );
    }

    // Get user profile for language matching
    const { data: profileData } = await supabase
      .from('profiles')
      .select('language, timezone')
      .eq('id', user.id)
      .single();

    let profile: any = profileData;
    if (!profile) {
      console.log('No profile found for user in available API, using demo mode with default profile');
      
      // Create a mock profile for demo purposes (since Supabase is not configured)
      profile = {
        language: 'en',
        timezone: 'Europe/Amsterdam',
      };
    }

    // Generate basic time slots
    const basicSlots = generateTimeSlots(selectedDate);
    
    // Get existing sessions for this date
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // First get sessions
    const { data: existingSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        start_time,
        duration,
        status,
        user1_id,
        user2_id
      `)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .in('status', ['waiting', 'matched']);

    // Then get user profiles separately
    const userIds = existingSessions?.flatMap(session => [
      (session as any).user1_id, 
      (session as any).user2_id
    ].filter(Boolean)) || [];

    const { data: userProfiles, error: profilesError } = userIds.length > 0 ? await supabase
      .from('profiles')
      .select('id, first_name, language')
      .in('id', userIds) : { data: [] };

    console.log('DEBUG - Profiles query:', {
      userIds,
      profilesError: profilesError?.message,
      userProfiles
    });

    // Create a map of user profiles
    const profilesMap = new Map();
    userProfiles?.forEach(profile => {
      profilesMap.set((profile as any).id, profile);
    });

    // Add profiles to sessions
    const sessionsWithProfiles = existingSessions?.map(session => ({
      ...(session as any),
      user1_profile: (session as any).user1_id ? profilesMap.get((session as any).user1_id) : null,
      user2_profile: (session as any).user2_id ? profilesMap.get((session as any).user2_id) : null,
    }));

    console.log('DEBUG - Existing sessions query:', {
      dateRange: { startOfDay: startOfDay.toISOString(), endOfDay: endOfDay.toISOString() },
      sessionsFound: existingSessions?.length || 0,
      profilesFound: userProfiles?.length || 0,
      currentUserId: user.id,
      userLanguage: profile.language,
      sessionsError: sessionsError?.message,
      sessions: sessionsWithProfiles?.map(s => ({
        id: s.id,
        start_time: s.start_time,
        status: s.status,
        user1_id: s.user1_id,
        user2_id: s.user2_id,
        user1_profile: s.user1_profile,
        user2_profile: s.user2_profile
      }))
    });

    // Create a map of existing sessions by time slot
    const sessionMap = new Map();
    sessionsWithProfiles?.forEach(session => {
      const sessionTime = new Date((session as any).start_time).toTimeString().slice(0, 5);
      sessionMap.set(sessionTime, session);
    });

    // Process each time slot
    const processedSlots = basicSlots.map(slot => {
      const now = new Date();
      const slotDateTime = new Date(slot.datetime);
      
      // Don't allow booking in the past
      if (slotDateTime <= now) {
        return {
          ...slot,
          date: selectedDate.toISOString().split('T')[0],
          available: false,
          status: 'unavailable',
        };
      }

      const existingSession = sessionMap.get(slot.time);
      
      if (existingSession) {
        const session = existingSession as any;
        
        // If this is the current user's own session, show as unavailable to them
        if (session.user1_id === user.id || session.user2_id === user.id) {
          return {
            ...slot,
            date: selectedDate.toISOString().split('T')[0],
            available: false,
            status: 'unavailable',
          };
        }
        
        // Check if it's a waiting session with matching language
        if (session.status === 'waiting') {
          const waitingUserProfile = session.user1_profile || session.user2_profile;
          
          console.log(`DEBUG - Processing waiting session for slot ${slot.time}:`, {
            sessionId: session.id,
            waitingUserId: session.user1_id || session.user2_id,
            waitingUserProfile,
            currentUserLanguage: profile.language,
            languageMatch: waitingUserProfile?.language === profile.language
          });
          
          // Skip sessions where the waiting user has no profile
          if (!waitingUserProfile) {
            console.log(`DEBUG - Skipping session ${session.id} - no profile found for waiting user`);
            return {
              ...slot,
              date: selectedDate.toISOString().split('T')[0],
              available: false,
              status: 'unavailable',
            };
          }
          
          if (waitingUserProfile.language === profile.language) {
            console.log(`DEBUG - Showing waiting session to user for slot ${slot.time}`);
            return {
              ...slot,
              date: selectedDate.toISOString().split('T')[0],
              available: true,
              status: 'waiting',
              waitingUser: {
                firstName: waitingUserProfile.first_name,
                duration: session.duration,
              },
              sessionId: session.id,
            };
          } else {
            console.log(`DEBUG - Language mismatch for slot ${slot.time}: user=${profile.language}, waiting=${waitingUserProfile.language}`);
          }
        }
        
        // Session is already matched, different language, or not compatible
        return {
          ...slot,
          date: selectedDate.toISOString().split('T')[0],
          available: false,
          status: 'unavailable',
        };
      }
      
      // Available slot
      return {
        ...slot,
        date: selectedDate.toISOString().split('T')[0],
        available: true,
        status: 'available',
      };
    });

    return NextResponse.json({ 
      data: processedSlots,
      userLanguage: (profile as any).language,
      userTimezone: (profile as any).timezone,
    });
  } catch (error) {
    console.error('Available slots API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}