const Employee = require('../models/Employee');

// @desc    Add a new employee
// @route   POST /api/employees/add
// @access  Private (Admin)
const addEmployee = async (req, res) => {
  try {
    const { name, position, department, email, phone, joiningDate } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('Employee name is required');
    }

    const employeeExists = await Employee.findOne({ name });
    if (employeeExists) {
      res.status(400);
      throw new Error('Employee already exists');
    }

    const employee = await Employee.create({
      name,
      position,
      department,
      email,
      phone,
      joiningDate
    });

    res.status(201).json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (Admin)
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ active: true }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    res.status(500);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Delete an employee (soft delete)
// @route   DELETE /api/employees/:id
// @access  Private (Admin)
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      res.status(404);
      throw new Error('Employee not found');
    }

    // Soft delete by setting active to false
    employee.active = false;
    await employee.save();

    res.status(200).json({
      success: true,
      id: req.params.id,
      message: 'Employee removed'
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

module.exports = {
  addEmployee,
  getEmployees,
  deleteEmployee
};
