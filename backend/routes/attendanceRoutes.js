const express = require('express');
const router = express.Router();
const { 
  addAttendance, 
  getTopPerforming,
  getAttendance,
  resetAttendance,
  getAttendanceReport
} = require('../controllers/AttendanceController');
const { isAuthorized, isAdminOrSuperAdmin, isSuperAdmin } = require('../middleware/authMiddleware');

router.post('/attendance/add', isAuthorized, isAdminOrSuperAdmin, addAttendance);
router.get('/attendance/top-performing', isAuthorized, isAdminOrSuperAdmin, getTopPerforming);
router.get('/attendance/report', isAuthorized, isAdminOrSuperAdmin, getAttendanceReport);
router.get('/attendance', isAuthorized, isAdminOrSuperAdmin, getAttendance);
router.delete('/attendance/reset/:employeeName', isAuthorized, isSuperAdmin, resetAttendance);

module.exports = router;
