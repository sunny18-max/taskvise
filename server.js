// server.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { readFileSync } from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  });
}

const db = admin.firestore();
const auth = admin.auth();

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(bodyParser.json());

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper function to convert Firestore data to JSON-serializable format
const convertFirestoreData = (data) => {
  if (!data) return data;
  
  const converted = { ...data };
  
  // Convert Firestore Timestamps to ISO strings
  Object.keys(converted).forEach(key => {
    const value = converted[key];
    
    if (value && typeof value === 'object') {
      // Handle Firestore Timestamp
      if (value.toDate && typeof value.toDate === 'function') {
        converted[key] = value.toDate().toISOString();
      } 
      // Handle timestamp with seconds and nanoseconds
      else if (value.seconds !== undefined) {
        const timestamp = value.seconds * 1000 + (value.nanoseconds || 0) / 1000000;
        converted[key] = new Date(timestamp).toISOString();
      }
      // Handle nested objects
      else if (!Array.isArray(value)) {
        converted[key] = convertFirestoreData(value);
      }
    }
  });
  
  return converted;
};

// Get tasks for specific employee
app.get('/api/tasks/employee/:employeeId', verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const tasksSnapshot = await db.collection('tasks')
      .where('assignedTo', '==', employeeId)
      .orderBy('createdAt', 'desc')
      .get();

    const tasks = await Promise.all(
      tasksSnapshot.docs.map(async (doc) => {
        const taskData = convertFirestoreData(doc.data());
        
        if (taskData.project) {
          try {
            const projectDoc = await db.collection('projects').doc(taskData.project).get();
            if (projectDoc.exists) {
              taskData.projectName = projectDoc.data().name;
            }
          } catch (error) {
            taskData.projectName = taskData.project;
          }
        }

        return {
          id: doc.id,
          ...taskData
        };
      })
    );

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching employee tasks:', error);
    res.status(500).json({ error: 'Failed to fetch employee tasks' });
  }
});

// Get projects for specific employee
app.get('/api/projects/employee/:employeeId', verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const projectsSnapshot = await db.collection('projects').get();
    
    let projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    }));

    // Filter projects where user is a team member
    projects = projects.filter(project => 
      project.teamMembers && project.teamMembers.includes(employeeId)
    );

    // Calculate project stats
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const tasksSnapshot = await db.collection('tasks')
          .where('project', '==', project.id)
          .where('assignedTo', '==', employeeId)
          .get();
        
        const projectTasks = tasksSnapshot.docs.map(doc => convertFirestoreData(doc.data()));
        const totalTasks = projectTasks.length;
        const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...project,
          totalTasks,
          completedTasks,
          progress
        };
      })
    );

    res.json(projectsWithStats);
  } catch (error) {
    console.error('Error fetching employee projects:', error);
    res.status(500).json({ error: 'Failed to fetch employee projects' });
  }
});

// Get work sessions for specific employee
app.get('/api/work-sessions/employee/:employeeId', verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { limit = 100 } = req.query;
    
    const sessionsSnapshot = await db.collection('workSessions')
      .where('userId', '==', employeeId)
      .orderBy('startTime', 'desc')
      .limit(parseInt(limit))
      .get();

    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    }));

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching employee work sessions:', error);
    res.status(500).json({ error: 'Failed to fetch employee work sessions' });
  }
});

// Get notifications for specific employee
app.get('/api/notifications/employee/:employeeId', verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { limit = 50 } = req.query;
    
    const notificationsSnapshot = await db.collection('notifications')
      .where('userId', '==', employeeId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .get();

    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    }));

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching employee notifications:', error);
    res.status(500).json({ error: 'Failed to fetch employee notifications' });
  }
});

// Get team members endpoint
app.get('/api/team-members', verifyToken, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const teamMembers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    }));

    res.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// ===== AUTHENTICATION ENDPOINTS =====

