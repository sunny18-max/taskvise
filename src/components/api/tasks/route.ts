import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Task } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Get all tasks
    const tasksSnapshot = await adminDb.collection('tasks').get();
    const tasks: Task[] = [];
    
    for (const doc of tasksSnapshot.docs) {
      const taskData = doc.data();
      
      // Get assigned employee name
      let assignedToName = 'Unknown';
      if (taskData.assignedTo) {
        const employeeDoc = await adminDb.collection('users').doc(taskData.assignedTo).get();
        if (employeeDoc.exists) {
          assignedToName = employeeDoc.data()?.fullName || 'Unknown';
        }
      }
      
      tasks.push({
        id: doc.id,
        ...taskData,
        assignedToName,
        dueDate: taskData.dueDate?.toDate?.()?.toISOString() || taskData.dueDate,
        createdAt: taskData.createdAt?.toDate?.()?.toISOString() || taskData.createdAt,
        completedAt: taskData.completedAt?.toDate?.()?.toISOString() || taskData.completedAt,
      } as Task);
    }

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
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
      title,
      description,
      assignedTo,
      project,
      priority = 'medium',
      dueDate,
      estimatedHours = 0,
      area = ''
    } = body;

    // Validate required fields
    if (!title || !assignedTo || !dueDate) {
      return NextResponse.json(
        { error: 'Title, assignedTo, and dueDate are required' },
        { status: 400 }
      );
    }

    // Create task document
    const taskData = {
      title,
      description: description || '',
      assignedTo,
      project: project || '',
      priority,
      dueDate: new Date(dueDate),
      estimatedHours: parseInt(estimatedHours) || 0,
      actualHours: 0,
      area: area || '',
      status: 'pending',
      assignedBy: decodedToken.uid,
      createdAt: new Date(),
      completedAt: null,
      screenshot: null
    };

    const taskRef = await adminDb.collection('tasks').add(taskData);

    // Create notification for assigned employee
    const notificationData = {
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${title}`,
      type: 'task_assigned',
      userId: assignedTo,
      read: false,
      createdAt: new Date(),
      taskId: taskRef.id
    };

    await adminDb.collection('notifications').add(notificationData);

    // Get assigned employee name for response
    const employeeDoc = await adminDb.collection('users').doc(assignedTo).get();
    const assignedToName = employeeDoc.exists ? employeeDoc.data()?.fullName : 'Unknown';

    const createdTask = {
      id: taskRef.id,
      ...taskData,
      assignedToName,
      dueDate: taskData.dueDate.toISOString(),
      createdAt: taskData.createdAt.toISOString()
    };

    return NextResponse.json(createdTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}