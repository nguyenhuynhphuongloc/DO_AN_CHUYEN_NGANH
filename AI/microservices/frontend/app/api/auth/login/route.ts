import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Mock validation
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Mock login - accept testuser@example.com:123456
    if (email === 'testuser@example.com' && password === '123456') {
      return NextResponse.json({
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        user: {
          id: 'user-123',
          email: 'testuser@example.com',
          fullName: 'Test User',
        },
      });
    }

    // Any other email/password - also accept for testing
    return NextResponse.json({
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      user: {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        email,
        fullName: email.split('@')[0],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Login failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
