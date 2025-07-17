// frontend/app/api/video-generator/video/[projectId]/route.ts - New route for video streaming
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
    'Authorization': `Bearer ${token}`
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

    // Proxy to backend video streaming service
    const response = await fetch(`${API_URL}/api/video/video/${projectId}`, {
      method: 'GET',
      headers: authHeaders,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Video not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Failed to fetch video' },
        { status: response.status }
      );
    }

    // Stream the video content
    const videoStream = new ReadableStream({
      start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        function pump(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            return pump();
          });
        }

        return pump();
      }
    });

    return new NextResponse(videoStream, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `inline; filename="video_${projectId}.mp4"`,
        'Cache-Control': 'private, max-age=3600'
      }
    });

  } catch (error) {
    console.error('Error in video streaming route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}