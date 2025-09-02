import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  
  // For demo purposes, return mock data for any session ID
  const mockSession = {
    id: sessionId,
    startTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago (can join now)
    duration: 25,
    status: 'matched',
    partner: {
      id: 'partner1',
      firstName: 'Alice',
      avatarUrl: undefined,
    },
    jitsiRoomName: `tandemup_${sessionId}`,
    canCancel: false,
    canJoin: true,
  };

  return NextResponse.json({ data: mockSession });
}