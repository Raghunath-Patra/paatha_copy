// frontend/app/api/video-generator/projects/[projectId]/route.ts - New route for individual project
import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders } from '../../../../utils/auth'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const authHeaders = await getAuthHeaders();
        if (!authHeaders.isAuthorized) {
        throw new Error('Authentication required');
    }

    const { projectId } = params;

    // Proxy to backend
    const response = await fetch(`${API_URL}/api/video/projects/${projectId}`, {
      method: 'GET',
      headers: authHeaders.headers,
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