// User registration/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, fullName, role = 'employee', department, designation, phone } = req.body;

    // Validate required fields
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    // Check if user already exists
    try {
      await auth.getUserByEmail(email);
      return res.status(400).json({ error: 'User already exists with this email' });
    } catch (error) {
      // User doesn't exist, continue with creation
    }

    // Create Firebase auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: false,
    });

    // Create user profile in Firestore
    const userProfile = {
      uid: userRecord.uid,
      email: userRecord.email,
      fullName,
      role: role || 'employee',
      department: department || 'General',
      designation: designation || 'Employee',
      phone: phone || '',
      skills: [],
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
      avatarUrl: null,
    };

    await db.collection('users').doc(userRecord.uid).set(userProfile);

    // Generate custom token for immediate login
    const customToken = await auth.createCustomToken(userRecord.uid);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        fullName,
        role,
      },
      customToken, // For immediate client-side login
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // This endpoint is mainly for server-side validation
    // Actual login should happen on client-side with Firebase Auth
    // We'll verify credentials and return user profile
    
    // For Firebase Auth, login happens on client side
    // This endpoint can be used for additional server-side checks
    res.json({ 
      message: 'Please use Firebase client SDK for authentication',
      note: 'This endpoint is for server-side validation if needed'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user profile
app.get('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const userData = convertFirestoreData(userDoc.data());
    
    // Get additional auth info
    const authUser = await auth.getUser(req.user.uid);

    res.json({
      ...userData,
      emailVerified: authUser.emailVerified,
      lastSignInTime: authUser.metadata.lastSignInTime,
      creationTime: authUser.metadata.creationTime,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
app.put('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const { fullName, department, designation, phone, skills, avatarUrl } = req.body;
    
    const updateData = {
      ...(fullName && { fullName }),
      ...(department && { department }),
      ...(designation && { designation }),
      ...(phone && { phone }),
      ...(skills && { skills }),
      ...(avatarUrl && { avatarUrl }),
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(req.user.uid).update(updateData);

    // Update auth profile if display name changed
    if (fullName) {
      await auth.updateUser(req.user.uid, {
        displayName: fullName,
      });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Create employee account (Admin only)
app.post('/api/auth/create-employee', verifyToken, async (req, res) => {
  try {
    // Check if requester is admin
    const requesterDoc = await db.collection('users').doc(req.user.uid).get();
    if (!requesterDoc.exists || requesterDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create employee accounts' });
    }

    const { email, password, fullName, role = 'employee', department, designation, phone, skills } = req.body;

    // Validate required fields
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    // Check if user already exists
    try {
      await auth.getUserByEmail(email);
      return res.status(400).json({ error: 'User already exists with this email' });
    } catch (error) {
      // User doesn't exist, continue with creation
    }

    // Create Firebase auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: false,
    });

    // Create user profile in Firestore
    const userProfile = {
      uid: userRecord.uid,
      email: userRecord.email,
      fullName,
      role: role || 'employee',
      department: department || 'General',
      designation: designation || 'Employee',
      phone: phone || '',
      skills: skills || [],
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
      createdBy: req.user.uid, // The admin who created this account
      avatarUrl: null,
    };

    await db.collection('users').doc(userRecord.uid).set(userProfile);

    res.status(201).json({
      message: 'Employee account created successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        fullName,
        role,
        username: email.split('@')[0],
        temporaryPassword: password, // Only return this for admin to share with employee
      },
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete user account (Admin only)
app.delete('/api/auth/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if requester is admin
    const requesterDoc = await db.collection('users').doc(req.user.uid).get();
    if (!requesterDoc.exists || requesterDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete user accounts' });
    }

    // Delete from Firebase Auth
    await auth.deleteUser(userId);

    // Delete from Firestore
    await db.collection('users').doc(userId).delete();

    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user account' });
  }
});

// Get all users (Admin only)
app.get('/api/auth/users', verifyToken, async (req, res) => {
  try {
    // Check if requester is admin
    const requesterDoc = await db.collection('users').doc(req.user.uid).get();
    if (!requesterDoc.exists || requesterDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view all users' });
    }

    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data()),
      // Remove sensitive information
      password: undefined,
    }));

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ===== LEAVE MANAGEMENT ENDPOINTS =====

// Create a new leave request
app.post('/api/leave-requests', verifyToken, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      type = 'vacation',
      reason,
      employeeId,
      employeeName
    } = req.body;

    // Validate required fields
    if (!startDate || !endDate || !reason || !employeeId || !employeeName) {
      return res.status(400).json({ error: 'All fields are required: startDate, endDate, reason, employeeId, employeeName' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({ error: 'End date cannot be before start date' });
    }

    // Calculate duration in days
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check for overlapping leave requests
    const existingLeavesSnapshot = await db.collection('leaveRequests')
      .where('employeeId', '==', employeeId)
      .where('status', 'in', ['pending', 'approved'])
      .get();

    const hasOverlap = existingLeavesSnapshot.docs.some(doc => {
      const existingLeave = doc.data();
      const existingStart = existingLeave.startDate.toDate();
      const existingEnd = existingLeave.endDate.toDate();
      
      return (start <= existingEnd && end >= existingStart);
    });

    if (hasOverlap) {
      return res.status(400).json({ error: 'You already have a pending or approved leave request for this period' });
    }

    const leaveRequestData = {
      employeeId,
      employeeName,
      startDate: start,
      endDate: end,
      type,
      reason,
      duration,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const leaveRequestRef = await db.collection('leaveRequests').add(leaveRequestData);
    const leaveRequestDoc = await leaveRequestRef.get();

    // Create notification for managers/admins
    const managersSnapshot = await db.collection('users')
      .where('role', 'in', ['admin', 'manager'])
      .get();

    const notificationPromises = managersSnapshot.docs.map(managerDoc => 
      db.collection('notifications').add({
        title: 'New Leave Request',
        message: `${employeeName} has submitted a ${type} leave request for ${duration} day(s)`,
        type: 'leave_request',
        read: false,
        userId: managerDoc.id,
        leaveRequestId: leaveRequestRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    );

    await Promise.all(notificationPromises);

    res.status(201).json({
      id: leaveRequestRef.id,
      ...convertFirestoreData(leaveRequestDoc.data())
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
});

// Get all leave requests (for managers/admins)
app.get('/api/leave-requests', verifyToken, async (req, res) => {
  try {
    const { status, employeeId, limit = 100 } = req.query;
    let query = db.collection('leaveRequests');

    // Check if user is manager/admin to see all requests, otherwise only their own
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const user = userDoc.data();

    if (user.role !== 'admin' && user.role !== 'manager') {
      // Regular employees can only see their own requests
      query = query.where('employeeId', '==', req.user.uid);
    } else if (employeeId) {
      // Managers/admins can filter by specific employee
      query = query.where('employeeId', '==', employeeId);
    }

    // Apply status filter
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));

    const leaveRequestsSnapshot = await query.get();
    const leaveRequests = leaveRequestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    }));

    res.json(leaveRequests);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// Get leave requests for specific employee

// Enhanced leave requests endpoint in server.js
app.get('/api/leave-requests/employee/:employeeId', verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log('Fetching leave requests for employee:', employeeId);

    // Verify the employee exists
    const employeeDoc = await db.collection('users').doc(employeeId).get();
    if (!employeeDoc.exists) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const leaveRequestsSnapshot = await db.collection('leaveRequests')
      .where('employeeId', '==', employeeId)
      .orderBy('createdAt', 'desc')
      .get();

    const leaveRequests = leaveRequestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    }));

    console.log(`Found ${leaveRequests.length} leave requests for employee ${employeeId}`);
    res.json(leaveRequests);

  } catch (error) {
    console.error('Error fetching employee leave requests:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leave requests',
      details: error.message 
    });
  }
});

// Enhanced create leave request endpoint
// app.post('/api/leave-requests', verifyToken, async (req, res) => {
//   try {
//     const {
//       startDate,
//       endDate,
//       type = 'vacation',
//       reason,
//       employeeId,
//       employeeName,
//       duration
//     } = req.body;

//     console.log('Creating leave request for:', { employeeId, employeeName, type });

//     // Validate required fields
//     if (!startDate || !endDate || !reason || !employeeId || !employeeName) {
//       return res.status(400).json({ 
//         error: 'All fields are required: startDate, endDate, reason, employeeId, employeeName' 
//       });
//     }

//     // Validate dates
//     const start = new Date(startDate);
//     const end = new Date(endDate);
    
//     if (start > end) {
//       return res.status(400).json({ error: 'End date cannot be before start date' });
//     }

//     // Check if start date is in the past
//     if (start < new Date().setHours(0, 0, 0, 0)) {
//       return res.status(400).json({ error: 'Start date cannot be in the past' });
//     }

//     // Calculate duration if not provided
//     const calculatedDuration = duration || Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

//     // Check for overlapping leave requests
//     const existingLeavesSnapshot = await db.collection('leaveRequests')
//       .where('employeeId', '==', employeeId)
//       .where('status', 'in', ['pending', 'approved'])
//       .get();

//     const hasOverlap = existingLeavesSnapshot.docs.some(doc => {
//       const existingLeave = doc.data();
//       const existingStart = existingLeave.startDate.toDate();
//       const existingEnd = existingLeave.endDate.toDate();
      
//       return (start <= existingEnd && end >= existingStart);
//     });

//     if (hasOverlap) {
//       return res.status(400).json({ 
//         error: 'You already have a pending or approved leave request for this period' 
//       });
//     }

//     const leaveRequestData = {
//       employeeId,
//       employeeName,
//       startDate: admin.firestore.Timestamp.fromDate(start),
//       endDate: admin.firestore.Timestamp.fromDate(end),
//       type,
//       reason,
//       duration: calculatedDuration,
//       status: 'pending',
//       createdAt: admin.firestore.FieldValue.serverTimestamp(),
//       updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//     };

//     const leaveRequestRef = await db.collection('leaveRequests').add(leaveRequestData);
//     const leaveRequestDoc = await leaveRequestRef.get();

//     console.log('Leave request created successfully:', leaveRequestRef.id);

//     // Create notification for managers/admins
//     const managersSnapshot = await db.collection('users')
//       .where('role', 'in', ['admin', 'manager'])
//       .get();

//     const notificationPromises = managersSnapshot.docs.map(managerDoc => 
//       db.collection('notifications').add({
//         title: 'New Leave Request',
//         message: `${employeeName} has submitted a ${type} leave request for ${calculatedDuration} day(s)`,
//         type: 'leave_request',
//         read: false,
//         userId: managerDoc.id,
//         leaveRequestId: leaveRequestRef.id,
//         createdAt: admin.firestore.FieldValue.serverTimestamp(),
//       })
//     );

//     await Promise.all(notificationPromises);

//     res.status(201).json({
//       id: leaveRequestRef.id,
//       ...convertFirestoreData(leaveRequestDoc.data())
//     });

//   } catch (error) {
//     console.error('Error creating leave request:', error);
//     res.status(500).json({ 
//       error: 'Failed to create leave request',
//       details: error.message 
//     });
//   }
// });

// Get leave request by ID
app.get('/api/leave-requests/:leaveRequestId', verifyToken, async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const leaveRequestDoc = await db.collection('leaveRequests').doc(leaveRequestId).get();

    if (!leaveRequestDoc.exists) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    const leaveRequest = leaveRequestDoc.data();

    // Check if user has permission to view this leave request
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const user = userDoc.data();

    if (leaveRequest.employeeId !== req.user.uid && user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ error: 'Not authorized to view this leave request' });
    }

    res.json({
      id: leaveRequestDoc.id,
      ...convertFirestoreData(leaveRequest)
    });
  } catch (error) {
    console.error('Error fetching leave request:', error);
    res.status(500).json({ error: 'Failed to fetch leave request' });
  }
});

