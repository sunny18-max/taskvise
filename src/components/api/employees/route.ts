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
    
    // Get all employees (users with employee role)
    const usersSnapshot = await adminDb.collection('users')
      .where('role', 'in', ['employee', 'manager'])
      .get();
    
    const employees = await Promise.all(
      usersSnapshot.docs.map(async (doc) => {
        const userData = doc.data();
        
        // Get employee stats from tasks
        const tasksSnapshot = await adminDb.collection('tasks')
          .where('assignedTo', '==', doc.id)
          .get();
        
        const totalTasks = tasksSnapshot.size;
        const completedTasks = tasksSnapshot.docs.filter(
          taskDoc => taskDoc.data().status === 'completed'
        ).length;
        
        const totalHours = tasksSnapshot.docs.reduce(
          (sum, taskDoc) => sum + (taskDoc.data().actualHours || 0), 0
        );
        
        const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          id: doc.id,
          uid: doc.id,
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role,
          department: userData.department || 'General',
          totalTasks,
          completedTasks,
          productivity,
          totalHours,
          avatar: userData.avatar,
          lastActive: userData.lastActive?.toDate?.()?.toISOString() || new Date().toISOString()
        };
      })
    );

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}