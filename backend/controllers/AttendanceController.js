const Attendance = require('../models/Attendance');

// @desc    Add attendance records (bulk)
// @route   POST /api/attendance/add
// @access  Private (Admin)
const addAttendance = async (req, res) => {
  try {
    const records = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      res.status(400);
      throw new Error('Please provide an array of attendance records');
    }

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const processedRecords = [];
    const errors = [];
    const duplicateRecords = [];

    for (const record of records) {
      if (!record.employeeName || !record.date || !record.time || !record.status) {
        continue;
      }

      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);

      // 1. Check if date is today
      if (recordDate.getTime() !== today.getTime()) {
        errors.push(`Attendance for ${record.employeeName} can only be marked for today.`);
        continue;
      }

      // 2. Check for duplicate attendance for this employee today
      const existing = await Attendance.findOne({
        employeeName: record.employeeName,
        date: {
          $gte: today,
          $lt: tomorrow
        }
      });

      if (existing) {
        duplicateRecords.push(record.employeeName);
        continue;
      }

      processedRecords.push(record);
    }

    if (processedRecords.length === 0) {
      if (duplicateRecords.length > 0) {
        res.status(400);
        throw new Error(`Attendance already marked today for: ${duplicateRecords.join(', ')}`);
      } else if (errors.length > 0) {
        res.status(400);
        throw new Error(errors[0]); // Return first error
      } else {
        res.status(400);
        throw new Error('No valid records to process');
      }
    }

    // Bulk insert valid records
    const createdRecords = await Attendance.insertMany(processedRecords);

    res.status(201).json({
      success: true,
      count: createdRecords.length,
      data: createdRecords,
      message: `Successfully added ${createdRecords.length} records.`,
      warnings: [
        ...errors,
        ...(duplicateRecords.length > 0 ? [`Skipped duplicates for: ${duplicateRecords.join(', ')}`] : [])
      ]
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Get top performing employees
// @route   GET /api/attendance/top-performing
// @access  Private (Admin)
const getTopPerforming = async (req, res) => {
  try {
    const topEmployees = await Attendance.aggregate([
      // 1. Group by employeeName
      {
        $group: {
          _id: '$employeeName',
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Present'] }, 1, 0]
            }
          }
        }
      },
      // 2. Calculate percentage
      {
        $project: {
          _id: 0,
          employeeName: '$_id',
          totalRecords: 1,
          presentCount: 1,
          attendancePercentage: {
            $multiply: [
              { $divide: ['$presentCount', '$totalRecords'] },
              100
            ]
          }
        }
      },
      // 3. Sort by percentage (desc) and then presentCount (desc)
      {
        $sort: {
          attendancePercentage: -1,
          presentCount: -1
        }
      },
      // 4. Limit to top 10 (optional, but good for UI)
      {
        $limit: 10
      }
    ]);

    res.status(200).json({
      success: true,
      data: topEmployees
    });
  } catch (error) {
    res.status(500);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Get all attendance records (optional, for initial load if needed)
// @route   GET /api/attendance
// @access  Private (Admin)
const getAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find().sort({ date: -1, createdAt: -1 }).limit(100);
        res.status(200).json({
            success: true,
            data: attendance
        });
    } catch (error) {
        res.status(500);
        res.json({
            message: error.message,
            stack: process.env.NODE_ENV === 'production' ? null : error.stack,
        });
    }
};

// @desc    Reset attendance for an employee
// @route   DELETE /api/attendance/reset/:employeeName
// @access  Private (Super Admin)
const resetAttendance = async (req, res) => {
  try {
    const { employeeName } = req.params;

    if (!employeeName) {
      res.status(400);
      throw new Error('Employee name is required');
    }

    const result = await Attendance.deleteMany({ employeeName });

    if (result.deletedCount === 0) {
      res.status(404);
      throw new Error('No attendance records found for this employee');
    }

    res.status(200).json({
      success: true,
      message: `Attendance records reset for ${employeeName}`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Get attendance report grouped by employee
// @route   GET /api/attendance/report
// @access  Private (Admin)
const getAttendanceReport = async (req, res) => {
  try {
    const report = await Attendance.aggregate([
      {
        $sort: { date: -1 } // Sort by date descending
      },
      {
        $group: {
          _id: '$employeeName',
          presentRecords: {
            $push: {
              $cond: [{ $eq: ['$status', 'Present'] }, { date: '$date', time: '$time', notes: '$notes' }, '$$REMOVE']
            }
          },
          absentRecords: {
            $push: {
              $cond: [{ $eq: ['$status', 'Absent'] }, { date: '$date', notes: '$notes' }, '$$REMOVE']
            }
          },
          lateRecords: {
            $push: {
              $cond: [{ $eq: ['$status', 'Late'] }, { date: '$date', time: '$time', notes: '$notes' }, '$$REMOVE']
            }
          },
          totalPresent: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
          },
          totalAbsent: {
            $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] }
          },
          totalLate: {
            $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          employeeName: '$_id',
          presentRecords: 1,
          absentRecords: 1,
          lateRecords: 1,
          totalPresent: 1,
          totalAbsent: 1,
          totalLate: 1,
          _id: 0
        }
      },
      {
        $sort: { employeeName: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

module.exports = {
  addAttendance,
  getTopPerforming,
  getAttendance,
  resetAttendance,
  getAttendanceReport
};
