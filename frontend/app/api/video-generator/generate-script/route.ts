import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    // For now, return a mock response
    // You can replace this with actual video generation logic
    const mockProject = {
      projectId: `project_${Date.now()}`,
      title: 'Educational Video Script',
      createdAt: new Date().toISOString(),
      status: 'script_ready',
      speakers: {
        teacher: { 
          voice: 'aditi', 
          model: 'lightning-v2', 
          name: 'Prof. Priya', 
          color: '#1a5276', 
          gender: 'female' 
        },
        student1: { 
          voice: 'nikita', 
          model: 'lightning-v2', 
          name: 'Sneha', 
          color: '#a9dfbf', 
          gender: 'female' 
        },
        student2: { 
          voice: 'lakshya', 
          model: 'lightning-v2', 
          name: 'Arjun', 
          color: '#f39c12', 
          gender: 'male' 
        }
      },
      lessonSteps: [
        {
          title: 'Introduction to the Topic',
          speaker: 'teacher',
          content: 'Welcome to today\'s lesson on educational content creation.',
          content2: 'We will explore how to transform text into engaging video content.',
          narration: 'Today we will learn about creating educational videos from text content.',
          visualDuration: 5,
          isComplex: false,
          visual: {
            type: 'introductionVisual',
            params: ['Introduction', 'Educational Videos']
          }
        },
        {
          title: 'Main Content',
          speaker: 'student1',
          content: 'This is where the main educational content would be presented.',
          content2: 'Based on the input provided by the user.',
          narration: 'Let\'s dive into the main content of our lesson.',
          visualDuration: 8,
          isComplex: true,
          visual: {
            type: 'contentVisual',
            params: ['Main Content', 'Details']
          }
        },
        {
          title: 'Conclusion',
          speaker: 'student2',
          content: 'To summarize what we have learned today.',
          content2: 'We explored the process of video generation from text.',
          narration: 'In conclusion, we have covered the key concepts.',
          visualDuration: 4,
          isComplex: false,
          visual: {
            type: 'conclusionVisual',
            params: ['Summary', 'Key Points']
          }
        }
      ],
      visualFunctions: {
        introductionVisual: `function introductionVisual(ctx, title, subtitle) {
          ctx.save();
          ctx.fillStyle = '#3498db';
          ctx.fillRect(220, 220, 560, 360);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(title || 'Introduction', 500, 350);
          ctx.font = '18px Arial';
          ctx.fillText(subtitle || 'Educational Content', 500, 380);
          ctx.restore();
        }`,
        contentVisual: `function contentVisual(ctx, title, details) {
          ctx.save();
          ctx.fillStyle = '#e74c3c';
          ctx.fillRect(220, 220, 560, 360);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 22px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(title || 'Main Content', 500, 350);
          ctx.font = '16px Arial';
          ctx.fillText(details || 'Detailed Information', 500, 380);
          ctx.restore();
        }`,
        conclusionVisual: `function conclusionVisual(ctx, title, summary) {
          ctx.save();
          ctx.fillStyle = '#27ae60';
          ctx.fillRect(220, 220, 560, 360);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(title || 'Conclusion', 500, 350);
          ctx.font = '16px Arial';
          ctx.fillText(summary || 'Key Takeaways', 500, 380);
          ctx.restore();
        }`
      }
    };

    return NextResponse.json({
      success: true,
      data: mockProject
    });

  } catch (error) {
    console.error('Error generating script:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate script' },
      { status: 500 }
    );
  }
}