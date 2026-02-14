const express = require('express');
const router = express.Router();
const { 
  addEmployee, 
  getEmployees, 
  deleteEmployee 
} = require('../controllers/EmployeeController');
const { isAuthorized, isAdminOrSuperAdmin, isSuperAdmin } = require('../middleware/authMiddleware');

router.post('/employees/add', isAuthorized, isAdminOrSuperAdmin, addEmployee);
router.get('/employees', isAuthorized, isAdminOrSuperAdmin, getEmployees);
router.delete('/employees/:id', isAuthorized, isSuperAdmin, deleteEmployee);

module.exports = router;
