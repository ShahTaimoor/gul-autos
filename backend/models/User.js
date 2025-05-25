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
            default: 0
        },
        address: {
            type: String
        },
        phone: {
            type: String
        },
        city: {
            type: String
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
