import express from 'express';
import admin from 'firebase-admin';

const router = express.Router();

const db = admin.firestore();

const convertFirestoreData = (data) => {
  if (!data) return data;
  
  const converted = { ...data };
  
  Object.keys(converted).forEach(key => {
    const value = converted[key];
    
    if (value && typeof value === 'object') {
      if (value.toDate && typeof value.toDate === 'function') {
        converted[key] = value.toDate().toISOString();
      } 
      else if (value.seconds !== undefined) {
        const timestamp = value.seconds * 1000 + (value.nanoseconds || 0) / 1000000;
        converted[key] = new Date(timestamp).toISOString();
      }
      else if (!Array.isArray(value)) {
        converted[key] = convertFirestoreData(value);
      }
    }
  });
  
  return converted;
};

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/leave-requests', verifyToken, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      type = 'vacation',
      reason,
      employeeId,
      employeeName
    } = req.body;

    if (!startDate || !endDate || !reason || !employeeId || !employeeName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({ error: 'End date cannot be before start date' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return res.status(400).json({ error: 'Start date cannot be in the past' });
    }

    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const existingLeavesSnapshot = await db.collection('leaveRequests')
      .where('employeeId', '==', employeeId)
      .where('status', 'in', ['pending', 'approved'])
      .get();

    let hasOverlap = false;
    
    existingLeavesSnapshot.docs.forEach(doc => {
      const existingLeave = doc.data();
      const existingStart = existingLeave.startDate.toDate();
      const existingEnd = existingLeave.endDate.toDate();
      
      if ((start <= existingEnd && end >= existingStart)) {
        hasOverlap = true;
      }
    });

    if (hasOverlap) {
      return res.status(400).json({ error: 'You already have a pending or approved leave request for this period' });
    }

    const leaveRequestData = {
      employeeId,
      employeeName,
      startDate: admin.firestore.Timestamp.fromDate(start),
      endDate: admin.firestore.Timestamp.fromDate(end),
      type,
      reason,
      duration,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const leaveRequestRef = await db.collection('leaveRequests').add(leaveRequestData);
    const leaveRequestDoc = await leaveRequestRef.get();

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

router.get('/leave-requests', verifyToken, async (req, res) => {
  try {
    const { status, employeeId, limit = 100 } = req.query;
    
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userDoc.data();
    let leaveRequests = [];

    if (user.role !== 'admin' && user.role !== 'manager') {
      const leaveRequestsSnapshot = await db.collection('leaveRequests')
        .where('employeeId', '==', req.user.uid)
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit))
        .get();

      leaveRequests = leaveRequestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFirestoreData(doc.data())
      }));
    } else {
      let query = db.collection('leaveRequests');
      
      if (employeeId) {
        query = query.where('employeeId', '==', employeeId);
      }
      
      if (status && status !== 'all') {
        query = query.where('status', '==', status);
      }
      
      query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));
      
      const leaveRequestsSnapshot = await query.get();
      leaveRequests = leaveRequestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFirestoreData(doc.data())
      }));
    }

    res.json(leaveRequests);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

router.get('/leave-requests/my-requests', verifyToken, async (req, res) => {
  try {
    const leaveRequestsSnapshot = await db.collection('leaveRequests')
      .where('employeeId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const leaveRequests = leaveRequestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    }));

    res.json(leaveRequests);
  } catch (error) {
    console.error('Error fetching user leave requests:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

router.get('/leave-requests/:leaveRequestId', verifyToken, async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const leaveRequestDoc = await db.collection('leaveRequests').doc(leaveRequestId).get();

    if (!leaveRequestDoc.exists) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    const leaveRequest = leaveRequestDoc.data();

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

router.put('/leave-requests/:leaveRequestId', verifyToken, async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const { status, comments } = req.body;

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const user = userDoc.data();

    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ error: 'Only managers and admins can update leave requests' });
    }

    if (!status || !['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
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

    if (status === 'approved' || status === 'rejected') {
      updateData.reviewedBy = req.user.uid;
      updateData.reviewedByName = user.fullName;
      updateData.reviewedAt = admin.firestore.FieldValue.serverTimestamp();
      updateData.comments = comments || '';
    }

    await db.collection('leaveRequests').doc(leaveRequestId).update(updateData);

    const statusMessage = status === 'approved' ? 'approved' : 'rejected';
    await db.collection('notifications').add({
      title: `Leave Request ${statusMessage.charAt(0).toUpperCase() + statusMessage.slice(1)}`,
      message: `Your ${leaveRequest.type} leave request from ${leaveRequest.startDate.toDate().toLocaleDateString()} to ${leaveRequest.endDate.toDate().toLocaleDateString()} has been ${statusMessage}${comments ? ` with comments: ${comments}` : ''}`,
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

router.put('/leave-requests/:leaveRequestId/cancel', verifyToken, async (req, res) => {
  try {
    const { leaveRequestId } = req.params;

    const leaveRequestDoc = await db.collection('leaveRequests').doc(leaveRequestId).get();
    if (!leaveRequestDoc.exists) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    const leaveRequest = leaveRequestDoc.data();

    if (leaveRequest.employeeId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to cancel this leave request' });
    }

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

router.get('/leave-requests/stats/employee/:employeeId', verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;

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

router.get('/leave-requests/team-calendar', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const user = userDoc.data();

    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ error: 'Only managers and admins can view team calendar' });
    }

    let query = db.collection('leaveRequests')
      .where('status', 'in', ['pending', 'approved']);

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      query = query.orderBy('startDate');
    }

    const leaveRequestsSnapshot = await query.get();
    
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

export default router;