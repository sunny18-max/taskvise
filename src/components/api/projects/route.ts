import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Get all projects
    const projectsSnapshot = await adminDb.collection('projects').get();
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      deadline: doc.data().deadline?.toDate?.()?.toISOString() || doc.data().deadline,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    }));

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const body = await request.json();
    const {
      name,
      description,
      deadline,
      teamMembers = [],
      status = 'planning'
    } = body;

    // Validate required fields
    if (!name || !deadline) {
      return NextResponse.json(
        { error: 'Name and deadline are required' },
        { status: 400 }
      );
    }

    // Create project document
    const projectData = {
      name,
      description: description || '',
      deadline: new Date(deadline),
      teamMembers,
      status,
      progress: 0,
      totalTasks: 0,
      completedTasks: 0,
      totalHours: 0,
      completedHours: 0,
      createdBy: decodedToken.uid,
      createdAt: new Date()
    };

    const projectRef = await adminDb.collection('projects').add(projectData);

    const createdProject = {
      id: projectRef.id,
      ...projectData,
      deadline: projectData.deadline.toISOString(),
      createdAt: projectData.createdAt.toISOString()
    };

    return NextResponse.json(createdProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}