// Update leave request (for managers/admins to approve/reject)
app.put('/api/leave-requests/:leaveRequestId', verifyToken, async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const { status, comments, reviewedBy, reviewedByName } = req.body;

    // Check if user is manager/admin
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const user = userDoc.data();

    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ error: 'Only managers and admins can update leave requests' });
    }

    if (!status || !['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (approved, rejected, or cancelled) is required' });
    }

    const leaveRequestDoc = await db.collection('leaveRequests').doc(leaveRequestId).get();
    if (!leaveRequestDoc.exists) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    const leaveRequest = leaveRequestDoc.data();

    const updateData = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Add review information if status is being changed by manager/admin
    if (status === 'approved' || status === 'rejected') {
      updateData.reviewedBy = req.user.uid;
      updateData.reviewedByName = user.fullName;
      updateData.reviewedAt = admin.firestore.FieldValue.serverTimestamp();
      updateData.comments = comments || '';
    }

    await db.collection('leaveRequests').doc(leaveRequestId).update(updateData);

    // Create notification for the employee
    const statusMessage = status === 'approved' ? 'approved' : 'rejected';
    await db.collection('notifications').add({
      title: `Leave Request ${statusMessage.charAt(0).toUpperCase() + statusMessage.slice(1)}`,
      message: `Your ${leaveRequest.type} leave request has been ${statusMessage}`,
      type: 'leave_status_update',
      read: false,
      userId: leaveRequest.employeeId,
      leaveRequestId: leaveRequestId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ 
      message: `Leave request ${statusMessage} successfully`,
      leaveRequestId,
      status 
    });
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ error: 'Failed to update leave request' });
  }
});

