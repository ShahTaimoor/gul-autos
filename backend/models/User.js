const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        password: {
            type: String,
            required: true,
            minLength: 6,
        },
        role: {
            type: Number,
            default: 0,
            enum: [0, 1, 2] // 0: User, 1: Admin, 2: Super Admin
        },
        address: {
            type: String
        },
        phone: {
            type: String
        },
        city: {
            type: String
        },
        username: {
            type: String,
            trim: true
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// Indexes for frequently used fields
userSchema.index({ name: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ name: 1, isDeleted: 1 }); // Compound index for common queries

module.exports = mongoose.model('User', userSchema);
