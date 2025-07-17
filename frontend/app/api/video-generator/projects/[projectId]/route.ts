// frontend/app/api/video-generator/projects/[projectId]/route.ts - New route for individual project
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

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const authHeaders = await getAuthHeaders();
    
    if (!authHeaders) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { projectId } = params;

    // Proxy to backend
    const response = await fetch(`${API_URL}/api/video/projects/${projectId}`, {
      method: 'GET',
      headers: authHeaders,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || 'Failed to fetch project' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error in project route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const authHeaders = await getAuthHeaders();
    
    if (!authHeaders) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { projectId } = params;

    // Proxy to backend
    const response = await fetch(`${API_URL}/api/video/projects/${projectId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || 'Failed to delete project' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in delete project route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}