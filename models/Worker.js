const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema(
    {
        name: String,
        dob: String,
        occupation: String,
        address: String,
        role: Number      // 0 = manager, 1 = guard, 2 = utility
    }, { versionKey: false }
);

module.exports = mongoose.model("Worker", workerSchema);
