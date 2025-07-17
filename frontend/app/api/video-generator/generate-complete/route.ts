// frontend/app/api/video-generator/generate-complete/route.ts - Updated to proxy to backend
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
    
    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    // For complete generation, we'll do script + video in sequence
    // First generate script
    const scriptResponse = await fetch(`${API_URL}/api/video/generate-script`, {
      method: 'POST',
      headers: authHeaders.headers,
      body: JSON.stringify({ content: body.content }),
    });

    const scriptData = await scriptResponse.json();
    
    if (!scriptResponse.ok || !scriptData.success) {
      return NextResponse.json(
        { success: false, error: scriptData.error || 'Failed to generate script' },
        { status: scriptResponse.status }
      );
    }

    // Then generate video from the script
    const project = scriptData.data;
    const videoResponse = await fetch(`${API_URL}/api/video/generate-video`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        projectId: project.projectId,
        slides: project.lessonSteps || []
      }),
    });

    const videoData = await videoResponse.json();
    
    if (!videoResponse.ok || !videoData.success) {
      // Script was generated but video failed
      return NextResponse.json({
        success: true,
        projectId: project.projectId,
        message: 'Script generated successfully, but video generation failed. You can retry video generation from your projects.',
        scriptGenerated: true,
        videoGenerated: false,
        error: videoData.error
      });
    }

    return NextResponse.json({
      success: true,
      projectId: project.projectId,
      message: 'Video generated successfully!',
      videoUrl: videoData.videoUrl,
      scriptGenerated: true,
      videoGenerated: true
    });

  } catch (error) {
    console.error('Error in generate-complete route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
