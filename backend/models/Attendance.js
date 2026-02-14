const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeName: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  time: {
    type: String,
    required: [true, 'Time is required']
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late'],
    default: 'Present'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries on employeeName and date
attendanceSchema.index({ employeeName: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
