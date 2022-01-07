const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        _id: String,
        password: String,
        isFrontman: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }, { versionKey: false }
);

module.exports = mongoose.model("User", userSchema);
