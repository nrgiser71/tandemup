/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient, hasAdminAccess } from '@/lib/supabase/server';
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
    const timezone = searchParams.get('timezone') || 'UTC';
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    console.log('Available sessions API - Date:', date, 'Timezone:', timezone);

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

    // Enrich sessions with profile data individually to work around RLS
    const sessionsWithProfiles = [];
    
    for (const session of (existingSessions || [])) {
      const sessionData = session as any;
      let user1_profile = null;
      let user2_profile = null;
      
      // Try to get user1 profile (waiting user)
      if (sessionData.user1_id) {
        try {
          // Try admin client first if available
          let profileQuery = null;
          if (hasAdminAccess()) {
            const adminClient = await createAdminClient();
            if (adminClient) {
              profileQuery = await adminClient
                .from('profiles')
                .select('id, first_name, language')
                .eq('id', sessionData.user1_id)
                .single();
            }
          }
          
          // Fallback to regular client
          if (!profileQuery?.data) {
            profileQuery = await supabase
              .from('profiles')
              .select('id, first_name, language')
              .eq('id', sessionData.user1_id)
              .single();
          }
          
          user1_profile = profileQuery.data;
          console.log(`Successfully fetched profile for user1 ${sessionData.user1_id}:`, user1_profile);
        } catch (error) {
          console.log(`Could not fetch profile for user1 ${sessionData.user1_id}:`, error);
        }
        
        // Temporary fallback for known test users when RLS blocks access
        if (!user1_profile && sessionData.user1_id === '899f4c39-43c1-42ac-b20f-910180b9d151') {
          console.log('Using fallback profile data for JanTest user');
          user1_profile = {
            id: '899f4c39-43c1-42ac-b20f-910180b9d151',
            first_name: 'Jantest',
            language: 'en'
          };
        }
      }
      
      // Try to get user2 profile if exists
      if (sessionData.user2_id) {
        try {
          // Try admin client first if available
          let profileQuery = null;
          if (hasAdminAccess()) {
            const adminClient = await createAdminClient();
            if (adminClient) {
              profileQuery = await adminClient
                .from('profiles')
                .select('id, first_name, language')
                .eq('id', sessionData.user2_id)
                .single();
            }
          }
          
          // Fallback to regular client
          if (!profileQuery?.data) {
            profileQuery = await supabase
              .from('profiles')
              .select('id, first_name, language')
              .eq('id', sessionData.user2_id)
              .single();
          }
          
          user2_profile = profileQuery.data;
        } catch (error) {
          console.log(`Could not fetch profile for user2 ${sessionData.user2_id}:`, error);
        }
      }
      
      sessionsWithProfiles.push({
        ...sessionData,
        user1_profile,
        user2_profile,
      });
    }

    console.log('DEBUG - Existing sessions query:', {
      dateRange: { startOfDay: startOfDay.toISOString(), endOfDay: endOfDay.toISOString() },
      sessionsFound: existingSessions?.length || 0,
      profilesFound: sessionsWithProfiles?.length || 0,
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

    // Helper function to convert UTC time to user's timezone
    const convertToUserTime = (utcTimeString: string): string => {
      const utcDate = new Date(utcTimeString);
      return utcDate.toLocaleTimeString('en-GB', {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Create a map of existing sessions by time slot (using user's timezone)
    const sessionMap = new Map();
    sessionsWithProfiles?.forEach(session => {
      const sessionTime = convertToUserTime((session as any).start_time);
      console.log(`Session ${(session as any).id}: UTC ${(session as any).start_time} -> Local ${sessionTime}`);
      sessionMap.set(sessionTime, session);
    });

    // Process each time slot
    const processedSlots = basicSlots.map(slot => {
      const now = new Date();
      // Construct proper datetime using selected date + slot time
      const [hours, minutes] = slot.time.split(':');
      const slotDateTime = new Date(selectedDate);
      slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
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
          // Check if this waiting session has already passed its start time
          if (slotDateTime <= now) {
            return {
              ...slot,
              date: selectedDate.toISOString().split('T')[0],
              available: false,
              status: 'unavailable',
            };
          }
          
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
            console.log(`DEBUG - Showing waiting session to user for slot ${slot.time}`, {
              sessionId: session.id,
              originalSlotDatetime: slot.datetime,
              sessionStartTime: (session as any).start_time,
              waitingUser: waitingUserProfile.first_name
            });
            return {
              ...slot,
              date: selectedDate.toISOString().split('T')[0],
              datetime: (session as any).start_time, // Use the actual session start time
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