// Cancel leave request (for employees)
app.put('/api/leave-requests/:leaveRequestId/cancel', verifyToken, async (req, res) => {
  try {
    const { leaveRequestId } = req.params;

    const leaveRequestDoc = await db.collection('leaveRequests').doc(leaveRequestId).get();
    if (!leaveRequestDoc.exists) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    const leaveRequest = leaveRequestDoc.data();

    // Check if user owns this leave request
    if (leaveRequest.employeeId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to cancel this leave request' });
    }

    // Check if leave request can be cancelled (only pending requests)
    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending leave requests can be cancelled' });
    }

    await db.collection('leaveRequests').doc(leaveRequestId).update({
      status: 'cancelled',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: 'Leave request cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling leave request:', error);
    res.status(500).json({ error: 'Failed to cancel leave request' });
  }
});

// Get leave statistics
app.get('/api/leave-requests/stats/employee/:employeeId', verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Check if user is requesting their own data or is manager/admin
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const user = userDoc.data();

    if (employeeId !== req.user.uid && user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ error: 'Not authorized to view other employees leave statistics' });
    }

    const leaveRequestsSnapshot = await db.collection('leaveRequests')
      .where('employeeId', '==', employeeId)
      .get();

    const leaveRequests = leaveRequestsSnapshot.docs.map(doc => convertFirestoreData(doc.data()));

    const stats = {
      total: leaveRequests.length,
      pending: leaveRequests.filter(req => req.status === 'pending').length,
      approved: leaveRequests.filter(req => req.status === 'approved').length,
      rejected: leaveRequests.filter(req => req.status === 'rejected').length,
      cancelled: leaveRequests.filter(req => req.status === 'cancelled').length,
      totalDays: leaveRequests.filter(req => req.status === 'approved').reduce((sum, req) => sum + (req.duration || 0), 0),
      byType: {
        vacation: leaveRequests.filter(req => req.type === 'vacation').length,
        sick: leaveRequests.filter(req => req.type === 'sick').length,
        personal: leaveRequests.filter(req => req.type === 'personal').length,
        emergency: leaveRequests.filter(req => req.type === 'emergency').length,
        other: leaveRequests.filter(req => req.type === 'other').length,
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching leave statistics:', error);
    res.status(500).json({ error: 'Failed to fetch leave statistics' });
  }
});

// Get team leave calendar (for managers/admins)
app.get('/api/leave-requests/team-calendar', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Check if user is manager/admin
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const user = userDoc.data();

    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ error: 'Only managers and admins can view team calendar' });
    }

    let query = db.collection('leaveRequests')
      .where('status', 'in', ['pending', 'approved']);

    // Apply date range filter if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // This is a simplified approach - in production you might need a more complex query
      // since Firestore doesn't support range queries on multiple fields easily
      query = query.orderBy('startDate');
    }

    const leaveRequestsSnapshot = await query.get();
    
    // Filter by date range in memory if dates provided
    let leaveRequests = leaveRequestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    }));

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      leaveRequests = leaveRequests.filter(request => {
        const requestStart = new Date(request.startDate);
        const requestEnd = new Date(request.endDate);
        return (requestStart <= end && requestEnd >= start);
      });
    }

    res.json(leaveRequests);
  } catch (error) {
    console.error('Error fetching team calendar:', error);
    res.status(500).json({ error: 'Failed to fetch team calendar' });
  }
});

// ===== TASKS COLLECTION ENDPOINTS =====

