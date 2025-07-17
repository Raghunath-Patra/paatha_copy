import { NextRequest, NextResponse } from 'next/server';

// Mock projects data - in a real app, this would come from a database
const mockProjects = [
  {
    projectId: 'project_1704123456789',
    title: 'Chemistry Lab Experiment',
    createdAt: '2024-01-01T10:00:00Z',
    status: 'completed',
    lessonStepsCount: 5,
    speakers: ['teacher', 'student1', 'student2'],
    visualFunctions: ['chemicalReactionVisual', 'moleculeStructure'],
    hasVideo: true,
    videoFiles: ['chemistry_lab_final.mp4']
  },
  {
    projectId: 'project_1704123456790',
    title: 'Math Problem Solving',
    createdAt: '2024-01-02T14:30:00Z',
    status: 'script_ready',
    lessonStepsCount: 3,
    speakers: ['teacher', 'student1'],
    visualFunctions: ['graphVisual', 'equationSolver'],
    hasVideo: false,
    videoFiles: []
  },
  {
    projectId: 'project_1704123456791',
    title: 'History Timeline',
    createdAt: '2024-01-03T09:15:00Z',
    status: 'input_only',
    lessonStepsCount: 2,
    speakers: ['teacher'],
    visualFunctions: ['timelineVisual'],
    hasVideo: false,
    videoFiles: []
  }
];

export async function GET(request: NextRequest) {
  try {
    // In a real application, you would:
    // 1. Get the user ID from the session/auth token
    // 2. Query the database for projects belonging to that user
    // 3. Return the user's projects
    
    return NextResponse.json({
      success: true,
      projects: mockProjects
    });

  } catch (error) {
    console.error('Error loading projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load projects' },
      { status: 500 }
    );
  }
}