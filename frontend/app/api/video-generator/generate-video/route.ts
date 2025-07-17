// frontend/app/api/video-generator/generate-video/route.ts - Updated to proxy to backend
import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders } from '../../../utils/auth'; 


const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

export async function POST(request: NextRequest) {
  try {
    const authHeaders = await getAuthHeaders();
        if (!authHeaders.isAuthorized) {
        throw new Error('Authentication required');
    }

    const body = await request.json();
    const { projectId, slides } = body;

    if (!projectId || !slides || slides.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Project ID and slides are required' },
        { status: 400 }
      );
    }

    // Proxy to backend video generation service
    const response = await fetch(`${API_URL}/api/video-generator/generate-video`, {
      method: 'POST',
      headers: authHeaders.headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || 'Failed to generate video' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in generate-video route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}