// Create a new task
app.post('/api/tasks', verifyToken, async (req, res) => {
  try {
    const {
      title,
      description,
      priority = 'medium',
      dueDate,
      assignedTo,
      project,
      area,
      estimatedHours = 0
    } = req.body;

    // Validate required fields
    if (!title || !assignedTo || !dueDate) {
      return res.status(400).json({ error: 'Title, assignedTo, and dueDate are required' });
    }

    // Get assigned user details
    const assignedUserDoc = await db.collection('users').doc(assignedTo).get();
    if (!assignedUserDoc.exists) {
      return res.status(400).json({ error: 'Assigned user not found' });
    }

    const assignedUser = assignedUserDoc.data();
    const currentUserDoc = await db.collection('users').doc(req.user.uid).get();
    const currentUser = currentUserDoc.data();

    // Create task document
    const taskData = {
      title,
      description: description || '',
      status: 'pending',
      priority,
      dueDate: new Date(dueDate),
      assignedBy: req.user.uid,
      assignedByName: currentUser.fullName,
      assignedTo: assignedTo,
      assignedToName: assignedUser.fullName,
      project: project || '',
      projectName: '', // Will be populated below
      area: area || '',
      estimatedHours: estimatedHours || 0,
      actualHours: 0,
      completedAt: null,
      screenshot: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Get project name if project ID is provided
    if (project) {
      try {
        const projectDoc = await db.collection('projects').doc(project).get();
        if (projectDoc.exists) {
          taskData.projectName = projectDoc.data().name;
        }
      } catch (error) {
        console.error('Error fetching project name:', error);
      }
    }

    const taskRef = await db.collection('tasks').add(taskData);
    const taskDoc = await taskRef.get();

    // Create notification for assigned employee
    await db.collection('notifications').add({
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${title}`,
      type: 'task_assigned',
      read: false,
      userId: assignedTo,
      taskId: taskRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      id: taskRef.id,
      ...convertFirestoreData(taskDoc.data())
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get all tasks (with filtering)
app.get('/api/tasks', verifyToken, async (req, res) => {
  try {
    const { userId, status, assignedTo, project } = req.query;
    let query = db.collection('tasks');

    // If userId is provided, get tasks assigned to that user
    if (userId) {
      query = query.where('assignedTo', '==', userId);
    } else if (assignedTo) {
      query = query.where('assignedTo', '==', assignedTo);
    }

    // Apply other filters
    if (status) query = query.where('status', '==', status);
    if (project) query = query.where('project', '==', project);

    // Order by creation date
    query = query.orderBy('createdAt', 'desc');

    const tasksSnapshot = await query.get();
    const tasks = await Promise.all(
      tasksSnapshot.docs.map(async (doc) => {
        const taskData = convertFirestoreData(doc.data());
        
        // Get project name if project ID exists
        if (taskData.project) {
          try {
            const projectDoc = await db.collection('projects').doc(taskData.project).get();
            if (projectDoc.exists) {
              taskData.projectName = projectDoc.data().name;
            }
          } catch (error) {
            console.error('Error fetching project name:', error);
            taskData.projectName = taskData.project; // Fallback to ID
          }
        }

        return {
          id: doc.id,
          ...taskData
        };
      })
    );

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get tasks assigned to current user - IMPROVED ENDPOINT
app.get('/api/tasks/assigned-to-me', verifyToken, async (req, res) => {
  try {
    const { status, priority, project } = req.query;
    let query = db.collection('tasks').where('assignedTo', '==', req.user.uid);

    // Apply filters
    if (status && status !== 'all') query = query.where('status', '==', status);
    if (priority && priority !== 'all') query = query.where('priority', '==', priority);
    if (project && project !== 'all') query = query.where('project', '==', project);

    // Order by creation date
    query = query.orderBy('createdAt', 'desc');

    const tasksSnapshot = await query.get();
    const tasks = await Promise.all(
      tasksSnapshot.docs.map(async (doc) => {
        const taskData = convertFirestoreData(doc.data());
        
        // Get project name if project ID exists
        if (taskData.project) {
          try {
            const projectDoc = await db.collection('projects').doc(taskData.project).get();
            if (projectDoc.exists) {
              taskData.projectName = projectDoc.data().name;
            }
          } catch (error) {
            console.error('Error fetching project name:', error);
            taskData.projectName = taskData.project; // Fallback to ID
          }
        }

        return {
          id: doc.id,
          ...taskData
        };
      })
    );

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    res.status(500).json({ error: 'Failed to fetch assigned tasks' });
  }
});

// Get task by ID
app.get('/api/tasks/:taskId', verifyToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const taskDoc = await db.collection('tasks').doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const taskData = convertFirestoreData(taskDoc.data());
    
    // Get project name if project ID exists
    if (taskData.project) {
      try {
        const projectDoc = await db.collection('projects').doc(taskData.project).get();
        if (projectDoc.exists) {
          taskData.projectName = projectDoc.data().name;
        }
      } catch (error) {
        console.error('Error fetching project name:', error);
        taskData.projectName = taskData.project; // Fallback to ID
      }
    }

    res.json({
      id: taskDoc.id,
      ...taskData
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Update task
app.put('/api/tasks/:taskId', verifyToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const updateData = req.body;

    // Remove immutable fields
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.assignedBy;
    delete updateData.assignedByName;

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('tasks').doc(taskId).update(updateData);

    // Create notification if status changed to completed
    if (updateData.status === 'completed') {
      const taskDoc = await db.collection('tasks').doc(taskId).get();
      const task = taskDoc.data();
      
      await db.collection('notifications').add({
        title: 'Task Completed',
        message: `Task "${task.title}" has been completed by ${task.assignedToName}`,
        type: 'task_completed',
        read: false,
        userId: task.assignedBy,
        taskId: taskId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Update task status - FIXED PERMISSION ISSUE
app.put('/api/tasks/:taskId/status', verifyToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    console.log('Updating task status:', { taskId, status, userId: req.user.uid });

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Validate task exists
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskDoc.data();
    
    // FIX: Check if user is assigned to this task OR is admin/manager
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const user = userDoc.data();
    
    const isAssignedUser = task.assignedTo === req.user.uid;
    const isAdminOrManager = user.role === 'admin' || user.role === 'manager';
    
    if (!isAssignedUser && !isAdminOrManager) {
      return res.status(403).json({ error: 'Not authorized to update this task' });
    }

    const updateData = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Set completedAt if marking as completed
    if (status === 'completed') {
      updateData.completedAt = admin.firestore.FieldValue.serverTimestamp();
    } else {
      updateData.completedAt = null;
    }

    await db.collection('tasks').doc(taskId).update(updateData);

    // Create notification if status changed to completed
    if (status === 'completed') {      
      await db.collection('notifications').add({
        title: 'Task Completed',
        message: `Task "${task.title}" has been completed by ${task.assignedToName}`,
        type: 'task_completed',
        read: false,
        userId: task.assignedBy,
        taskId: taskId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    console.log('Task status updated successfully');
    res.json({ 
      message: 'Task status updated successfully',
      taskId,
      newStatus: status
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ 
      error: 'Failed to update task status',
      details: error.message 
    });
  }
});

// Delete task
app.delete('/api/tasks/:taskId', verifyToken, async (req, res) => {
  try {
    const { taskId } = req.params;

    // Check if user has permission to delete (admin or task creator)
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskDoc.data();
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const user = userDoc.data();

    if (user.role !== 'admin' && task.assignedBy !== req.user.uid) {
      return res.status(403).json({ error: 'Only admins or task creators can delete tasks' });
    }

    await db.collection('tasks').doc(taskId).delete();
    
    // Also delete related work sessions
    const workSessionsSnapshot = await db.collection('workSessions')
      .where('taskId', '==', taskId)
      .get();
    
    const batch = db.batch();
    workSessionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ===== EMPLOYEES/USERS ENDPOINTS =====

// Get all employees (users)
app.get('/api/employees', verifyToken, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    }));

    // Calculate employee stats
    const employeesWithStats = await Promise.all(
      users.map(async (user) => {
        // Get tasks for this user
        const tasksSnapshot = await db.collection('tasks')
          .where('assignedTo', '==', user.id)
          .get();
        
        const userTasks = tasksSnapshot.docs.map(doc => convertFirestoreData(doc.data()));
        const totalTasks = userTasks.length;
        const completedTasks = userTasks.filter(task => task.status === 'completed').length;
        
        // Calculate productivity
        const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Calculate total hours
        const totalHours = userTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);

        return {
          ...user,
          totalTasks,
          completedTasks,
          productivity,
          totalHours: Math.round(totalHours * 10) / 10,
          lastActive: user.lastLogin || user.createdAt || user.lastActive
        };
      })
    );

    res.json(employeesWithStats);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// ===== PROJECTS COLLECTION ENDPOINTS =====

// Create a new project
app.post('/api/projects', verifyToken, async (req, res) => {
  try {
    const {
      name,
      description,
      deadline,
      teamMembers = [],
      status = 'planning'
    } = req.body;

    if (!name || !deadline) {
      return res.status(400).json({ error: 'Name and deadline are required' });
    }

    const projectData = {
      name,
      description: description || '',
      progress: 0,
      deadline: new Date(deadline),
      totalTasks: 0,
      completedTasks: 0,
      teamMembers: teamMembers,
      teamMemberNames: [], // We'll populate this below
      totalHours: 0,
      completedHours: 0,
      status: status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Get team member names
    if (teamMembers && teamMembers.length > 0) {
      const teamMemberPromises = teamMembers.map(memberId => 
        db.collection('users').doc(memberId).get()
      );
      const teamMemberDocs = await Promise.all(teamMemberPromises);
      projectData.teamMemberNames = teamMemberDocs
        .filter(doc => doc.exists)
        .map(doc => doc.data().fullName);
    }

    const projectRef = await db.collection('projects').add(projectData);
    const projectDoc = await projectRef.get();

    // Create notifications for team members
    if (teamMembers && teamMembers.length > 0) {
      const notificationPromises = teamMembers.map(memberId => 
        db.collection('notifications').add({
          title: 'Added to Project',
          message: `You have been added to project: ${name}`,
          type: 'project_assigned',
          read: false,
          userId: memberId,
          projectId: projectRef.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      );
      await Promise.all(notificationPromises);
    }

    res.status(201).json({
      id: projectRef.id,
      ...convertFirestoreData(projectDoc.data())
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get all projects
app.get('/api/projects', verifyToken, async (req, res) => {
  try {
    const { userId, status } = req.query;
    let query = db.collection('projects');

    if (status) query = query.where('status', '==', status);

    const projectsSnapshot = await query.get();
    
    // If userId is provided, filter projects where user is a team member
    let projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    }));

    if (userId) {
      projects = projects.filter(project => 
        project.teamMembers && project.teamMembers.includes(userId)
      );
    }

    // Calculate project stats
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        // Get tasks for this project
        const tasksSnapshot = await db.collection('tasks')
          .where('project', '==', project.id)
          .get();
        
        const projectTasks = tasksSnapshot.docs.map(doc => convertFirestoreData(doc.data()));
        const totalTasks = projectTasks.length;
        const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
        const totalHours = projectTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
        const completedHours = projectTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...project,
          totalTasks,
          completedTasks,
          totalHours: Math.round(totalHours * 10) / 10,
          completedHours: Math.round(completedHours * 10) / 10,
          progress
        };
      })
    );

    res.json(projectsWithStats);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get projects for current user - NEW ENDPOINT
app.get('/api/projects/my-projects', verifyToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    // Get all projects where current user is a team member
    const projectsSnapshot = await db.collection('projects').get();
    
    let projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    }));

    // Filter projects where user is a team member
    projects = projects.filter(project => 
      project.teamMembers && project.teamMembers.includes(req.user.uid)
    );

    // Apply status filter if provided
    if (status && status !== 'all') {
      projects = projects.filter(project => project.status === status);
    }

    // Calculate project stats
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        // Get tasks for this project assigned to current user
        const tasksSnapshot = await db.collection('tasks')
          .where('project', '==', project.id)
          .where('assignedTo', '==', req.user.uid)
          .get();
        
        const projectTasks = tasksSnapshot.docs.map(doc => convertFirestoreData(doc.data()));
        const totalTasks = projectTasks.length;
        const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
        const totalHours = projectTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
        const completedHours = projectTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...project,
          totalTasks,
          completedTasks,
          totalHours: Math.round(totalHours * 10) / 10,
          completedHours: Math.round(completedHours * 10) / 10,
          progress
        };
      })
    );

    res.json(projectsWithStats);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ error: 'Failed to fetch user projects' });
  }
});

// Get project by ID
app.get('/api/projects/:projectId', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectDoc = await db.collection('projects').doc(projectId).get();

    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      id: projectDoc.id,
      ...convertFirestoreData(projectDoc.data())
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Update project
app.put('/api/projects/:projectId', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;

    delete updateData.id;
    delete updateData.createdAt;

    // If team members are updated, get their names
    if (updateData.teamMembers && Array.isArray(updateData.teamMembers)) {
      const teamMemberPromises = updateData.teamMembers.map(memberId => 
        db.collection('users').doc(memberId).get()
      );
      const teamMemberDocs = await Promise.all(teamMemberPromises);
      updateData.teamMemberNames = teamMemberDocs
        .filter(doc => doc.exists)
        .map(doc => doc.data().fullName);
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('projects').doc(projectId).update(updateData);
    
    // Create notifications for newly added team members
    if (updateData.teamMembers && Array.isArray(updateData.teamMembers)) {
      const projectDoc = await db.collection('projects').doc(projectId).get();
      const project = projectDoc.data();
      
      const notificationPromises = updateData.teamMembers.map(memberId => 
        db.collection('notifications').add({
          title: 'Added to Project',
          message: `You have been added to project: ${project.name}`,
          type: 'project_assigned',
          read: false,
          userId: memberId,
          projectId: projectId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      );
      await Promise.all(notificationPromises);
    }

    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
app.delete('/api/projects/:projectId', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if user is admin
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const user = userDoc.data();

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete projects' });
    }

    await db.collection('projects').doc(projectId).delete();
    
    // Also delete related tasks
    const tasksSnapshot = await db.collection('tasks')
      .where('project', '==', projectId)
      .get();
    
    const batch = db.batch();
    tasksSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// ===== WORK SESSIONS COLLECTION ENDPOINTS =====

// Start a work session - FIXED ENDPOINT
app.post('/api/work-sessions/start', verifyToken, async (req, res) => {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    // Check if task exists and user is assigned to it
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskDoc.data();
    if (task.assignedTo !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to start timer for this task' });
    }

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const user = userDoc.data();

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Check if there's already an active session for this user
    const activeSessionsSnapshot = await db.collection('workSessions')
      .where('userId', '==', req.user.uid)
      .where('endTime', '==', null)
      .get();

    if (!activeSessionsSnapshot.empty) {
      const activeSession = activeSessionsSnapshot.docs[0].data();
      return res.status(400).json({ 
        error: 'You already have an active work session',
        activeTaskId: activeSession.taskId
      });
    }

    const workSessionData = {
      taskId: taskId,
      userId: req.user.uid,
      employeeName: user.fullName,
      startTime: admin.firestore.FieldValue.serverTimestamp(),
      date: today,
      endTime: null,
      duration: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const sessionRef = await db.collection('workSessions').add(workSessionData);
    const sessionDoc = await sessionRef.get();

    // Update task status to in-progress
    await db.collection('tasks').doc(taskId).update({
      status: 'in-progress',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      id: sessionRef.id,
      ...convertFirestoreData(sessionDoc.data())
    });
  } catch (error) {
    console.error('Error starting work session:', error);
    res.status(500).json({ error: 'Failed to start work session' });
  }
});

// End a work session - FIXED ENDPOINT
app.post('/api/work-sessions/stop', verifyToken, async (req, res) => {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    console.log('Stopping work session for task:', taskId, 'user:', req.user.uid);

    // Find the active session for this user
    const sessionsSnapshot = await db.collection('workSessions')
      .where('taskId', '==', taskId)
      .where('userId', '==', req.user.uid)
      .where('endTime', '==', null)
      .get();

    if (sessionsSnapshot.empty) {
      return res.status(404).json({ error: 'No active work session found for this task' });
    }

    const sessionDoc = sessionsSnapshot.docs[0];
    const sessionData = sessionDoc.data();
    
    // Calculate duration
    const startTime = sessionData.startTime.toDate();
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000 / 60); // duration in minutes

    await sessionDoc.ref.update({
      endTime: admin.firestore.FieldValue.serverTimestamp(),
      duration: duration
    });

    // Update task actual hours
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (taskDoc.exists) {
      const task = taskDoc.data();
      const hoursToAdd = duration / 60; // convert minutes to hours
      
      await db.collection('tasks').doc(taskId).update({
        actualHours: (task.actualHours || 0) + hoursToAdd,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    console.log('Work session stopped successfully, duration:', duration, 'minutes');
    res.json({ 
      message: 'Work session ended successfully',
      duration: duration,
      hoursAdded: duration / 60
    });
  } catch (error) {
    console.error('Error ending work session:', error);
    res.status(500).json({ 
      error: 'Failed to end work session',
      details: error.message 
    });
  }
});

// Get work sessions
app.get('/api/work-sessions', verifyToken, async (req, res) => {
  try {
    const { userId, taskId, date, limit = 100 } = req.query;
    let query = db.collection('workSessions');

    const targetUserId = userId || req.user.uid;
    query = query.where('userId', '==', targetUserId);

    if (taskId) query = query.where('taskId', '==', taskId);
    if (date) query = query.where('date', '==', date);

    query = query.orderBy('startTime', 'desc').limit(parseInt(limit));

    const sessionsSnapshot = await query.get();
    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    }));

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching work sessions:', error);
    res.status(500).json({ error: 'Failed to fetch work sessions' });
  }
});

// Get active work session for current user
app.get('/api/work-sessions/active', verifyToken, async (req, res) => {
  try {
    const sessionsSnapshot = await db.collection('workSessions')
      .where('userId', '==', req.user.uid)
      .where('endTime', '==', null)
      .get();

    if (sessionsSnapshot.empty) {
      return res.json(null);
    }

    const sessionDoc = sessionsSnapshot.docs[0];
    const sessionData = convertFirestoreData(sessionDoc.data());
    
    res.json({
      id: sessionDoc.id,
      ...sessionData
    });
  } catch (error) {
    console.error('Error fetching active work session:', error);
    res.status(500).json({ error: 'Failed to fetch active work session' });
  }
});

// Get work sessions for current user - NEW ENDPOINT
app.get('/api/work-sessions/my-sessions', verifyToken, async (req, res) => {
  try {
    const { taskId, date, limit = 100 } = req.query;
    let query = db.collection('workSessions').where('userId', '==', req.user.uid);

    if (taskId) query = query.where('taskId', '==', taskId);
    if (date) query = query.where('date', '==', date);

    query = query.orderBy('startTime', 'desc').limit(parseInt(limit));

    const sessionsSnapshot = await query.get();
    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    }));

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching user work sessions:', error);
    res.status(500).json({ error: 'Failed to fetch user work sessions' });
  }
});

// ===== NOTIFICATIONS COLLECTION ENDPOINTS =====

// Get user notifications
app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const { userId, limit = 50, unreadOnly } = req.query;
    
    // Use the authenticated user's ID if no userId provided
    const targetUserId = userId || req.user.uid;
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`Fetching notifications for user: ${targetUserId}`);

    let query = db.collection('notifications').where('userId', '==', targetUserId);

    if (unreadOnly === 'true') {
      query = query.where('read', '==', false);
    }

    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));

    const notificationsSnapshot = await query.get();
    const notifications = notificationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertFirestoreData(data)
      };
    });

    console.log(`Found ${notifications.length} notifications for user ${targetUserId}`);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      error: 'Failed to fetch notifications',
      details: error.message 
    });
  }
});

// Get notifications for current user - NEW ENDPOINT
app.get('/api/notifications/my-notifications', verifyToken, async (req, res) => {
  try {
    const { limit = 50, unreadOnly } = req.query;

    let query = db.collection('notifications').where('userId', '==', req.user.uid);

    if (unreadOnly === 'true') {
      query = query.where('read', '==', false);
    }

    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));

    const notificationsSnapshot = await query.get();
    const notifications = notificationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertFirestoreData(data)
      };
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user notifications',
      details: error.message 
    });
  }
});

// Mark notification as read
app.put('/api/notifications/:notificationId', verifyToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { read } = req.body;

    if (!notificationId) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    const notificationDoc = await db.collection('notifications').doc(notificationId).get();
    if (!notificationDoc.exists) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = notificationDoc.data();

    // Check if user owns this notification
    if (notification.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to update this notification' });
    }

    await db.collection('notifications').doc(notificationId).update({
      read: read !== false, // Default to true if not specified
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Notification updated successfully' });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark notification as read - NEW SPECIFIC ENDPOINT
app.put('/api/notifications/:notificationId/read', verifyToken, async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    const notificationDoc = await db.collection('notifications').doc(notificationId).get();
    if (!notificationDoc.exists) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = notificationDoc.data();

    // Check if user owns this notification
    if (notification.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to update this notification' });
    }

    await db.collection('notifications').doc(notificationId).update({
      read: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/mark-all-read', verifyToken, async (req, res) => {
  try {
    const notificationsSnapshot = await db.collection('notifications')
      .where('userId', '==', req.user.uid)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    notificationsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        read: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
app.delete('/api/notifications/:notificationId', verifyToken, async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notificationDoc = await db.collection('notifications').doc(notificationId).get();
    if (!notificationDoc.exists) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = notificationDoc.data();

    // Check if user owns this notification
    if (notification.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to delete this notification' });
    }

    await db.collection('notifications').doc(notificationId).delete();
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ===== EMPLOYEE-SPECIFIC ENDPOINTS =====

// Get tasks for specific employee
app.get('/api/tasks/employee/:employeeId', verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const tasksSnapshot = await db.collection('tasks')
      .where('assignedTo', '==', employeeId)
      .orderBy('createdAt', 'desc')
      .get();

    const tasks = await Promise.all(
      tasksSnapshot.docs.map(async (doc) => {
        const taskData = convertFirestoreData(doc.data());
        
        if (taskData.project) {
          try {
            const projectDoc = await db.collection('projects').doc(taskData.project).get();
            if (projectDoc.exists) {
              taskData.projectName = projectDoc.data().name;
            }
          } catch (error) {
            taskData.projectName = taskData.project;
          }
        }

        return {
          id: doc.id,
          ...taskData
        };
      })
    );

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching employee tasks:', error);
    res.status(500).json({ error: 'Failed to fetch employee tasks' });
  }
});

// Get projects for specific employee
app.get('/api/projects/employee/:employeeId', verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const projectsSnapshot = await db.collection('projects').get();
    
    let projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    }));

    // Filter projects where user is a team member
    projects = projects.filter(project => 
      project.teamMembers && project.teamMembers.includes(employeeId)
    );

    // Calculate project stats
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const tasksSnapshot = await db.collection('tasks')
          .where('project', '==', project.id)
          .where('assignedTo', '==', employeeId)
          .get();
        
        const projectTasks = tasksSnapshot.docs.map(doc => convertFirestoreData(doc.data()));
        const totalTasks = projectTasks.length;
        const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...project,
          totalTasks,
          completedTasks,
          progress
        };
      })
    );

    res.json(projectsWithStats);
  } catch (error) {
    console.error('Error fetching employee projects:', error);
    res.status(500).json({ error: 'Failed to fetch employee projects' });
  }
});

// Get work sessions for specific employee
app.get('/api/work-sessions/employee/:employeeId', verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { limit = 100 } = req.query;
    
    const sessionsSnapshot = await db.collection('workSessions')
      .where('userId', '==', employeeId)
      .orderBy('startTime', 'desc')
      .limit(parseInt(limit))
      .get();

    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    }));

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching employee work sessions:', error);
    res.status(500).json({ error: 'Failed to fetch employee work sessions' });
  }
});

// Get notifications for specific employee
app.get('/api/notifications/employee/:employeeId', verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { limit = 50 } = req.query;
    
    const notificationsSnapshot = await db.collection('notifications')
      .where('userId', '==', employeeId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .get();

    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    }));

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching employee notifications:', error);
    res.status(500).json({ error: 'Failed to fetch employee notifications' });
  }
});

// Get team members endpoint
app.get('/api/team-members', verifyToken, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const teamMembers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    }));

    res.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// ===== FIREBASE CLIENT-SIDE AUTH INTEGRATION HELPERS =====

// Verify and get user data for client-side auth
app.post('/api/auth/verify', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const userData = convertFirestoreData(userDoc.data());
    const authUser = await auth.getUser(req.user.uid);

    res.json({
      user: {
        uid: req.user.uid,
        email: authUser.email,
        emailVerified: authUser.emailVerified,
        ...userData,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify user' });
  }
});


// Password reset endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Firebase Admin SDK doesn't have password reset method
    // This should be handled by client-side Firebase Auth
    // We can send a reset email from the server if needed
    const link = await auth.generatePasswordResetLink(email);
    
    // In a real application, you would send this link via email
    res.json({ 
      message: 'Password reset link generated',
      resetLink: link, // For testing purposes only
      note: 'In production, send this link via email service'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== HEALTH CHECK =====
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await db.collection('health').doc('status').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'ok'
    });

    // Test auth service
    await auth.listUsers(1);

    res.json({
      status: 'healthy',
      database: 'connected',
      authentication: 'working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`TaskVise server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);
});