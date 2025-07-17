// frontend/app/api/video-generator/projects/route.ts - Updated to proxy to backend
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

async function getAuthHeaders() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

export async function GET(request: NextRequest) {
  try {
    const authHeaders = await getAuthHeaders();
    
    if (!authHeaders) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Proxy to backend video generation service
    const response = await fetch(`${API_URL}/api/video/projects`, {
      method: 'GET',
      headers: authHeaders,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || 'Failed to fetch projects' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in projects route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}