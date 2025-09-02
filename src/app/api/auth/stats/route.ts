/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's sessions for statistics
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        start_time,
        duration,
        status,
        user1_id,
        user2_id
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('start_time', { ascending: false });

    if (sessionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch session statistics' },
        { status: 500 }
      );
    }

    const userSessions = sessions || [];
    
    // Calculate statistics
    const completedSessions = userSessions.filter(s => (s as any).status === 'completed').length;
    const totalFocusMinutes = completedSessions * 37.5; // Average of 25 and 50 minute sessions minus checkin/checkout
    
    // Calculate streak (consecutive days with sessions in the last X days)
    const now = new Date();
    const recentSessions = userSessions.filter(session => {
      const sessionDate = new Date((session as any).start_time);
      const daysDiff = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 30 && (session as any).status === 'completed'; // Last 30 days
    });

    // Group sessions by date
    const sessionsByDate = new Map();
    recentSessions.forEach(session => {
      const date = new Date((session as any).start_time).toDateString();
      if (!sessionsByDate.has(date)) {
        sessionsByDate.set(date, []);
      }
      sessionsByDate.get(date).push(session);
    });

    // Calculate current streak
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();
      
      if (sessionsByDate.has(dateString)) {
        streak++;
      } else if (i > 0) {
        // Break streak only if it's not today (user might not have had a session today yet)
        break;
      }
    }

    // Calculate unique partners
    const partnerIds = new Set();
    userSessions.forEach(session => {
      const partnerId = (session as any).user1_id === user.id 
        ? (session as any).user2_id 
        : (session as any).user1_id;
      if (partnerId) {
        partnerIds.add(partnerId);
      }
    });

    const uniquePartners = partnerIds.size;

    return NextResponse.json({
      data: {
        totalSessions: completedSessions,
        totalFocusMinutes: Math.round(totalFocusMinutes),
        currentStreak: streak,
        uniquePartners: uniquePartners,
      }
    });
  } catch (error) {
    console.error('User stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}