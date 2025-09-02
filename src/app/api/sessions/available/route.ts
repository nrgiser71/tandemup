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

    const { data: existingSessions } = await supabase
      .from('sessions')
      .select(`
        id,
        start_time,
        duration,
        status,
        user1_id,
        user2_id,
        profiles!sessions_user1_id_fkey(first_name, language)
      `)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .in('status', ['waiting', 'matched']);

    // Create a map of existing sessions by time slot
    const sessionMap = new Map();
    existingSessions?.forEach(session => {
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
        // Check if it's a waiting session with matching language
        if (
          (existingSession as any).status === 'waiting' &&
          (existingSession as any).user1_id !== user.id &&
          (existingSession as any).profiles?.language === (profile as any).language
        ) {
          return {
            ...slot,
            date: selectedDate.toISOString().split('T')[0],
            available: true,
            status: 'waiting',
            waitingUser: {
              firstName: (existingSession as any).profiles.first_name,
              duration: (existingSession as any).duration,
            },
            sessionId: (existingSession as any).id,
          };
        }
        
        // Session is already matched or not compatible
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